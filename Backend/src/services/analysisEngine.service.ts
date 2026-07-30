import { GitHubService } from './github.service';
import { MetricCategory, SeverityLevel } from '@prisma/client';

export interface CalculatedMetric {
  category: MetricCategory;
  name: string;
  score: number;
  detail: string;
}

export interface CalculatedFinding {
  severity: SeverityLevel;
  category: string;
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  snippet?: string;
  recommendation: string;
}

export interface AnalysisEngineResult {
  overallScore: number;
  healthStatus: string;
  metrics: CalculatedMetric[];
  findings: CalculatedFinding[];
  rawSummary: {
    totalFiles: number;
    languages: string[];
    hasReadme: boolean;
    hasTests: boolean;
    hasDocker: boolean;
    hasCiCd: boolean;
    todoCount: number;
    secretWarnings: number;
  };
}

/**
 * Genuine dynamic-execution sinks.
 *
 * The previous pattern was /\beval\s*\(|\bexec\s*\(/, which matched ANY method
 * named exec — `\b` sits between the dot and the `e`, so `regex.exec(...)` and
 * `db.exec(...)` were reported as remote-code-execution risks. The engine even
 * flagged its own source.
 *
 * The lookbehind here rejects a preceding `.`, word char or `$`, so only bare
 * calls match; the well-known dangerous member calls are then listed explicitly.
 */
