const assert = require('node:assert/strict');
const test = require('node:test');

const { skillsCertifiedBy } = require('../dist/services/skill.service.js');

/**
 * These cover the matching rules only. Promotion and demotion are thin Prisma
 * writes on top of this function, so getting the matching right is what keeps a
 * certificate from crediting a technology it never mentioned.
 */

test('matches the technology inside a real certification title', () => {
  const matched = skillsCertifiedBy('AWS Certified Solutions Architect - Associate').map((s) => s.name);
  assert.deepEqual(matched, ['AWS']);
});

test('Java does not match JavaScript', () => {
  const java = skillsCertifiedBy('Oracle Certified Professional: Java SE 17 Developer').map((s) => s.name);
  assert.ok(java.includes('Java'), 'the Java certificate should credit Java');
  assert.ok(!java.includes('JavaScript'), 'a Java certificate must not credit JavaScript');
});

test('JavaScript still matches its own certificate', () => {
  const matched = skillsCertifiedBy('JavaScript Algorithms and Data Structures').map((s) => s.name);
  assert.ok(matched.includes('JavaScript'));
  assert.ok(!matched.includes('Java'), 'word boundaries must not split JavaScript into Java');
});

test('a title naming several technologies credits each once', () => {
  const matched = skillsCertifiedBy('Docker and Kubernetes: The Complete Guide').map((s) => s.name).sort();
  assert.deepEqual(matched, ['Docker', 'Kubernetes']);
});

test('an unrecognised certification credits nothing rather than guessing', () => {
  assert.deepEqual(skillsCertifiedBy('Certified Scrum Master'), []);
});

test('matching ignores case', () => {
  const matched = skillsCertifiedBy('professional docker certification').map((s) => s.name);
  assert.deepEqual(matched, ['Docker']);
});

test('a technology mentioned twice is credited once', () => {
  const matched = skillsCertifiedBy('Python for Everybody: Python Fundamentals').map((s) => s.name);
  assert.deepEqual(matched, ['Python']);
});

test('tokens containing regex metacharacters are matched literally', () => {
  // "c++" must not be treated as a pattern, and must not be found inside "c".
  const matched = skillsCertifiedBy('C++ Certified Associate Programmer').map((s) => s.name);
  assert.ok(matched.includes('C++'));
});
