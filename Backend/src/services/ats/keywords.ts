import { skillsNamedIn } from '../skill.service';
import type { AtsKeyword, AtsKeywordAnalysis, KeywordSection } from './types';

// ==========================================
// ATS KEYWORD INTELLIGENCE
// ==========================================
// What technologies and professional terms the document actually names, with
// the sections that evidence each one.
//
// Two sources, kept distinguishable in every result:
//  - 'taxonomy' — the project's shared skill dictionary (TOKEN_SKILLS in
//    skill.service), the same one that backs the Skills page. One dictionary,
//    not two that can disagree.
//  - 'concept'  — a small, explicit list of professional/CS terms that ATS
//    screens filter on but the skill taxonomy deliberately excludes (they are
//    practices, not technologies).
//
// A match is a *mention*. Nothing here infers proficiency, seniority or
// depth from presence: a resume that says "React" once has named React, and
// that is the entire claim.

const SECTION_KEYS: Record<string, KeywordSection> = {
  summary: 'summary',
  skills: 'skills',
  experience: 'experience',
  projects: 'projects',
  education: 'education',
  certifications: 'certifications',
  achievements: 'achievements'
};

/**
 * Professional terms worth tracking, with the patterns that recognise their
 * reasonable spellings. Deliberately short and explicit: every entry is
 * something a screener genuinely filters on, and every entry is testable.
 */
const CONCEPT_TERMS: { term: string; patterns: RegExp[] }[] = [
  { term: 'CI/CD', patterns: [/\bci\s*\/\s*cd\b/i, /\bcontinuous\s+(integration|delivery|deployment)\b/i, /\bgithub\s+actions\b/i, /\bjenkins\b/i] },
  { term: 'REST APIs', patterns: [/\brest(ful)?\s+apis?\b/i, /\brest\b/i] },
  { term: 'Microservices', patterns: [/\bmicro[- ]?services?\b/i] },
  { term: 'Unit testing', patterns: [/\bunit\s+tests?\b/i, /\bjest\b/i, /\bmocha\b/i, /\bvitest\b/i, /\bxunit\b/i] },
  { term: 'Test-driven development', patterns: [/\btdd\b/i, /\btest[- ]driven\b/i] },
  { term: 'Agile', patterns: [/\bagile\b/i, /\bscrum\b/i, /\bkanban\b/i] },
  { term: 'Code review', patterns: [/\bcode\s+reviews?\b/i, /\bpull\s+requests?\b/i] },
  { term: 'System design', patterns: [/\bsystem[s]?\s+design\b/i, /\bsystem\s+architecture\b/i] },
  { term: 'Data structures & algorithms', patterns: [/\bdata\s+structures?\b/i, /\balgorithms?\b/i] },
  { term: 'Performance optimisation', patterns: [/\bperformance\s+(optimi[sz]ation|tuning|improvement)\b/i, /\blatency\b/i, /\bcaching\b/i] },
  { term: 'Security', patterns: [/\bsecurity\b/i, /\bauthentication\b/i, /\bauthorization\b/i, /\boauth\b/i, /\bxss\b/i, /\bsql\s+injection\b/i] },
  { term: 'Accessibility', patterns: [/\baccessibility\b/i, /\ba11y\b/i, /\bwcag\b/i] },
  { term: 'Machine learning', patterns: [/\bmachine\s+learning\b/i, /\bdeep\s+learning\b/i, /\bneural\s+networks?\b/i] },
  { term: 'Data pipelines', patterns: [/\bdata\s+pipelines?\b/i, /\betl\b/i, /\bdata\s+engineering\b/i] },
  { term: 'DevOps', patterns: [/\bdevops\b/i, /\binfrastructure\s+as\s+code\b/i, /\bterraform\b/i] },
  { term: 'Databases', patterns: [/\bsql\b/i, /\bindex(es|ing)?\b/i, /\bschema\s+(design|migration)\b/i] },
  { term: 'Technical documentation', patterns: [/\btechnical\s+documentation\b/i, /\bdocs?\b/i, /\breadme\b/i] },
  { term: 'Mentoring', patterns: [/\bmentor(ing|ed)?\b/i, /\btraining\b/i] }
];

