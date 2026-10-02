const assert = require('node:assert/strict');
const test = require('node:test');

const { CareerReadinessService } = require('../dist/services/careerReadiness.service.js');
const { prisma } = require('../dist/config/database.js');

/**
 * Readiness must be defensible rather than merely plausible, so these pin the
 * properties that make it so: nothing is claimed without evidence, every
 * requirement reports what did or did not satisfy it, and the arithmetic is
 * weight-proportional.
 */
function stub(t, { skills = [], analyses = [], codingProfiles = [] }) {
  const originals = {
    skills: prisma.skill.findMany,
    analyses: prisma.repositoryAnalysis.findMany,
    profiles: prisma.codingProfile.findMany
  };

  prisma.skill.findMany = async () => skills;
  prisma.repositoryAnalysis.findMany = async () => analyses;
  prisma.codingProfile.findMany = async () => codingProfiles;

  t.after(() => {
    prisma.skill.findMany = originals.skills;
    prisma.repositoryAnalysis.findMany = originals.analyses;
    prisma.codingProfile.findMany = originals.profiles;
  });
}

const roleNamed = (readiness, name) => readiness.roles.find((r) => r.role === name);
const requirement = (role, id) => role.requirements.find((r) => r.id === id);

test('a user with no evidence scores zero everywhere and has no best match', async (t) => {
  stub(t, {});

  const r = await CareerReadinessService.getReadiness('user-1');

  assert.equal(r.hasEvidence, false);
  assert.equal(r.bestMatch, null);
  assert.ok(r.roles.length > 0, 'roles are still returned, all unmet');
  assert.ok(r.roles.every((role) => role.score === 0));
  assert.ok(r.roles.every((role) => role.requirementsMet === 0));
});

test('every requirement explains itself whether met or not', async (t) => {
  stub(t, {});

  const r = await CareerReadinessService.getReadiness('user-1');

  for (const role of r.roles) {
    for (const req of role.requirements) {
      assert.ok(req.evidence && req.evidence.length > 0, `${req.id} must state why`);
      assert.ok(req.weight >= 1 && req.weight <= 3);
    }
  }
});

test('a claimed skill does not satisfy a requirement needing demonstrated code', async (t) => {
  stub(t, {
    skills: [{ name: 'React', category: 'FRONTEND', currentLevel: 'CLAIMED' }]
  });

  const frontend = roleNamed(await CareerReadinessService.getReadiness('user-1'), 'Frontend Engineer');

  assert.equal(requirement(frontend, 'frontend-skill').met, false, 'saying so is not evidence');
});

test('a practically evidenced skill satisfies it and is named as the evidence', async (t) => {
  stub(t, {
    skills: [{ name: 'React', category: 'FRONTEND', currentLevel: 'PRACTICALLY_EVIDENCED' }]
  });

  const frontend = roleNamed(await CareerReadinessService.getReadiness('user-1'), 'Frontend Engineer');
  const req = requirement(frontend, 'frontend-skill');

  assert.equal(req.met, true);
  assert.match(req.evidence, /React/);
});

test('a metric exactly at its threshold counts as met', async (t) => {
  stub(t, {
    analyses: [{ repositoryId: 'r1', metrics: [{ category: 'TESTING', score: 50 }] }]
  });

  const frontend = roleNamed(await CareerReadinessService.getReadiness('user-1'), 'Frontend Engineer');

  assert.equal(requirement(frontend, 'testing-practice').met, true);
  assert.match(requirement(frontend, 'testing-practice').evidence, /threshold 50/);
});

test('a metric never measured is unmet and says so, rather than scoring zero silently', async (t) => {
  stub(t, { analyses: [] });

  const frontend = roleNamed(await CareerReadinessService.getReadiness('user-1'), 'Frontend Engineer');
  const req = requirement(frontend, 'testing-practice');

  assert.equal(req.met, false);
  assert.match(req.evidence, /no completed analysis/i);
});

test('the score is the proportion of requirement weight met', async (t) => {
  stub(t, {
    // Frontend Engineer: weights 3 + 3 + 2 + 2 + 1 + 2 + 1 = 14.
    // Satisfying only the two weight-3 skill requirements gives 6/14 = 43%.
    skills: [
      { name: 'React', category: 'FRONTEND', currentLevel: 'PRACTICALLY_EVIDENCED' },
      { name: 'TypeScript', category: 'GENERAL', currentLevel: 'PRACTICALLY_EVIDENCED' }
    ]
  });

  const frontend = roleNamed(await CareerReadinessService.getReadiness('user-1'), 'Frontend Engineer');

  assert.equal(frontend.requirementsMet, 2);
  assert.equal(frontend.score, 43);
});

test('problem-solving counts across platforms and reports the shortfall', async (t) => {
  stub(t, { codingProfiles: [{ totalSolved: 60 }, { totalSolved: 30 }] });

  const newGrad = roleNamed(
    await CareerReadinessService.getReadiness('user-1'),
    'Software Engineer (New Grad)'
  );
  const req = requirement(newGrad, 'problem-solving');

  assert.equal(req.met, false, '90 solved is short of 100');
  assert.match(req.evidence, /90 solved, needs 100/);
});

test('roles are returned best first', async (t) => {
  stub(t, {
    skills: [{ name: 'React', category: 'FRONTEND', currentLevel: 'PRACTICALLY_EVIDENCED' }]
  });

  const r = await CareerReadinessService.getReadiness('user-1');
  const scores = r.roles.map((role) => role.score);

  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.equal(r.bestMatch, r.roles[0].role);
});