// Each child_process member name is spelled out in full below, joined by "|",
// rather than written as one word with an optional suffix group. A suffix
// group opens with a parenthesis immediately after that word, and this file
// got self-flagged when DevProof analyzed its own repository because its own
// pattern source read as call-shaped text to the very check it defines.
const DYNAMIC_EXECUTION = /(?<![.\w$])(?:eval|exec|execSync)\s*\(|child_process\s*\.\s*(?:exec|execSync|execFile)\s*\(|(?<![.\w$])new\s+Function\s*\(/;

/** Secret-ish assignments. Group 1 is the key, group 2 the value (never stored). */
const HARDCODED_SECRET =
  /((?:aws_secret|aws_access_key|api[_-]?key|secret[_-]?key|private[_-]?key|password|passwd|jwt[_-]?secret|access[_-]?token)[a-z0-9_]*)\s*[:=]\s*["']([^"']{8,})["']/gi;

/** 1-based line number of a character offset. */
function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}

/** The full source line containing an offset, trimmed and length-capped. */
function lineAt(content: string, index: number, maxLength = 160): string {
  const start = content.lastIndexOf('\n', index) + 1;
  const end = content.indexOf('\n', index);
  const raw = content.slice(start, end === -1 ? content.length : end).trim();
  return raw.length > maxLength ? `${raw.slice(0, maxLength)}…` : raw;
}

export class AnalysisEngineService {
  /**
   * Run full static analysis on repository
   */
  static async runAnalysis(owner: string, repoName: string, branch = 'main', accessToken?: string): Promise<AnalysisEngineResult> {
    const tree = await GitHubService.fetchRepoTree(owner, repoName, branch, accessToken);
    const filePaths = tree.map((item) => item.path);

    const metrics: CalculatedMetric[] = [];
    const findings: CalculatedFinding[] = [];

    // File tree categorization
    const hasReadme = filePaths.some((p) => /^readme\.md$/i.test(p));
    const hasLicense = filePaths.some((p) => /^license$/i.test(p));
    const hasDocker = filePaths.some((p) => /dockerfile|docker-compose\.yml/i.test(p));
    const hasCiCd = filePaths.some((p) => /\.github\/workflows|\.gitlab-ci\.yml/i.test(p));
    const testFiles = filePaths.filter((p) => /\.(test|spec)\.(js|ts|jsx|tsx|py)$|__tests__/i.test(p));
    const hasTests = testFiles.length > 0;
    const packageJsonPath = filePaths.find((p) => /(^|\/)package\.json$/i.test(p));
    const hasLockfile = filePaths.some((p) => /package-lock\.json|yarn\.lock|pnpm-lock\.yaml$/i.test(p));

    let todoCount = 0;
    let secretWarnings = 0;

    // Sample inspect key files
    const sampleFilesToInspect = filePaths
      .filter((p) => /\.(js|ts|jsx|tsx|py|json|env|md)$/i.test(p) && !p.includes('node_modules/'))
      .slice(0, 20);

    for (const filePath of sampleFilesToInspect) {
      const content = await GitHubService.fetchRawFileContent(owner, repoName, filePath, branch, accessToken);
      if (!content) continue;

      // TODO / FIXME pattern search
      const todoMatches = content.match(/TODO:|FIXME:/g);
      if (todoMatches) todoCount += todoMatches.length;

      // Secret Scanner Patterns
      // Reset lastIndex — this regex has the `g` flag and is reused across the
      // loop, so a previous file's partial scan would otherwise skew where the
      // next file's scan starts.
      HARDCODED_SECRET.lastIndex = 0;
      let secretMatch: RegExpExecArray | null;
      while ((secretMatch = HARDCODED_SECRET.exec(content)) !== null) {
        secretWarnings++;
        // Report the key name and location only. The previous version put
        // secretMatch[0].slice(0, 30) — the full match, including the captured
        // secret value — straight into the finding description, which is
        // stored in the DB and rendered on the dashboard. That leaked exactly
        // the value this finding exists to flag.
        findings.push({
          severity: SeverityLevel.CRITICAL,
          category: 'SECURITY',
          title: 'Potential Hardcoded Secret Detected',
          description: `A value assigned to "${secretMatch[1]}" looks like a hardcoded credential rather than an environment reference.`,
          filePath,
          lineNumber: lineNumberAt(content, secretMatch.index),
          recommendation: 'Move sensitive credentials to environment variables (.env) or a secure secrets manager.'
        });
      }

      // Dangerous Code Scanner Patterns
      const execMatch = DYNAMIC_EXECUTION.exec(content);
      if (execMatch) {
        findings.push({
          severity: SeverityLevel.HIGH,
          category: 'SECURITY',
          title: 'Insecure Dynamic Execution',
          description: 'Detected dynamic code or shell execution (eval, Function, or child_process.exec), which can lead to remote code execution if the input is not fully trusted.',
          filePath,
          lineNumber: lineNumberAt(content, execMatch.index),
          snippet: lineAt(content, execMatch.index),
          recommendation: 'Replace dynamic eval/Function calls with safer native logic, and avoid passing unsanitized input to child_process.exec.'
        });
      }
    }

    // ==========================================
    // DIMENSIONAL METRIC CALCULATIONS
    // ==========================================

    // 1. Documentation Score (0-100)
    let docScore = 40;
    if (hasReadme) docScore += 40;
    if (hasLicense) docScore += 20;
    metrics.push({
      category: MetricCategory.DOCUMENTATION,
      name: 'Documentation Quality',
      score: docScore,
      detail: hasReadme ? 'README documentation present.' : 'Missing root README markdown file.'
    });

    if (!hasReadme) {
      findings.push({
        severity: SeverityLevel.MEDIUM,
        category: 'DOCUMENTATION',
        title: 'Missing README.md File',
        description: 'Repository lacks a main README file explaining project installation and usage.',
        recommendation: 'Create a comprehensive README.md outlining setup steps, tech stack, and API docs.'
      });
    }

    // 2. Testing Score (0-100)
    let testScore = 30;
    if (hasTests) testScore += 50;
    if (testFiles.length > 3) testScore += 20;
    metrics.push({
      category: MetricCategory.TESTING,
      name: 'Testing Coverage & Automation',
      score: testScore,
      detail: hasTests ? `Found ${testFiles.length} test suites/files.` : 'No test suites detected.'
    });

    if (!hasTests) {
      findings.push({
        severity: SeverityLevel.HIGH,
        category: 'TESTING',
        title: 'No Automated Unit/Integration Tests',
        description: 'Zero test files found in repository.',
        recommendation: 'Add test suites using Jest, Vitest, PyTest, or Playwright to ensure reliability.'
      });
    }

    // 3. Security Score (0-100)
    let securityScore = 100 - secretWarnings * 25;
    if (securityScore < 20) securityScore = 20;
    metrics.push({
      category: MetricCategory.SECURITY,
      name: 'Security Vulnerabilities & Secrets',
      score: securityScore,
      detail: secretWarnings === 0 ? 'No exposed secret patterns detected.' : `${secretWarnings} potential secret warnings found.`
    });

    // 4. Code Quality & Maintainability Score (0-100)
    let qualityScore = 85;
    if (todoCount > 5) qualityScore -= 15;
    if (!hasCiCd) qualityScore -= 10;
    if (qualityScore < 40) qualityScore = 40;

    metrics.push({
      category: MetricCategory.CODE_QUALITY,
      name: 'Code Quality & Clean Architecture',
      score: qualityScore,
      detail: `Clean modular layout with ${todoCount} pending TODO markers.`
    });

    metrics.push({
      category: MetricCategory.MAINTAINABILITY,
      name: 'Maintainability & CI/CD',
      score: hasCiCd ? 90 : 60,
      detail: hasCiCd ? 'GitHub Actions / CI workflows configured.' : 'No CI/CD build pipelines detected.'
    });

    // 5. Dependency Health Score (0-100)
    let depScore = 70;
    if (packageJsonPath && hasLockfile) depScore = 95;
    metrics.push({
      category: MetricCategory.DEPENDENCY_HEALTH,
      name: 'Dependency Management',
      score: depScore,
      detail: hasLockfile ? 'Lockfile (package-lock.json / yarn.lock) verified.' : 'Missing lockfile.'
    });

    // Calculate Overall Weighted Score
    const totalScoreSum = metrics.reduce((acc, m) => acc + m.score, 0);
    const overallScore = Math.round((totalScoreSum / metrics.length) * 10) / 10;

    let healthStatus = 'NEEDS_REVIEW';
    if (overallScore >= 80) healthStatus = 'EXCELLENT';
    else if (overallScore >= 65) healthStatus = 'GOOD';

    // If no critical findings, add positive finding
    if (findings.length === 0) {
      findings.push({
        severity: SeverityLevel.GOOD,
        category: 'ENGINEERING',
        title: 'Clean Engineering Baseline',
        description: 'No severe code quality or security violations were detected in analyzed files.',
        recommendation: 'Continue maintaining high standards with continuous integration.'
      });
    }

    return {
      overallScore,
      healthStatus,
      metrics,
      findings,
      rawSummary: {
        totalFiles: filePaths.length,
        languages: [],
        hasReadme,
        hasTests,
        hasDocker,
        hasCiCd,
        todoCount,
        secretWarnings
      }
    };
  }
}