/**
 * Taxonomy skills named in a text — the shared dictionary, unchanged.
 * Re-exported so every ATS module reads terms through one door.
 */
export function taxonomySkillsIn(text: string): { name: string; category: string }[] {
  return skillsNamedIn(text).map((skill) => ({ name: skill.name, category: String(skill.category) }));
}

/** Concept terms present in a text, as canonical names. */
export function conceptTermsIn(text: string): string[] {
  return CONCEPT_TERMS.filter(({ patterns }) => patterns.some((pattern) => pattern.test(text))).map(
    ({ term }) => term
  );
}

/** Every document section the matcher looks at, in reading order. */
function orderedSections(sections: Record<string, string>): [KeywordSection, string][] {
  const out: [KeywordSection, string][] = [];
  for (const [key, sectionKey] of Object.entries(SECTION_KEYS)) {
    const text = sections[key];
    if (text && text.trim()) out.push([sectionKey, text]);
  }
  // Anything the splitter did not name still counts as text, just unsectioned.
  for (const [key, text] of Object.entries(sections)) {
    if (key in SECTION_KEYS || !text.trim()) continue;
    out.push(['other', text]);
  }
  return out;
}

/**
 * Build the keyword analysis for one document.
 *
 * Occurrence counting is per-section, not per-hit: a term that appears five
 * times inside one skills line has made one claim, and repeating it is not
 * extra evidence. The count a dashboard shows is therefore "sections where
 * this term is evidenced" summed over the document — documented in the type
 * so the number is never mistaken for a frequency histogram.
 */
export function analyseKeywords(input: {
  header: string[];
  sections: Record<string, string>;
}): AtsKeywordAnalysis {
  const labelled: [KeywordSection, string][] = [
    ...(input.header.length > 0 ? ([[ 'header', input.header.join('\n') ]] as [KeywordSection, string][]) : []),
    ...orderedSections(input.sections)
  ];

  const terms = new Map<string, AtsKeyword>();

  for (const [section, text] of labelled) {
    // One section, one claim per term: merge both sources per section before
    // touching the document-wide map, so a technology named by both the
    // taxonomy and the concept list is counted (and labelled) once here.
    const inSection = new Map<string, { source: 'taxonomy' | 'concept'; category: string }>();
    for (const skill of taxonomySkillsIn(text)) {
      inSection.set(skill.name, { source: 'taxonomy', category: skill.category });
    }
    for (const concept of conceptTermsIn(text)) {
      if (!inSection.has(concept)) inSection.set(concept, { source: 'concept', category: 'CONCEPT' });
    }

    for (const [name, meta] of inSection) {
      const existing = terms.get(name);
      if (existing) {
        existing.count += 1;
        if (!existing.sections.includes(section)) existing.sections.push(section);
        // The technology reading is the more precise one — if a concept
        // entry claimed the same name earlier in the document, it upgrades.
        if (meta.source === 'taxonomy') {
          existing.source = 'taxonomy';
          existing.category = meta.category;
        }
      } else {
        terms.set(name, {
          term: name,
          category: meta.category,
          sections: [section],
          count: 1,
          source: meta.source
        });
      }
    }
  }

  const keywords = [...terms.values()].sort((a, b) => {
    if (b.sections.length !== a.sections.length) return b.sections.length - a.sections.length;
    return a.term.localeCompare(b.term);
  });

  const sectionCounts: Record<KeywordSection, number> = {
    header: 0,
    summary: 0,
    skills: 0,
    experience: 0,
    projects: 0,
    education: 0,
    certifications: 0,
    achievements: 0,
    other: 0
  };
  for (const keyword of keywords) {
    for (const section of keyword.sections) sectionCounts[section] += 1;
  }

  return { keywords, distinctCount: keywords.length, sectionCounts };
}
