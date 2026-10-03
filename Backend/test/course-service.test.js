const assert = require('node:assert/strict');
const test = require('node:test');

const { skillsNamedIn } = require('../dist/services/skill.service.js');

/**
 * Course titles run through the same matcher certifications use, so these cover
 * the course-shaped inputs specifically — marketing titles rather than
 * credential names.
 */

test('a course title naming a technology credits it', () => {
  assert.deepEqual(
    skillsNamedIn('The Complete Kubernetes Course').map((s) => s.name),
    ['Kubernetes']
  );
});

test('a course naming several technologies credits each', () => {
  assert.deepEqual(
    skillsNamedIn('React and Node.js: Full Stack Bootcamp').map((s) => s.name).sort(),
    ['Node.js', 'React']
  );
});

test('a generic course title credits nothing rather than guessing', () => {
  assert.deepEqual(skillsNamedIn('Introduction to Computer Science'), []);
});

test('a course about Java does not credit JavaScript', () => {
  const matched = skillsNamedIn('Java Programming Masterclass').map((s) => s.name);
  assert.ok(matched.includes('Java'));
  assert.ok(!matched.includes('JavaScript'));
});
