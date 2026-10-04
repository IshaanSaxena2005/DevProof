const assert = require('node:assert/strict');
const test = require('node:test');

const { startServer, createClient, registerUser, cleanup } = require('./setup');

/**
 * End-to-end tests over real HTTP, Prisma and PostgreSQL.
 *
 * Every bug that reached a teammate so far was an integration failure — a
 * module, a migration, a client — not a logic error, and the service tests
 * could not have caught any of them because they stub the boundary that broke.
 */

let server;

test.before(async () => {
  server = await startServer();
});

test.after(async () => {
  await server.close();
  await cleanup();
});

/* ── liveness ─────────────────────────────────────────── */

test('health reports the database it is actually connected to', async () => {
  const { status, body } = await createClient(server.baseUrl).get('/health');

  assert.equal(status, 200);
  assert.equal(body.data.status, 'UP');
  assert.equal(body.data.database, 'connected', 'the app must reach Postgres, not merely boot');
});

test('an unknown route returns a 404 rather than hanging or crashing', async () => {
  const { status } = await createClient(server.baseUrl).get('/not-a-real-endpoint');
  assert.equal(status, 404);
});

/* ── authentication ───────────────────────────────────── */

test('every protected route rejects an unauthenticated caller', async () => {
  const anon = createClient(server.baseUrl);

  const paths = [
    '/auth/me',
    '/repositories',
    '/skills',
    '/certifications',
    '/courses',
    '/hackathons',
    '/coding-profiles',
    '/growth/history',
    '/career/readiness',
    '/resume',
    '/developer360/overview',
    '/ai/insights'
  ];

  for (const path of paths) {
    const { status } = await anon.get(path);
    assert.equal(status, 401, `${path} must require a session`);
  }
});

test('register issues an httpOnly session cookie', async () => {
  const { client } = await registerUser(server.baseUrl, 'cookie');

  assert.ok(client.cookie, 'a session cookie must be set');

  const me = await client.get('/auth/me');
  assert.equal(me.status, 200);
  assert.ok(me.body.data.user.email.startsWith('it-cookie-'));
  assert.equal(me.body.data.user.passwordHash, undefined, 'the hash must never be serialized');
});

test('a wrong password is rejected without revealing which field was wrong', async () => {
  const { email } = await registerUser(server.baseUrl, 'wrongpass');
  const fresh = createClient(server.baseUrl);

  const { status, body } = await fresh.post('/auth/login', { email, password: 'NotThePassword1!' });

  assert.equal(status, 401);
  assert.match(body.message, /invalid email or password/i);
});

test('registering the same email twice is refused', async () => {
  const { email } = await registerUser(server.baseUrl, 'dupe');
  const second = createClient(server.baseUrl);

  const { status } = await second.post('/auth/register', {
    email,
    password: 'IntegrationTest123!',
    name: 'Duplicate'
  });

  assert.ok(status === 409 || status === 400, `expected a conflict, got ${status}`);
});

/* ── validation ───────────────────────────────────────── */

test('validation failures return 400 with field-level detail', async () => {
  const { client } = await registerUser(server.baseUrl, 'validation');

  const { status, body } = await client.post('/certifications', { name: '' });

  assert.equal(status, 400);
  assert.ok(Array.isArray(body.error), 'the Zod handler should return field errors');
  assert.ok(
    body.error.some((e) => String(e.field).includes('name')),
    'the offending field must be named'
  );
});

test('a malformed id is rejected before it reaches the database', async () => {
  const { client } = await registerUser(server.baseUrl, 'badid');

  const { status } = await client.delete('/certifications/not-a-uuid');

  assert.equal(status, 400);
});

/* ── user isolation ───────────────────────────────────── */

