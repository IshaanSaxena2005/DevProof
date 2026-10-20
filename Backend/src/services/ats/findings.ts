import type { AtsCheck, AtsKeywordAnalysis, AtsStrength, AtsWeakness, Severity } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// ATS STRENGTHS & WEAKNESSES
// ==========================================
// Every observation is grounded in a line the parser actually read, and every
// weakness carries a fix the user can apply without inventing a fact.
//
// The rules that keep this honest:
//  - A strength without evidence is an invention — evidence arrays are never
//    empty, and each claim is tied to the exact lines that support it.
//  - Recommendations never tell the user to add experience, projects,
//    certifications or technologies they do not have. Where wording help is
//    offered, it uses placeholders the user must fill with their facts.
//  - Severity follows defined rules (see SEVERITY_BY_RULE), not vibes.

export interface FindingInput {
  analysis: ResumeAnalysis;
  sectionChecks: AtsCheck[];
  keywords: AtsKeywordAnalysis;
}

/** Highlights that state a number — the quantifiable-outcome signal. */
function quantified(highlights: string[]): string[] {
  return highlights.filter((h) => /\d/.test(h));
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Weakest-first wording a highlight may open with — a real, small list. */
const WEAK_OPENERS = /^(responsible for|worked on|helped( with)?|duties included|involved in|participated in)\b/i;

function cap(lines: string[], n = 3): string[] {
  return lines.slice(0, n).map((line) => (line.length > 160 ? `${line.slice(0, 157)}…` : line));
}

export function buildFindings(input: FindingInput): { strengths: AtsStrength[]; weaknesses: AtsWeakness[] } {
  const { analysis, keywords } = input;
  const strengths: AtsStrength[] = [];
  const weaknesses: AtsWeakness[] = [];

  const taxonomyTerms = keywords.keywords.filter((k) => k.source === 'taxonomy');
  const allHighlights = analysis.experience.flatMap((e) => e.highlights);
  const quantifiedHighlights = quantified(allHighlights);

  /* ── strengths ─────────────────────────────────────────────────────── */

  if (analysis.contact.email && analysis.contact.phone && analysis.contact.links.length > 0) {
    strengths.push({
      id: 'complete-contact',
      title: 'Every contact route is present',
      explanation:
        'Email, phone and a profile link all appear in the header, so a screener can reach you however they prefer and an ATS can parse the contact block completely.',
      evidence: [analysis.contact.email, analysis.contact.phone, ...analysis.contact.links.map((l) => l.url)]
    });
  }

  if (analysis.summary) {
    strengths.push({
      id: 'summary-present',
      title: 'The resume opens with a professional summary',
      explanation:
        'A summary frames the document immediately: role, focus and scope are readable before the first section, which is what both parsers and screeners read first.',
      evidence: cap([analysis.summary], 1)
    });
  }

  if (allHighlights.length > 0 && quantifiedHighlights.length >= 2) {
    strengths.push({
      id: 'quantified-impact',
      title: 'Achievements carry measurable outcomes',
      explanation: `${quantifiedHighlights.length} of ${allHighlights.length} experience bullets state a number — scale, speed, coverage or size. Numbers are what a screener remembers and what a points-based screen can credit.`,
      evidence: cap(quantifiedHighlights)
    });
  }

  if (analysis.experience.length > 0) {
    const complete = analysis.experience.filter(
      (e) => e.role && e.organization && e.period && e.highlights.length > 0
    );
    if (complete.length === analysis.experience.length) {
      strengths.push({
        id: 'structured-roles',
        title: 'Every role is fully structured',
        explanation: `All ${complete.length} role${complete.length === 1 ? '' : 's'} carry a title, an organisation, dates and bullet points — the complete shape an ATS needs to place each entry on a timeline.`,
        evidence: cap(complete.map((e) => e.evidence))
      });
    }
  }

  if (taxonomyTerms.length >= 8) {
    strengths.push({
      id: 'skills-breadth',
      title: 'Broad, named technology coverage',
      explanation: `The document names ${taxonomyTerms.length} distinct technologies from the shared skill taxonomy. Named tools are what keyword screens match on — adjectives are not.`,
      evidence: cap(taxonomyTerms.map((t) => t.term), 8)
    });
  }

  const crossEvidenced = taxonomyTerms.filter(
    (t) => t.sections.includes('experience') || t.sections.includes('projects')
  );
  if (crossEvidenced.length >= 3) {
    strengths.push({
      id: 'skills-in-context',
      title: 'Technologies are attached to real work',
      explanation: `${crossEvidenced.length} technologies appear inside experience or project descriptions, not only in the skills list — the difference between a claim and a mentioned context of use.`,
      evidence: cap(crossEvidenced.map((t) => `${t.term} (${t.sections.filter((s) => s !== 'skills').join(', ')})`))
    });
  }

  const describedProjects = analysis.projects.filter(
    (p) => p.description && p.description.split(/\s+/).length >= 8
  );
  if (analysis.projects.length > 0 && describedProjects.length === analysis.projects.length) {
    strengths.push({
      id: 'projects-described',
      title: 'Projects are described, not just listed',
      explanation: `All ${describedProjects.length} project${describedProjects.length === 1 ? '' : 's'} carry a sentence of description, so a reader can tell what each one does without opening a link.`,
      evidence: cap(describedProjects.map((p) => `${p.name ?? 'Project'} — ${p.description}`))
    });
  }

  if (analysis.education.length > 0) {
    const complete = analysis.education.filter((e) => e.qualification && e.institution && e.period);
    if (complete.length === analysis.education.length) {
      strengths.push({
        id: 'education-clear',
        title: 'Education is complete and dated',
        explanation: 'Qualification, institution and years are all present, so degree filters and timeline checks find what they expect.',
        evidence: cap(complete.map((e) => e.evidence))
      });
    }
  }

  const attributableCerts = analysis.certifications.filter(
    (c) => c.issuer && (c.issueDate || c.credentialId || c.credentialUrl)
  );
  if (analysis.certifications.length > 0 && attributableCerts.length === analysis.certifications.length) {
    strengths.push({
      id: 'certificates-attributable',
      title: 'Certifications name their issuer and date',
      explanation: 'Each certification is attributable to an issuing organisation with a date or credential reference — the form a verifier (or a skeptical screener) can check.',
      evidence: cap(attributableCerts.map((c) => c.evidence))
    });
  }

  if (analysis.achievements.length > 0 && analysis.achievements.every((a) => /\b(19|20)\d{2}\b/.test(a))) {
    strengths.push({
      id: 'achievements-dated',
      title: 'Achievements are dated and placeable',
      explanation: 'Every listed achievement carries a year, so it sits on the timeline instead of floating unanchored.',
      evidence: cap(analysis.achievements)
    });
  }

  /* ── weaknesses ────────────────────────────────────────────────────── */

  const missingContact = [
    !analysis.contact.email && 'an email address',
    !analysis.contact.phone && 'a phone number',
    analysis.contact.links.length === 0 && 'a profile link'
  ].filter(Boolean) as string[];

  if (missingContact.length > 0) {
    weaknesses.push({
      id: 'missing-contact',
      title: 'The header is missing contact details',
      severity: analysis.contact.email ? 'medium' : 'high',
      explanation: `The header block does not contain ${missingContact.join(' or ')}. Contact routes live above every section heading; a screener who cannot find one never scrolls further.`,
      recommendation: `Add ${missingContact.join(' and ')} under your name, before the first section heading — pipe-separated on one line is fine.`,
      example: '[Your Name] | [you@example.com] | [+1 555 010 0100] | [linkedin.com/in/yourhandle]',
      evidence: []
    });
  }

  if (analysis.experience.length > 0 && allHighlights.length > 0 && quantifiedHighlights.length < 2) {
    weaknesses.push({
      id: 'unquantified-impact',
      title: 'Experience bullets describe duties more than outcomes',
      severity: 'medium',
      explanation: `Only ${quantifiedHighlights.length} of ${allHighlights.length} bullets state a number. Bullets that name scope, speed, scale or improvement are the ones a screener quotes onward.`,
      recommendation:
        'For each responsibility, add the measurable result it produced — size of system, time saved, coverage gained, users served. If you never measured it, state the scope instead of inventing a metric.',
      example: 'Cut [process] runtime from [X] to [Y] by [what you changed].',
      evidence: cap(allHighlights.filter((h) => !/\d/.test(h)))
    });
  }

  const rolesWithoutBullets = analysis.experience.filter((e) => e.highlights.length === 0);
  if (rolesWithoutBullets.length > 0) {
    weaknesses.push({
      id: 'missing-bullets',
      title: `${rolesWithoutBullets.length} role${rolesWithoutBullets.length === 1 ? '' : 's'} ha${rolesWithoutBullets.length === 1 ? 's' : 've'} no bullet points`,
      severity: 'high',
      explanation:
        'A role written as prose hides every individual accomplishment from both the parser and the human skimming for six seconds. Bullets are the units a screener counts.',
      recommendation:
        'Under each flagged role, list 2–4 bullets — one accomplishment each, starting with an action verb.',
      example: 'Built [what] using [technology], which [result].',
      evidence: cap(rolesWithoutBullets.map((e) => e.evidence))
    });
  }

  const undatedRoles = analysis.experience.filter((e) => !e.period);
  if (undatedRoles.length > 0) {
    weaknesses.push({
      id: 'undated-roles',
      title: `${undatedRoles.length} role${undatedRoles.length === 1 ? '' : 's'} witho${undatedRoles.length === 1 ? 'out' : 'ut'} readable dates`,
      severity: 'high',
      explanation:
        'Dates are how a timeline is assembled. Undated roles force the reader to reconstruct your chronology, and many screens filter on employment dates directly.',
      recommendation:
        'Add the period under each role title, in an unambiguous format with months and years.',
      example: '[Mon YYYY] – [Mon YYYY]  (e.g. Jun 2023 – Present)',
      evidence: cap(undatedRoles.map((e) => e.evidence))
    });
  }

  if (analysis.projects.length > 0) {
    const thin = analysis.projects.filter((p) => !p.description || p.description.split(/\s+/).length < 8);
    if (thin.length === analysis.projects.length) {
      weaknesses.push({
        id: 'thin-projects',
        title: 'Projects name technologies but not outcomes',
        severity: 'medium',
        explanation:
          'Each project currently states a name and a stack. Without what it does and what it achieved, a screener cannot tell your contribution from the technology list.',
        recommendation:
          'Add one sentence under each project: what it does, what you built, and the result or scope — users, data volume, or the problem it removes.',
        example: '[Project name] — [what it does] for [who]. Built [your contribution]; [measurable result or current scope].',
        evidence: cap(thin.map((p) => p.evidence))
      });
    }
  }

  if (!analysis.summary) {
    weaknesses.push({
      id: 'missing-summary',
      title: 'No professional summary frames the document',
      severity: 'medium',
      explanation:
        'Without a summary, the first thing read is whatever section comes first. The summary is your one place to state role, core stack and focus in your own words.',
      recommendation:
        'Add a 2–3 line summary under your name. Keep it factual — everything in it will be read as a claim you stand behind.',
      example: '[Role] with [X years/exposure] building [type of systems] using [core technologies]. Focus on [what you care about].',
      evidence: []
    });
  }

  const weakOpeners = allHighlights.filter((h) => WEAK_OPENERS.test(h));
  if (allHighlights.length >= 3 && weakOpeners.length / allHighlights.length >= 0.5) {
    weaknesses.push({
      id: 'weak-action-verbs',
      title: 'Bullets open with passive responsibility phrasing',
      severity: 'low',
      explanation: `${weakOpeners.length} of ${allHighlights.length} bullets open with phrasing like "Responsible for" or "Worked on", which describes attendance rather than action.`,
      recommendation:
        'Rewrite each opening with the verb of what you actually did — Built, Reduced, Led, Migrated, Designed — keeping the same facts.',
      example: 'Responsible for [task] → Built/migrated/reduced [same task] …',
      evidence: cap(weakOpeners)
    });
  }

  if (analysis.certifications.some((c) => c.needsReview)) {
    const unattributed = analysis.certifications.filter((c) => c.needsReview);
    weaknesses.push({
      id: 'unattributed-certifications',
      title: `${unattributed.length} certification${unattributed.length === 1 ? ' lacks' : 's lack'} a recognisable issuer`,
      severity: 'medium',
      explanation:
        'A certificate line without an issuing organisation reads as a claim nobody signed. Verifiers look for who issued it and when.',
      recommendation:
        'Add the issuing organisation (and issue date or credential link) to each flagged certification line.',
      example: '[Certification name] — [Issuing organisation], [Mon YYYY]',
      evidence: cap(unattributed.map((c) => c.evidence))
    });
  }

  const undatedAchievements = analysis.achievements.filter((a) => !/\b(19|20)\d{2}\b/.test(a));
  if (undatedAchievements.length > 0) {
    weaknesses.push({
      id: 'undated-achievements',
      title: `${undatedAchievements.length} achievement${undatedAchievements.length === 1 ? '' : 's'} without a year`,
      severity: 'low',
      explanation: 'Undated achievements cannot be placed on your timeline, which makes them easy for a screener to skip.',
      recommendation: 'Append the year (and the awarding body when it is not obvious from the line).',
      example: 'Winner, [Hackathon Name] 2024 — organised by [body]',
      evidence: cap(undatedAchievements)
    });
  }

  const earlyCareer =
    analysis.experience.length === 0 &&
    analysis.education.some((e) => {
      const years = [...(e.period ?? '').matchAll(/(19|20)\d{2}/g)].map((m) => parseInt(m[0], 10));
      return years.length > 0 && years[years.length - 1] >= new Date().getUTCFullYear() - 3;
    });

  if (earlyCareer && analysis.projects.length === 0) {
    weaknesses.push({
      id: 'no-evidence-carrier',
      title: 'Neither experience nor projects carry your work',
      severity: 'high',
      explanation:
        'You are early in your career and the document has no section showing what you have built. For a fresher, projects are the evidence a screener weighs most heavily.',
      recommendation:
        'Add a projects section with 2–3 real builds — course, college or personal — each naming the technologies, your contribution and the outcome. Do not pad: list only work you can discuss in an interview.',
      example: '[Project name] — [what it does]. Built with [technologies]; [result: users, grade, competition, measurable improvement].',
      evidence: []
    });
  }

  strengths.sort((a, b) => a.id.localeCompare(b.id));
  weaknesses.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.id.localeCompare(b.id));

  return { strengths, weaknesses };
}
