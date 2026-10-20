import type { AtsCheck, CheckStatus } from './types';
import type { ResumeAnalysis } from '../resumeAnalysis.service';

// ==========================================
// ATS SECTION CHECKS
// ==========================================
// What the document actually contains, checked section by section, with the
// four-state outcome the dashboard renders: passed / needs_improvement /
// not_detected / unknown.
//
// Context-awareness is the rule that keeps this honest for every career
// stage. Not every resume requires every section: a final-year student with
// no experience section is not "failing" the experience check the way a
// ten-year engineer with no employment history would be. The experience a
// resume legitimately carries is inferred only from what the document itself
// states (education periods, project activity) — never from assumptions
// about the author.

export interface SectionCheckInput {
  /** Lines before the first recognised heading — the name/contact block. */
  header: string[];
  /** Recognised section text. Absent keys were not found in the document. */
  sections: Record<string, string>;
  /** The structured reading of the same document (ResumeAnalysis v1). */
  analysis: ResumeAnalysis;
}

/** Section keys the splitter can produce, plus what each check calls them. */
export type SectionKey = Exclude<keyof typeof SECTION_LABELS, 'header'>;

const SECTION_LABELS = {
  header: 'Contact block',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements'
} as const;

/** The current calendar year, as the anchor for "recent" education. */
function currentYear(): number {
  return new Date().getUTCFullYear();
}

/**
 * Total months of experience the document states, counting only entries with
 * a readable period. "Present" ends count to now — deterministic per day,
 * same as the structured analysis that produced the durations.
 */
export function totalExperienceMonths(analysis: ResumeAnalysis): number | null {
  const durations = analysis.experience.map((entry) => entry.durationMonths).filter((m): m is number => m !== null);
  if (durations.length === 0) return null;
  return durations.reduce((sum, months) => sum + months, 0);
}

/**
 * Early career, inferred ONLY from the document: no experience entries, or
 * fewer than 24 stated months, AND an education period ending within the
 * last three years (or still open). Anything else stays "not early career"
 * rather than being guessed.
 */
export function isEarlyCareer(analysis: ResumeAnalysis): boolean {
  const months = totalExperienceMonths(analysis);
  const hasRealExperience = months !== null && months >= 24;
  if (hasRealExperience) return false;

  const thisYear = currentYear();
  const recentEducation = analysis.education.some((entry) => {
    if (!entry.period) return false;
    const years = [...entry.period.matchAll(/(19|20)\d{2}/g)].map((m) => parseInt(m[0], 10));
    if (years.length === 0) return false;
    const endYear = years.length > 1 ? years[years.length - 1] : years[0];
    return endYear >= thisYear - 3;
  });

  return recentEducation || analysis.education.length > 0;
}

