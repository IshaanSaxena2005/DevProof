const assert = require('node:assert/strict');
const test = require('node:test');

const { SkillService } = require('../dist/services/skill.service.js');
const { prisma } = require('../dist/config/database.js');

/**
 * Derivation is pure apart from its two Prisma calls, so the repository read and
 * the write transaction are both stubbed. That keeps these tests about the
 * rules — which tokens count, what stands as evidence, how confidence grows —
 * rather than about Postgres.
 */
function stubPrisma(t, repositories) {
  const originalFindMany = prisma.repository.findMany;
  const originalTransaction = prisma.$transaction;

  const written = [];

  prisma.repository.findMany = async () => repositories;
  prisma.$transaction = async (fn) =>
    fn({
      skill: {
        deleteMany: async () => ({ count: 0 }),
        findUnique: async () => null,
        upsert: async ({ create }) => {
          written.push(create);
          return { id: `skill-${written.length}`, ...create };
        }
      },
      skillEvidence: {
        deleteMany: async () => ({ count: 0 }),
        createMany: async ({ data }) => {
          const target = written[written.length - 1];
          target.evidences = data;
          return { count: data.length };
        }
      }
    });

  t.after(() => {
    prisma.repository.findMany = originalFindMany;
    prisma.$transaction = originalTransaction;
  });

  return written;
}

function repo(overrides = {}) {
  return {
    fullName: 'acme/app',
    url: 'https://github.com/acme/app',
    language: null,
    topics: null,
    analyses: [],
    ...overrides
  };
}

test('derives a skill from a repository language', async (t) => {
  const written = stubPrisma(t, [repo({ language: 'TypeScript' })]);

  const summary = await SkillService.deriveSkills('user-1');

  assert.equal(summary.total, 1);
  assert.equal(written[0].name, 'TypeScript');
  assert.equal(written[0].currentLevel, 'PRACTICALLY_EVIDENCED');
});

test('ignores repository topics that are not recognised technologies', async (t) => {
  const written = stubPrisma(t, [
    repo({ topics: ['hacktoberfest', 'awesome', 'college-project', 'react'] })
  ]);

  const summary = await SkillService.deriveSkills('user-1');

  assert.equal(summary.total, 1, 'only the real technology should become a skill');
  assert.equal(written[0].name, 'React');
});

test('a single repository does not count twice for one skill', async (t) => {
  // The common real case: GitHub reports the language *and* the owner tagged
  // the repo with the same technology. That is one piece of evidence, not two.
  const written = stubPrisma(t, [repo({ language: 'TypeScript', topics: ['typescript'] })]);

  await SkillService.deriveSkills('user-1');

  assert.equal(written.length, 1);
  assert.equal(written[0].evidences.length, 1, 'the same repo must not be double-counted');
  assert.equal(
    written[0].confidence,
    45,
    'one repository must score as one repository, not two'
  );
});

test('confidence grows with the number of evidencing repositories', async (t) => {
  const written = stubPrisma(t, [
    repo({ fullName: 'acme/one', language: 'Python' }),
    repo({ fullName: 'acme/two', language: 'Python' }),
    repo({ fullName: 'acme/three', language: 'Python' })
  ]);

  await SkillService.deriveSkills('user-1');

  assert.equal(written.length, 1, 'one skill across three repositories');
  assert.equal(written[0].evidences.length, 3);
  assert.ok(written[0].confidence > 45, 'three repositories should beat one');
  assert.ok(written[0].confidence <= 95, 'confidence must stay short of certainty');
});

test('measured analysis signals become capability skills', async (t) => {
  const written = stubPrisma(t, [
    repo({
      analyses: [
        {
          rawResults: { hasTests: true, hasDocker: true, hasCiCd: false, hasReadme: false, secretWarnings: 0 },
          metrics: []
        }
      ]
    })
  ]);

  await SkillService.deriveSkills('user-1');

  const names = written.map((s) => s.name).sort();
  assert.deepEqual(names, ['Automated Testing', 'Docker']);
  // hasCiCd was false, so CI/CD must not appear.
  assert.ok(!names.includes('CI/CD'));
});

test('secure coding is claimed only when a scan actually ran and came back clean', async (t) => {
  const written = stubPrisma(t, [
    repo({
      analyses: [
        {
          rawResults: { secretWarnings: 0 },
          metrics: [{ category: 'SECURITY', score: 100 }]
        }
      ]
    })
  ]);

  await SkillService.deriveSkills('user-1');

  assert.ok(written.some((s) => s.name === 'Secure Coding Practices'));
});

test('a low security score does not yield a secure-coding skill', async (t) => {
  const written = stubPrisma(t, [
    repo({
      analyses: [
        {
          rawResults: { secretWarnings: 3 },
          metrics: [{ category: 'SECURITY', score: 40 }]
        }
      ]
    })
  ]);

  await SkillService.deriveSkills('user-1');

  assert.ok(!written.some((s) => s.name === 'Secure Coding Practices'));
});

test('a user with no repositories gets no skills rather than an error', async (t) => {
  const written = stubPrisma(t, []);

  const summary = await SkillService.deriveSkills('user-1');

  assert.equal(summary.total, 0);
  assert.equal(written.length, 0);
});

test('a skill inferred from absence is capped below one evidenced by presence', async (t) => {
  // Nine repositories all scanning clean. Under the default ceiling this would
  // saturate at 95; absence-based evidence must not get there.
  const cleanRepo = (n) =>
    repo({
      fullName: `acme/clean-${n}`,
      analyses: [
        {
          rawResults: { secretWarnings: 0, hasDocker: true },
          metrics: [{ category: 'SECURITY', score: 100 }]
        }
      ]
    });

  const written = stubPrisma(t, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(cleanRepo));

  await SkillService.deriveSkills('user-1');

  const secure = written.find((s) => s.name === 'Secure Coding Practices');
  const docker = written.find((s) => s.name === 'Docker');

  assert.ok(secure, 'the skill should still be recorded');
  assert.equal(secure.confidence, 60, 'absence-based evidence is capped at 60');

  // Same nine repositories, but Docker is evidenced by a file that exists.
  assert.equal(docker.confidence, 95, 'presence-based evidence still reaches 95');
  assert.ok(
    secure.confidence < docker.confidence,
    'a clean scan must never outrank a demonstrable artifact'
  );
});
