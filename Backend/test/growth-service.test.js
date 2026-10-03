const assert = require('node:assert/strict');
const test = require('node:test');

const { GrowthService } = require('../dist/services/growth.service.js');
const { prisma } = require('../dist/config/database.js');

/**
 * Growth is reconstructed entirely from stored timestamps, so these tests stub
 * the three reads and assert the arithmetic — in particular that nothing is
 * claimed about improvement unless the same repository was measured twice.
 */
function stub(t, { history = [], repositories = [], skills = [] }) {
  const originals = {
    history: prisma.analysisHistory.findMany,
    repositories: prisma.repository.findMany,
    skills: prisma.skill.findMany
  };

  prisma.analysisHistory.findMany = async () => history;
  prisma.repository.findMany = async () => repositories;
  prisma.skill.findMany = async () => skills;

  t.after(() => {
    prisma.analysisHistory.findMany = originals.history;
    prisma.repository.findMany = originals.repositories;
    prisma.skill.findMany = originals.skills;
  });
}

const entry = (iso, score, fullName) => ({
  createdAt: new Date(iso),
  score,
  repository: { fullName, name: fullName }
});

test('a user who has measured nothing gets an empty history, not a flat one', async (t) => {
  stub(t, {});

  const h = await GrowthService.getHistory('user-1');

  assert.deepEqual(h.points, []);
  assert.deepEqual(h.months, []);
  assert.deepEqual(h.trends, []);
  assert.equal(h.totals.analyses, 0);
  assert.equal(h.totals.bestScore, null);
  assert.equal(h.totals.averageScore, null);
  assert.equal(h.totals.trendAvailable, false);
});

test('analyses of different repositories do not constitute a trend', async (t) => {
  stub(t, {
    history: [entry('2026-08-11T10:00:00Z', 85, 'acme/one'), entry('2026-09-28T10:00:00Z', 73.3, 'acme/two')]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.equal(h.totals.trendAvailable, false, 'two different codebases are not progress');
  assert.deepEqual(h.trends, []);
  // The scores themselves are still real and reported.
  assert.equal(h.totals.bestScore, 85);
  assert.equal(h.totals.averageScore, 79.2);
});

test('the same repository measured twice is a trend', async (t) => {
  stub(t, {
    history: [entry('2026-08-01T10:00:00Z', 60, 'acme/app'), entry('2026-09-01T10:00:00Z', 78, 'acme/app')]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.equal(h.totals.trendAvailable, true);
  assert.equal(h.trends.length, 1);
  assert.deepEqual(
    { repository: h.trends[0].repository, change: h.trends[0].change, analyses: h.trends[0].analyses },
    { repository: 'acme/app', change: 18, analyses: 2 }
  );
});

test('a declining repository reports a negative change rather than hiding it', async (t) => {
  stub(t, {
    history: [entry('2026-08-01T10:00:00Z', 80, 'acme/app'), entry('2026-09-01T10:00:00Z', 65, 'acme/app')]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.equal(h.trends[0].change, -15);
});

test('months with no measurement are omitted rather than reported as zero', async (t) => {
  stub(t, {
    history: [
      entry('2026-06-10T10:00:00Z', 70, 'acme/app'),
      // nothing in July
      entry('2026-08-10T10:00:00Z', 90, 'acme/app')
    ]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.deepEqual(h.months.map((m) => m.month), ['2026-06', '2026-08']);
  assert.ok(!h.months.some((m) => m.month === '2026-07'), 'a zero there would imply a measurement');
});

test('monthly figures average only that month', async (t) => {
  stub(t, {
    history: [
      entry('2026-09-01T10:00:00Z', 60, 'acme/app'),
      entry('2026-09-15T10:00:00Z', 80, 'acme/other'),
      entry('2026-10-01T10:00:00Z', 100, 'acme/app')
    ]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.deepEqual(h.months, [
    { month: '2026-09', analyses: 2, averageScore: 70, bestScore: 80 },
    { month: '2026-10', analyses: 1, averageScore: 100, bestScore: 100 }
  ]);
});

test('milestones are dated facts tied to real records', async (t) => {
  stub(t, {
    history: [entry('2026-08-11T10:00:00Z', 85, 'acme/app')],
    repositories: [{ createdAt: new Date('2026-08-01T10:00:00Z'), fullName: 'acme/app' }],
    skills: [{ createdAt: new Date('2026-08-12T10:00:00Z'), name: 'TypeScript', currentLevel: 'PRACTICALLY_EVIDENCED' }]
  });

  const h = await GrowthService.getHistory('user-1');

  assert.deepEqual(h.milestones.map((m) => m.label), [
    'First repository connected',
    'First analysis completed',
    'First skill evidenced by code'
  ]);
  // Sorted oldest first.
  assert.ok(h.milestones[0].date < h.milestones[1].date);
});