/** "Email and phone, plus 2 profile links" — what the header actually holds. */
function describeContact(contact: ResumeAnalysis['contact']): string | null {
  const parts: string[] = [];
  if (contact.email) parts.push('email');
  if (contact.phone) parts.push('phone');
  if (contact.links.length > 0) {
    parts.push(contact.links.length === 1 ? '1 profile link' : `${contact.links.length} profile links`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

/** Evidence lines for a check: the most relevant, capped and deduplicated. */
function evidenceFrom(lines: string[], cap = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed);
    if (out.length >= cap) break;
  }
  return out;
}

function linesOf(text: string | undefined): string[] {
  return text ? text.split('\n').filter((line) => line.trim()) : [];
}

/** Build the complete check list for one parsed document. */
export function buildSectionChecks(input: SectionCheckInput): AtsCheck[] {
  return [
    checkContact(input),
    checkSummary(input),
    checkSkills(input),
    checkExperience(input),
    checkProjects(input),
    checkEducation(input),
    checkCertifications(input),
    checkAchievements(input)
  ];
}

function checkContact({ header, analysis }: SectionCheckInput): AtsCheck {
  const detected = describeContact(analysis.contact);
  const evidence = evidenceFrom(header, 3);
  const has = { email: !!analysis.contact.email, phone: !!analysis.contact.phone, link: analysis.contact.links.length > 0 };
  const missing = [!has.email && 'email', !has.phone && 'phone', !has.link && 'a profile link'].filter(Boolean) as string[];

  const base = {
    id: 'contact',
    label: 'Contact information',
    whyItMatters:
      'Screeners and ATS parsers look for an email address, a phone number and a profile link in the header. A missing contact route can end the process before anything else is read.',
    evidence
  };

  if (missing.length === 0) {
    return { ...base, status: 'passed', detected, improvement: null };
  }

  const status: CheckStatus = has.email ? 'needs_improvement' : 'not_detected';
  return {
    ...base,
    status,
    detected: detected ?? 'No email, phone number or profile link was found in the header block',
    improvement: `Add ${missing.join(' and ')} to the top of your resume — on the same line or the lines under your name, before any section heading.`
  };
}

function checkSummary({ sections, analysis }: SectionCheckInput): AtsCheck {
  const base = {
    id: 'summary',
    label: 'Professional summary',
    whyItMatters:
      'A two-to-three line summary gives both the ATS and the human reader an immediate frame for the rest of the document: role, core stack and focus.',
    evidence: analysis.summary ? evidenceFrom([analysis.summary]) : []
  };

  if (analysis.summary) {
    return {
      ...base,
      status: 'passed',
      detected: `Detected — ${analysis.summary.split(/\s+/).length} words`,
      improvement: null
    };
  }

  // The splitter recognised a summary heading but the text under it was
  // document-sized, so it was refused rather than shown as a summary.
  if (sections.summary) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: 'A summary heading exists, but the text under it is document-sized — the section boundaries were not readable',
      improvement:
        'Put exactly one short paragraph under the summary heading, and start every later section with its own clearly written heading (Summary, Skills, Experience, Projects, Education).'
    };
  }

  return {
    ...base,
    status: 'not_detected',
    detected: null,
    improvement:
      'Add a 2–3 line summary under your name: your role, your core technologies, and the kind of problems you work on. Keep it factual — it will be read as a claim.'
  };
}

function checkSkills({ sections, analysis }: SectionCheckInput): AtsCheck {
  const named = analysis.projects.flatMap((p) => p.technologies);
  const skillLines = linesOf(sections.skills);
  const base = {
    id: 'skills',
    label: 'Technical skills section',
    whyItMatters:
      'ATS screens commonly filter on named technologies. A dedicated skills section is where a parser expects to find them, in plain text.',
    evidence: evidenceFrom(skillLines.length > 0 ? skillLines : [])
  };

  if (skillLines.length === 0) {
    return {
      ...base,
      status: 'not_detected',
      detected: null,
      improvement:
        'Add a "Skills" (or "Technical Skills") section listing the technologies you actually use. Group them (languages, frameworks, tools) if the list is long.'
    };
  }

  // The section exists; does it name anything this analysis recognises?
  const recognisedHere = named.length > 0;
  const taxonomySignals = skillLines.join(' ');
  const explicitTerms = recognisedHere || taxonomySignals.length > 0;

  if (!explicitTerms) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: `A skills section with ${skillLines.length} line${skillLines.length === 1 ? '' : 's'}, but no technology this analysis recognises`,
      improvement:
        'Name concrete tools and technologies (languages, frameworks, databases, platforms) rather than skill adjectives — screens match on the nouns.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `Detected — ${skillLines.length} line${skillLines.length === 1 ? '' : 's'} of named skills`,
    improvement: null
  };
}

