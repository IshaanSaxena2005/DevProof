const assert = require('node:assert/strict');
const test = require('node:test');

const { analyseKeywords, conceptTermsIn, taxonomySkillsIn } = require('../dist/services/ats/keywords.js');

/**
 * Keyword intelligence is the bridge between the resume and the shared skill
 * taxonomy. These tests pin the honesty rules: one dictionary, one canonical
 * name per technology, per-section dedupe, and evidence for every term.
 */

function find(analysis, term) {
  return analysis.keywords.find((k) => k.term === term);
}

/* ── taxonomy reuse ──────────────────────────────────────────────────── */

test('detected terms come from the shared skill taxonomy, not a second dictionary', () => {
  const taxonomy = taxonomySkillsIn('TypeScript, React, PostgreSQL');
  assert.deepEqual(taxonomy.map((t) => t.name).sort(), ['PostgreSQL', 'React', 'TypeScript']);

  const analysis = analyseKeywords({ header: [], sections: { skills: 'TypeScript, React, PostgreSQL' } });
  assert.deepEqual(
    analysis.keywords.map((k) => k.term).sort(),
    ['PostgreSQL', 'React', 'TypeScript']
  );
  for (const keyword of analysis.keywords) {
    assert.equal(keyword.source, 'taxonomy');
  }
});

test('capitalisation and punctuation variants collapse into one canonical term', () => {
  const analysis = analyseKeywords({
    header: [],
    sections: { skills: 'REACT, react.js, Next-JS, nextjs, C++, c plus plus is not matched' }
  });

  assert.ok(find(analysis, 'React'), 'react / REACT / react.js are one term');
  assert.equal(find(analysis, 'React').count, 1, 'three spellings in one section is one claim');
  assert.ok(find(analysis, 'Next.js'), 'nextjs and Next-JS are one term');
  assert.ok(find(analysis, 'C++'), 'tokens with regex metacharacters still match');
});

test('distinct technologies stay distinct', () => {
  // The taxonomy spells React Native as the hyphenated token "react-native",
  // which must not collapse into plain React.
  const analysis = analyseKeywords({ header: [], sections: { skills: 'React, react-native' } });
  assert.ok(find(analysis, 'React'));
  assert.ok(find(analysis, 'React Native'));
  assert.equal(analysis.distinctCount, 2);
});

/* ── evidence and counting ───────────────────────────────────────────── */

test('a term is evidenced by every section it appears in, counted per section', () => {
  const analysis = analyseKeywords({
    header: [],
    sections: {
      skills: 'Docker, PostgreSQL',
      experience: '- Built Docker images for the PostgreSQL migration',
      projects: 'Deploy tooling\n- Docker compose setups'
    }
  });

  const docker = find(analysis, 'Docker');
  assert.deepEqual(docker.sections.sort(), ['experience', 'projects', 'skills']);
  assert.equal(docker.count, 3, 'three evidenced sections, not a hit counter');
});

test('section counts summarise where the document is strongest', () => {
  const analysis = analyseKeywords({
    header: [],
    sections: {
      skills: 'TypeScript, React',
      experience: 'Frontend Engineer\n- TypeScript and React daily',
      projects: ''
    }
  });

  assert.equal(analysis.sectionCounts.skills, 2);
  assert.equal(analysis.sectionCounts.experience, 2);
  assert.equal(analysis.sectionCounts.projects, 0);
  assert.equal(analysis.distinctCount, 2);
});

test('an empty document yields an empty analysis, not a crash', () => {
  const analysis = analyseKeywords({ header: [], sections: {} });
  assert.deepEqual(analysis.keywords, []);
  assert.equal(analysis.distinctCount, 0);
});

/* ── concept terms ───────────────────────────────────────────────────── */

test('professional concepts are recognised and marked as concepts', () => {
  const analysis = analyseKeywords({
    header: [],
    sections: { experience: '- Set up CI/CD with GitHub Actions\n- Wrote unit tests with Jest' }
  });

  const cicd = find(analysis, 'CI/CD');
  assert.ok(cicd);
  assert.equal(cicd.source, 'concept');
  assert.equal(cicd.category, 'CONCEPT');
  assert.ok(find(analysis, 'Unit testing'));
});

test('concept spellings collapse to one canonical term', () => {
  assert.deepEqual(conceptTermsIn('migrated to continuous integration and continuous delivery'), ['CI/CD']);
  assert.deepEqual(conceptTermsIn('plain prose with none of the terms'), []);
});

test('when both sources name a term, the taxonomy reading wins', () => {
  // "rest-api" matches the shared taxonomy (hyphenated token); bare "rest"
  // matches the concept list. One entry must result, labelled as the
  // technology, counted once for the one section.
  const analysis = analyseKeywords({
    header: ['rest endpoints and rest-api tooling'],
    sections: { skills: 'Express' }
  });

  const rest = find(analysis, 'REST APIs');
  assert.ok(rest);
  assert.equal(rest.source, 'taxonomy');
  assert.equal(rest.category, 'BACKEND');
  assert.deepEqual(rest.sections, ['header']);
  assert.equal(rest.count, 1, 'two sources in one section is still one claim');
});

test('keywords are ordered by breadth of evidence, then name', () => {
  const analysis = analyseKeywords({
    header: [],
    sections: { skills: 'Docker', experience: 'DevOps Engineer\n- Docker and Kubernetes', projects: 'Cluster tooling\n- Docker based' }
  });
  // Docker appears in three sections; everything else in one.
  assert.equal(analysis.keywords[0].term, 'Docker');
  assert.equal(analysis.keywords[0].sections.length, 3);
});
