import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/appError';

// ==========================================
// AI INSIGHTS SERVICE (Day 10 — Groq integration)
// ==========================================
// Turns a user's REAL analysis data (metrics + findings already stored by
// AnalysisEngineService) into a natural-language engineering summary via
// Groq's OpenAI-compatible chat API.
//
// Core rule: the model may only restate what's in the evidence we hand it. It
// is never asked to guess, estimate, or fill gaps — if there's no analysis
// yet, we don't call it at all (see generateInsights below). This keeps the
// feature consistent with the rest of the app: nothing on screen should look
// measured unless it actually was.

const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Shape the model's JSON reply must match. response_format:'json_object'
 * (set below) makes Groq return *valid* JSON, but says nothing about its
 * fields — this schema is what actually guards against a wrong shape, and
 * .safeParse() means a bad reply becomes a clean 500 instead of us handing
 * malformed data to the frontend.
 */
const InsightsSchema = z.object({
  summary: z.string().min(1),
  strengths: z
    .array(z.object({ title: z.string().min(1), detail: z.string().min(1) }))
    .min(1)
    .max(6),
  risks: z
    .array(
      z.object({
        title: z.string().min(1),
        severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
        detail: z.string().min(1)
      })
    )
    .max(6),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(1),
        rationale: z.string().min(1),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
      })
    )
    .min(1)
    .max(6)
});

export type AiInsights = z.infer<typeof InsightsSchema>;

export interface AiInsightsResult {
  /** False when the user has no completed analyses — no LLM call is made in that case. */
  hasEvidence: boolean;
  insights: AiInsights | null;
  evidence: {
    repositoriesAnalyzed: number;
    averageScore: number | null;
  };
}

// ── Prompt construction ──────────────────────────────────────

/** Renders one repository's real metrics/findings as plain-text evidence for the prompt. */
function formatRepoEvidence(
  repoName: string,
  language: string | null,
  analysis: {
    overallScore: number;
    healthStatus: string;
    metrics: { category: string; score: number; detail: string | null }[];
    findings: { severity: string; title: string; description: string }[];
  }
): string {
  const metricsText = analysis.metrics
    .map((m) => `    - ${m.category}: ${Math.round(m.score)}/100${m.detail ? ` — ${m.detail}` : ''}`)
    .join('\n');

  const findingsText =
    analysis.findings.length > 0
      ? analysis.findings.map((f) => `    - [${f.severity}] ${f.title}: ${f.description}`).join('\n')
      : '    - none recorded';

  return [
    `Repository "${repoName}" (${language ?? 'unknown language'}) — overall score ${analysis.overallScore}/100, health ${analysis.healthStatus}`,
    '  Metrics:',
    metricsText,
    '  Findings:',
    findingsText
  ].join('\n');
}

/**
 * The evidence-only instruction is repeated in both the system message (see
 * callGroq) and here — belt-and-suspenders, since a single instruction is
 * easier for the model to drift from over a long generation.
 */
function buildPrompt(evidenceBlocks: string[]): string {
  return `Below is REAL, MEASURED static-analysis data for a developer's repositories — not claims, not a resume, not an estimate. Base your entire response ONLY on this evidence. Do not invent facts, numbers, or details that are not present below. Every item you write must be traceable to a specific metric or finding listed.

${evidenceBlocks.join('\n\n')}

Respond with a single JSON object, no markdown fences, no commentary outside the JSON, matching exactly this shape:
{
  "summary": "2-4 sentence overview of what the evidence shows",
  "strengths": [{"title": "short title", "detail": "1 sentence, citing the specific metric or repo it's based on"}],
  "risks": [{"title": "short title", "severity": "HIGH|MEDIUM|LOW", "detail": "1 sentence, citing the specific finding or low metric it's based on"}],
  "recommendations": [{"title": "short actionable title", "rationale": "1 sentence, tied to a specific finding", "priority": "HIGH|MEDIUM|LOW"}]
}

Include 2-5 items in "strengths" and "recommendations". "risks" may be empty if nothing genuinely concerning is in the evidence — do not manufacture a risk just to fill the array.`;
}

// ── Public API ────────────────────────────────────────────────

export class AiService {
  /**
   * Generates an evidence-grounded engineering summary for a user via Groq.
   *
   * Returns hasEvidence:false without calling the model at all when the user
   * has no completed analyses — an LLM asked to summarize nothing will
   * confabulate plausible-sounding strengths/risks, which is exactly the kind
   * of unearned claim this product exists to avoid.
   */
  static async generateInsights(userId: string): Promise<AiInsightsResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        repositories: {
          include: {
            analyses: {
              where: { status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { metrics: true, findings: true }
            }
          }
        }
      }
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    const analyzed = user.repositories
      .map((repo) => ({ repo, analysis: repo.analyses[0] }))
      .filter((x): x is { repo: typeof x.repo; analysis: NonNullable<typeof x.analysis> } => Boolean(x.analysis));

    if (analyzed.length === 0) {
      return {
        hasEvidence: false,
        insights: null,
        evidence: { repositoriesAnalyzed: 0, averageScore: null }
      };
    }

    const averageScore =
      Math.round((analyzed.reduce((sum, x) => sum + x.analysis.overallScore, 0) / analyzed.length) * 10) / 10;

    const evidenceBlocks = analyzed.map((x) =>
      formatRepoEvidence(x.repo.name, x.repo.language, x.analysis)
    );

    const insights = await AiService.callGroq(buildPrompt(evidenceBlocks));

    return {
      hasEvidence: true,
      insights,
      evidence: { repositoriesAnalyzed: analyzed.length, averageScore }
    };
  }

  /**
   * Sends the prompt to Groq and returns validated insights, or throws.
   *
   * Every failure mode maps to a specific, user-facing error instead of an
   * unhandled crash: missing key, unreachable/slow provider (aborted via the
   * timeout below), a non-2xx response, an empty reply, invalid JSON, and
   * JSON that parses but doesn't match InsightsSchema are all handled
   * separately so the real cause is never swallowed into a generic 500.
   */
  private static async callGroq(prompt: string): Promise<AiInsights> {
    if (!env.GROQ_API_KEY) {
      throw AppError.serviceUnavailable('AI insights are not configured on this server (missing GROQ_API_KEY).');
    }

    // fetch() has no built-in timeout — without this, a hung provider would
    // hang the request indefinitely instead of failing cleanly.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are an engineering evidence analyst. You only report what is explicitly present in the data you are given. You respond with raw JSON only — no markdown code fences, no prose outside the JSON object.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        }),
        signal: controller.signal
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw AppError.serviceUnavailable('AI insights request timed out.');
      }
      throw AppError.serviceUnavailable(`Could not reach the AI provider: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text();
      throw AppError.serviceUnavailable(`AI provider returned ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw AppError.internal('AI provider returned an empty response.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw AppError.internal('AI provider returned malformed JSON.');
    }

    const validated = InsightsSchema.safeParse(parsed);
    if (!validated.success) {
      throw AppError.internal('AI provider response did not match the expected shape.');
    }

    return validated.data;
  }
}