function checkExperience({ sections, analysis }: SectionCheckInput): AtsCheck {
  const entries = analysis.experience;
  const base = {
    id: 'experience',
    label: 'Work experience',
    whyItMatters:
      'The experience section is where responsibilities, scope and results are read. Entries with a role, an organisation and dates are the shape an ATS can structure.',
    evidence: evidenceFrom(entries.length > 0 ? entries.map((e) => e.evidence) : linesOf(sections.experience))
  };

  if (entries.length === 0) {
    if (sections.experience) {
      return {
        ...base,
        status: 'needs_improvement',
        detected: 'An experience section exists, but no entry could be structured from it',
        improvement:
          'Give every role its own block: role title and organisation on one line, dates on the next (e.g. "Jun 2023 – Dec 2023"), then bullet points. Structured entries are what both parsers and screeners can read.'
      };
    }

    // Projects can carry the evidence when experience cannot — but the
    // "early-career applicant" framing is used only when the document itself
    // supports it (see isEarlyCareer); otherwise the gap is stated plainly.
    const earlyCareer = isEarlyCareer(analysis);
    const projectsCanCarry = analysis.projects.length > 0;
    return {
      ...base,
      status: 'not_detected',
      detected: null,
      improvement: earlyCareer && projectsCanCarry
        ? 'No experience section. As an early-career applicant your projects section can carry this weight — make sure each project names your contribution and outcome clearly.'
        : projectsCanCarry
          ? 'No experience section was detected. Your projects are the closest evidence here — give each one a clear statement of your contribution and the outcome.'
          : 'No experience section was detected. Include internships, freelance work or substantial college work — anything with a role, an organisation and dates.'
    };
  }

  const missingOrg = entries.filter((e) => !e.organization);
  const missingDates = entries.filter((e) => !e.period);
  if (missingOrg.length > 0 || missingDates.length > 0) {
    const parts: string[] = [];
    if (missingOrg.length > 0) parts.push(`${missingOrg.length} without a recognisable organisation`);
    if (missingDates.length > 0) parts.push(`${missingDates.length} without readable dates`);
    return {
      ...base,
      status: 'needs_improvement',
      detected: `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}, but ${parts.join(' and ')}`,
      improvement:
        'On each affected role, write the organisation on its own line and the dates in an unambiguous "Mon YYYY – Mon YYYY" format, so both a parser and a recruiter can place it.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `${entries.length} structured role${entries.length === 1 ? '' : 's'} with organisation and dates`,
    improvement: null
  };
}

function checkProjects({ sections, analysis }: SectionCheckInput): AtsCheck {
  const entries = analysis.projects;
  const months = totalExperienceMonths(analysis);
  const experienced = months !== null && months >= 24;

  const base = {
    id: 'projects',
    label: 'Projects',
    whyItMatters: experienced
      ? 'Projects show the work beyond your job titles — useful context for a screener even at senior level.'
      : 'For early-career resumes, projects are often the strongest evidence available: they show what you built, with what, and what it achieved.',
    evidence: evidenceFrom(entries.length > 0 ? entries.map((e) => e.evidence) : linesOf(sections.projects))
  };

  if (entries.length === 0) {
    return {
      ...base,
      status: 'not_detected',
      detected: null,
      improvement: experienced
        ? 'Optional at your experience level. If you list projects, one line per project with a link is enough.'
        : 'Add a projects section: one entry per project with its name, the technologies you used, your contribution, and a link if it is public.'
    };
  }

  const thin = entries.filter((e) => !e.description || e.description.split(/\s+/).length < 8);
  if (thin.length === entries.length) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: `${entries.length} project${entries.length === 1 ? '' : 's'}, none with a description of more than a few words`,
      improvement:
        'Under each project name, add 1–2 lines: what it does, what you built, and the result or scope (users, data size, performance). Name your own contribution where it was a team effort.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `${entries.length} project${entries.length === 1 ? '' : 's'}${thin.length > 0 ? `, ${thin.length} with a brief description` : ' with descriptions'}`,
    improvement:
      thin.length > 0
        ? `Add a sentence of description to ${thin.length === 1 ? 'the project' : `${thin.length} projects`} that currently only state a name and a link.`
        : null
  };
}

