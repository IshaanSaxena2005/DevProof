const assert = require('node:assert/strict');
const test = require('node:test');

const { skillsNamedIn } = require('../dist/services/skill.service.js');

/**
 * A hackathon evidences nothing on its own, so the matcher is only ever used to
 * seed CLAIMED skills from the *project* name. These pin the inputs that matter.
 */

test('a project name reveals the technology used', () => {
  assert.deepEqual(
    skillsNamedIn('Docker-based Deployment Dashboard').map((s) => s.name),
    ['Docker']
  );
});

test('a hackathon name on its own says nothing about what was built', () => {
  // The service deliberately matches projectName only, never the event name.
  assert.deepEqual(skillsNamedIn('Smart India Hackathon 2026'), []);
  assert.deepEqual(skillsNamedIn('HackMIT'), []);
});

test('a project naming several technologies lists each once', () => {
  assert.deepEqual(
    skillsNamedIn('React frontend with a Python and PostgreSQL backend')
      .map((s) => s.name)
      .sort(),
    ['PostgreSQL', 'Python', 'React']
  );
});

test('an empty project name matches nothing', () => {
  assert.deepEqual(skillsNamedIn(''), []);
});