test('one user cannot see, modify or delete another user\'s records', async () => {
  const alice = (await registerUser(server.baseUrl, 'alice')).client;
  const bob = (await registerUser(server.baseUrl, 'bob')).client;

  const created = await alice.post('/certifications', {
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services'
  });
  assert.equal(created.status, 201);
  const certificationId = created.body.data.certification.id;

  // Bob's list must not contain it.
  const bobList = await bob.get('/certifications');
  assert.equal(bobList.status, 200);
  assert.equal(
    bobList.body.data.certifications.length,
    0,
    'a new user must not inherit anyone else\'s records'
  );

  // Nor may he reach it by guessing the id.
  const bobUpdate = await bob.patch(`/certifications/${certificationId}`, {
    name: 'Stolen',
    issuer: 'Nobody'
  });
  assert.equal(bobUpdate.status, 404, 'a foreign id must read as absent, not forbidden');

  const bobDelete = await bob.delete(`/certifications/${certificationId}`);
  assert.equal(bobDelete.status, 404);

  // Alice's record is untouched.
  const aliceList = await alice.get('/certifications');
  assert.equal(aliceList.body.data.certifications.length, 1);
  assert.equal(aliceList.body.data.certifications[0].name, 'AWS Certified Solutions Architect');
});

test('skills, courses and hackathons are scoped per user', async () => {
  const one = (await registerUser(server.baseUrl, 'scope-one')).client;
  const two = (await registerUser(server.baseUrl, 'scope-two')).client;

  await one.post('/skills', { name: 'Kubernetes', category: 'DEVOPS' });
  await one.post('/courses', { title: 'Docker Mastery', platform: 'Udemy', isCompleted: true });
  await one.post('/hackathons', { name: 'HackMIT', organizer: 'MIT' });

  for (const path of ['/skills', '/courses', '/hackathons']) {
    const mine = await one.get(path);
    const theirs = await two.get(path);
    const key = Object.keys(mine.body.data)[0];

    assert.ok(mine.body.data[key].length > 0, `${path} should hold the owner's records`);
    assert.equal(theirs.body.data[key].length, 0, `${path} must not leak across users`);
  }
});

/* ── behaviour that only appears end to end ───────────── */

test('a completed course promotes a skill to LEARNED through the real stack', async () => {
  const { client } = await registerUser(server.baseUrl, 'ladder');

  const created = await client.post('/courses', {
    title: 'The Complete Kubernetes Course',
    platform: 'Udemy',
    isCompleted: true
  });

  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.promotedSkills, ['Kubernetes']);

  const skills = await client.get('/skills');
  const kubernetes = skills.body.data.skills.find((s) => s.name === 'Kubernetes');

  assert.ok(kubernetes, 'the skill should now exist');
  assert.equal(kubernetes.currentLevel, 'LEARNED');
});

test('an in-progress course promotes nothing', async () => {
  const { client } = await registerUser(server.baseUrl, 'inprogress');

  const created = await client.post('/courses', {
    title: 'Learning Rust',
    platform: 'Udemy',
    isCompleted: false
  });

  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.promotedSkills, []);

  const skills = await client.get('/skills');
  assert.equal(skills.body.data.skills.length, 0);
});

test('a new user gets honest empty readiness rather than an invented score', async () => {
  const { client } = await registerUser(server.baseUrl, 'readiness');

  const { status, body } = await client.get('/career/readiness');

  assert.equal(status, 200);
  assert.equal(body.data.readiness.hasEvidence, false);
  assert.equal(body.data.readiness.bestMatch, null);
  assert.ok(body.data.readiness.roles.every((role) => role.score === 0));
});

test('a new user has an empty growth history, not a flat one', async () => {
  const { client } = await registerUser(server.baseUrl, 'growth');

  const { body } = await client.get('/growth/history');
  const history = body.data.history;

  assert.deepEqual(history.points, []);
  assert.deepEqual(history.months, []);
  assert.equal(history.totals.analyses, 0);
  assert.equal(history.totals.bestScore, null, 'no measurement must not read as zero');
  assert.equal(history.totals.trendAvailable, false);
});

test('logout clears the session', async () => {
  const { client } = await registerUser(server.baseUrl, 'logout');

  assert.equal((await client.get('/auth/me')).status, 200);

  const loggedOut = await client.post('/auth/logout');
  assert.equal(loggedOut.status, 200);

  assert.equal((await client.get('/auth/me')).status, 401, 'the session must no longer be accepted');
});