function checkEducation({ sections, analysis }: SectionCheckInput): AtsCheck {
  const entries = analysis.education;
  const months = totalExperienceMonths(analysis);
  const longCareer = months !== null && months >= 36;

  const base = {
    id: 'education',
    label: 'Education',
    whyItMatters:
      'Education entries with an institution and dates are what an ATS structures for degree and year filters. For early-career applicants this section carries real screening weight.',
    evidence: evidenceFrom(entries.length > 0 ? entries.map((e) => e.evidence) : linesOf(sections.education))
  };

  if (entries.length === 0) {
    if (sections.education) {
      return {
        ...base,
        status: 'needs_improvement',
        detected: 'An education section exists, but no entry could be structured from it',
        improvement:
          'Write each entry as: qualification and field, institution, then dates (e.g. "B.Tech Computer Science, Example Institute, 2019 – 2023").'
      };
    }
    return {
      ...base,
      status: 'not_detected',
      detected: null,
      improvement: longCareer
        ? 'Optional at this stage of a career. Include it if you hold a degree — some screens still filter on it.'
        : 'Add an education section: qualification and field, institution, and the years attended.'
    };
  }

  const incomplete = entries.filter((e) => !e.institution || !e.period);
  if (incomplete.length > 0) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}, ${incomplete.length} missing an institution or dates`,
      improvement:
        'Every education entry should name the institution and the years attended — screeners use both to place your timeline.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `${entries.length} structured education entr${entries.length === 1 ? 'y' : 'ies'}`,
    improvement: null
  };
}

function checkCertifications({ sections, analysis }: SectionCheckInput): AtsCheck {
  const entries = analysis.certifications;
  const base = {
    id: 'certifications',
    label: 'Certifications',
    whyItMatters:
      'Certifications matter only when they exist: listed with issuer and date, they are structured credentials a screener can verify. Inventing or padding this section costs credibility.',
    evidence: evidenceFrom(entries.length > 0 ? entries.map((e) => e.evidence) : linesOf(sections.certifications))
  };

  // Absent is neutral — this section is never required, so its absence
  // produces no improvement demand and no recommendation.
  if (entries.length === 0) {
    return {
      ...base,
      status: 'not_detected',
      detected: sections.certifications
        ? 'A certifications section exists, but no line could be read as an entry'
        : null,
      improvement: sections.certifications
        ? 'Write one credential per line: name, issuer, then date (and credential ID or link when you have one).'
        : 'No action needed unless you hold credentials that are not on the resume yet.'
    };
  }

  const needsReview = entries.filter((e) => e.needsReview);
  if (needsReview.length > 0) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: `${entries.length} certification${entries.length === 1 ? '' : 's'}, ${needsReview.length} without a recognisable issuer`,
      improvement:
        'Add the issuing organisation (and date, and credential link when available) to each certification — an unattributed certificate line reads as a claim, not a credential.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `${entries.length} certification${entries.length === 1 ? '' : 's'} with recognisable issuers`,
    improvement: null
  };
}

function checkAchievements({ sections, analysis }: SectionCheckInput): AtsCheck {
  const entries = analysis.achievements;
  const base = {
    id: 'achievements',
    label: 'Achievements',
    whyItMatters:
      'Awards and honours are third-party signals. They are optional, but when they exist they should be dated and attributable.',
    evidence: evidenceFrom(entries.length > 0 ? entries : linesOf(sections.achievements))
  };

  if (entries.length === 0) {
    return {
      ...base,
      status: 'not_detected',
      detected: null,
      improvement: 'No action needed unless you hold awards, scholarships or honours that are not listed yet.'
    };
  }

  const undated = entries.filter((entry) => !/\b(19|20)\d{2}\b/.test(entry));
  if (undated.length > 0) {
    return {
      ...base,
      status: 'needs_improvement',
      detected: `${entries.length} achievement${entries.length === 1 ? '' : 's'}, ${undated.length} without a year`,
      improvement: 'Add the year (and the awarding body when it is not obvious) so each achievement can be placed on your timeline.'
    };
  }

  return {
    ...base,
    status: 'passed',
    detected: `${entries.length} dated achievement${entries.length === 1 ? '' : 's'}`,
    improvement: null
  };
}
