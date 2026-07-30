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
      const secretRegex = /(?:aws_secret|api_key|secret_key|private_key|password|jwt_secret)\s*[:=]\s*["']([^"']{8,})["']/gi;
      let secretMatch;
      while ((secretMatch = secretRegex.exec(content)) !== null) {
        secretWarnings++;
        findings.push({
          severity: SeverityLevel.CRITICAL,
          category: 'SECURITY',
          title: 'Potential Hardcoded Secret Detected',
          description: `Line contains suspicious hardcoded secret key pattern: "${secretMatch[0].slice(0, 30)}..."`,
          filePath,
          recommendation: 'Move sensitive credentials to environment variables (.env) or a secure secrets manager.'
        });
      }

      // Dangerous Code Scanner Patterns
      if (/\beval\s*\(|\bexec\s*\(/.test(content)) {
        findings.push({
          severity: SeverityLevel.HIGH,
          category: 'SECURITY',
          title: 'Insecure Dynamic Execution',
          description: 'Detected usage of eval() or exec() which can lead to remote code execution.',
          filePath,
          recommendation: 'Replace eval/exec dynamic string execution with safer native logic.'
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
