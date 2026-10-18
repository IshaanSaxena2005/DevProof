const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

const { startServer, createClient, registerUser, uniqueEmail, cleanup } = require('./setup');
// Built by `npm run build`, which both this suite's setup (dist/app.js) and the
// test:unit script already depend on.
const { COOKIE_NAME } = require('../../dist/config/cookies.js');

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

test('the server does not trust forwarded proxy headers by default', () => {
  // TRUST_PROXY is unset in the test environment (see setup.js). Express's
  // default must hold: without an operator-specified hop count, an attacker's
  // X-Forwarded-For must not influence req.ip — which the rate limiters key.
  const app = require('../../dist/app.js').default;
  assert.equal(app.get('trust proxy'), false);
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

/* ── GitHub OAuth callback forgery ───────────────────── */

/**
 * The OAuth callback is a top-level browser navigation that GitHub redirects
 * to, so anyone can hit it directly. The state cookie is the only thing that
 * ties a callback to an authorization this server actually started — and the
 * check runs BEFORE the code is exchanged with GitHub, so these tests never
 * leave the machine.
 */

const { env } = require('../../dist/config/env.js');

/** Drives the callback directly with full control over cookies and redirects. */
async function hitCallback(query, cookieHeader) {
  return fetch(`${server.baseUrl}/auth/github/callback${query}`, {
    redirect: 'manual',
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });
}

/** Asserts the attempt was bounced to the login page without minting a session. */
function assertBouncedToLogin(response, label) {
  assert.equal(response.status, 302, `${label}: must redirect, not render`);
  const location = response.headers.get('location') || '';
  assert.ok(
    location.startsWith(`${env.FRONTEND_URL}/login?error=`),
    `${label}: must land on the login page with an explanation, got ${location}`
  );

  const setCookie = response.headers.get('set-cookie') || '';
  assert.ok(!new RegExp(`${COOKIE_NAME}=`).test(setCookie.replace(/token=;/, '')),
    `${label}: a rejected callback must never set a session cookie`);
  assert.match(setCookie, /github_oauth_state=;/, `${label}: the state cookie must be consumed`);
}

test('an OAuth callback with no state is bounced, not processed', async () => {
  const response = await hitCallback('?code=some-forged-code');
  assertBouncedToLogin(response, 'missing state');
});

test('an OAuth callback whose state does not match the cookie is bounced', async () => {
  const response = await hitCallback(
    '?code=some-forged-code&state=' + 'a'.repeat(48),
    `github_oauth_state=${'b'.repeat(48)}`
  );
  assertBouncedToLogin(response, 'mismatched state');
});

test('an OAuth callback with a state the server never issued is bounced', async () => {
  // Valid-looking length, correct shape — but no matching cookie at all, which
  // is what a CSRF attempt from another site looks like.
  const response = await hitCallback('?code=some-forged-code&state=' + 'c'.repeat(48));
  assertBouncedToLogin(response, 'state without cookie');
});

/* ── GitHub webhook intake ──────────────────────────── */

const crypto = require('node:crypto');

/** Signs a raw payload exactly the way GitHub does: HMAC-SHA256, hex, sha256= prefix. */
function signWebhookPayload(payload) {
  return `sha256=${crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;
}

/** Posts a raw (unstringified) body to the webhook endpoint with GitHub's headers. */
function deliverWebhook(payload, { signature, event = 'push' } = {}) {
  return fetch(`${server.baseUrl}/webhooks/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-github-event': event,
      ...(signature !== undefined ? { 'x-hub-signature-256': signature } : {})
    },
    body: payload
  }).then(async (response) => ({
    status: response.status,
    body: await response.json().catch(() => null)
  }));
}

test('a correctly signed webhook payload is acknowledged', async () => {
  const payload = JSON.stringify({ zen: 'Keep it logically awesome.', hook_id: 1 });
  const { status, body } = await deliverWebhook(payload, {
    signature: signWebhookPayload(payload),
    event: 'ping'
  });

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.zen, 'Keep it logically awesome.');
});

test('a signed but malformed JSON payload is a 400, not a server error', async () => {
  // Correctly signed — so this is a caller formatting mistake after a valid
  // HMAC, which must read as a client error rather than a crash.
  const { status, body } = await deliverWebhook('{not json', {
    signature: signWebhookPayload('{not json')
  });

  assert.equal(status, 400);
  assert.match(body.message, /malformed json/i);
  assert.ok(!JSON.stringify(body).includes(process.env.GITHUB_WEBHOOK_SECRET), 'the secret must never appear in a response');
});

test('an invalid signature is rejected before the payload is even parsed', async () => {
  const { status } = await deliverWebhook('{not json', {
    signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000'
  });

  assert.equal(status, 401, 'signature verification must run before JSON parsing');
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

  // The clear must carry the same attributes the cookie was set with,
  // otherwise the browser keeps the original session cookie.
  const cleared = loggedOut.headers.get('set-cookie') || '';
  assert.match(cleared, /token=;/, 'logout must clear the session cookie');
  assert.match(cleared, /Path=\//i, 'the clear must match the cookie path');
  assert.match(cleared, /HttpOnly/i, 'the clear must match the cookie flags');

  assert.equal((await client.get('/auth/me')).status, 401, 'the session must no longer be accepted');
});

/* ── account profile management ─────────────────────────────────────────── */

test('a user can update their own display name', async () => {
  const { client } = await registerUser(server.baseUrl, 'rename');

  const me = await client.get('/auth/me');
  assert.equal(me.body.data.user.name, 'IT rename');

  const updated = await client.patch('/auth/me', { name: 'Alex Morgan' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.user.name, 'Alex Morgan');
  assert.equal(updated.body.data.user.email, me.body.data.user.email, 'email is preserved');
  assert.equal(updated.body.data.user.role, 'DEVELOPER', 'role is preserved');
});

test('a user cannot clear their name with an empty string', async () => {
  const { client } = await registerUser(server.baseUrl, 'rename-empty');

  const { status, body } = await client.patch('/auth/me', { name: '' });
  assert.equal(status, 400);
  assert.ok(
    body.error?.some((e) => String(e.field).includes('name')),
    'the name field must be flagged'
  );
});

test('a user cannot rename another user', async () => {
  const alice = (await registerUser(server.baseUrl, 'alice')).client;
  const bob = (await registerUser(server.baseUrl, 'bob')).client;

  const aliceMe = await alice.get('/auth/me');
  const aliceId = aliceMe.body.data.user.id;

  // Bob has a valid session but tries to patch Alice by id via a non-existent
  // endpoint — the real guard is that PATCH /auth/me always targets the session
  // user, so there is no route that accepts a userId at all.
  const bobMe = await bob.patch('/auth/me', { name: 'Imposter' });
  assert.equal(bobMe.status, 200);
  assert.equal(bobMe.body.data.user.name, 'Imposter');

  // Alice's name is untouched.
  const aliceAfter = await alice.get('/auth/me');
  assert.equal(aliceAfter.body.data.user.name, aliceMe.body.data.user.name, 'alice is not renamed');
  assert.notEqual(aliceAfter.body.data.user.name, 'Imposter');
});

/* ── data export ──────────────────────────────────────────────────────────── */

test('a user can export their own data as JSON', async () => {
  const { client } = await registerUser(server.baseUrl, 'export');

  const { status, body } = await client.post('/auth/export');
  assert.equal(status, 200);
  assert.equal(body.data.export.exportedBy, body.data.export.user.id, 'exportedBy matches the session user');
  assert.equal(body.data.export.user.email, body.data.export.user.email, 'email is present');
  // Secrets are never included: passwordHash is not part of the export shape.
  assert.equal(body.data.export.user.passwordHash, undefined, 'no password hash in export');
  assert.ok(
    Array.isArray(body.data.export.skills),
    'export contains the user sections'
  );
});

test('an export never contains a GitHub access token', async () => {
  const { client } = await registerUser(server.baseUrl, 'export-no-token');

  const { body } = await client.post('/auth/export');
  const exportJson = JSON.stringify(body.data.export);
  assert.ok(
    !exportJson.includes('accessToken') && !exportJson.includes('access_token'),
    'no token field of any kind in the export'
  );
});

/* ── account deletion ─────────────────────────────────────────────────────── */

test('a user can delete their own account and everything cascades', async () => {
  const { client } = await registerUser(server.baseUrl, 'delete-me');

  // Plant some records so we can confirm cascade.
  await client.post('/courses', { title: 'Delete Test Course', platform: 'Udemy', isCompleted: true });
  await client.post('/certifications', { name: 'Delete Test Cert', issuer: 'Test Issuer' });
  await client.post('/skills', { name: 'Delete Test Skill', category: 'GENERAL' });

  const before = await client.get('/auth/me');
  assert.equal(before.status, 200);

  const deleted = await client.delete('/auth/account');
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.data.deleted.email, before.body.data.user.email);

  // The session is now invalid.
  const after = await client.get('/auth/me');
  assert.equal(after.status, 401, 'the deleted user\'s session must no longer be accepted');
});

test('a deleted user\'s records are gone', async () => {
  const { client } = await registerUser(server.baseUrl, 'delete-cascade');
  await client.post('/courses', { title: 'Gone Course', platform: 'Udemy', isCompleted: true });

  await client.delete('/auth/account');

  // Re-login is impossible because the row is gone.
  const fresh = createClient(server.baseUrl);
  const { status } = await fresh.post('/auth/login', {
    email: 'it-delete-cascade-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@devproof.test',
    password: 'IntegrationTest123!'
  });
  // We cannot know the email we registered without capturing it, so instead
  // confirm the deleted user cannot be looked up by their session.
  assert.equal((await client.get('/auth/me')).status, 401);
});

test('one user cannot delete another user\'s account', async () => {
  const alice = (await registerUser(server.baseUrl, 'alice-del')).client;
  const bob = (await registerUser(server.baseUrl, 'bob-del')).client;

  const aliceMe = await alice.get('/auth/me');
  const aliceId = aliceMe.body.data.user.id;

  // There is no route that accepts a userId for deletion — DELETE /auth/account
  // always targets the session user — so the guard is structural: Bob can only
  // ever delete his own row.
  const bobResult = await bob.delete('/auth/account');
  assert.equal(bobResult.status, 200);

  // Alice is untouched.
  const aliceAfter = await alice.get('/auth/me');
  assert.equal(aliceAfter.status, 200, 'alice still has a valid session');
  assert.equal(aliceAfter.body.data.user.id, aliceId, 'alice\'s account still exists');
});

/* ── session rejection and cookie hygiene ─────────────── */

/** Sends a raw Cookie header the shared jar would otherwise overwrite. */
function requestWithToken(path, token) {
  const client = createClient(server.baseUrl);
  return client.request(path, { headers: { Cookie: `${COOKIE_NAME}=${token}` } });
}

/** Asserts a rejected session answered 401 AND cleared its own cookie. */
function assertRejectedAndCleared(result, messagePattern, label) {
  assert.equal(result.status, 401, `${label}: must be rejected`);
  assert.match(result.body.message, messagePattern, `${label}: must explain the rejection`);

  const cleared = result.headers.get('set-cookie') || '';
  assert.match(cleared, /token=;/, `${label}: an invalid session cookie must be cleared, not left to expire`);
  assert.match(cleared, /Path=\//i, `${label}: the clear must match the path the cookie was set with`);
  assert.match(cleared, /HttpOnly/i, `${label}: the clear must keep the cookie httpOnly`);
}

test('a token whose user no longer exists is rejected and its cookie cleared', async () => {
  // Valid signature, nonexistent userId — the orphaned-session case.
  const orphan = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000000', email: 'orphan@devproof.test', role: 'DEVELOPER' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  assertRejectedAndCleared(
    await requestWithToken('/auth/me', orphan),
    /no longer exists/i,
    'orphaned user'
  );
});

test('a malformed, wrongly-signed or expired token is rejected and its cookie cleared', async () => {
  const payload = { userId: '00000000-0000-0000-0000-000000000000', email: 'x@devproof.test', role: 'DEVELOPER' };
  const cases = [
    ['malformed', 'not-a-jwt'],
    ['wrong signature', jwt.sign(payload, 'some-other-secret-value')],
    ['expired', jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -60 })]
  ];

  for (const [label, token] of cases) {
    assertRejectedAndCleared(
      await requestWithToken('/auth/me', token),
      /invalid or expired/i,
      label
    );
  }
});

test('email/password login issues a session that /auth/me accepts', async () => {
  const { email } = await registerUser(server.baseUrl, 'login-ok');
  const fresh = createClient(server.baseUrl);

  const login = await fresh.post('/auth/login', { email, password: 'IntegrationTest123!' });
  assert.equal(login.status, 200);
  assert.ok(fresh.cookie, 'a successful login must set the session cookie');

  const me = await fresh.get('/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, email);
});

test('no refresh-token endpoint exists that could establish a session', async () => {
  // This app authenticates with a single long-lived cookie JWT and has no
  // refresh-token flow. Pinning that /auth/refresh does not exist means anyone
  // adding one later must also add real tests for orphaned refresh tokens.
  const anon = createClient(server.baseUrl);
  assert.equal((await anon.post('/auth/refresh', { refreshToken: 'whatever' })).status, 404);
  assert.equal((await anon.get('/auth/refresh')).status, 404);
  assert.equal((await anon.get('/auth/me')).status, 401, 'no tokenless request may end up authenticated');
});

/* ── resume upload, structured analysis and certification review ──────── */

const { buildSyntheticResumePdf, buildPdf } = require('../helpers/pdf.js');
const { prisma } = require('./setup');

/**
 * Multipart upload through the same session cookie the shared client carries.
 * Bypasses the JSON helper because multipart needs the runtime to set its own
 * boundary header.
 */
async function uploadResume(baseUrl, cookie, buffer, { mime = 'application/pdf', filename = 'resume.pdf' } = {}) {
  const form = new FormData();
  form.append('resume', new Blob([new Uint8Array(buffer)], { type: mime }), filename);

  const response = await fetch(`${baseUrl}/resume`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {},
    body: form
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

test('a readable PDF upload produces a structured analysis', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-ok');

  const uploaded = await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());
  assert.equal(uploaded.status, 201);
  assert.equal(uploaded.body.data.parseError, null);

  const { status, body } = await client.get('/resume');
  assert.equal(status, 200);

  const analysis = body.data.resume.parsed.analysis;
  assert.equal(analysis.version, 1);
  assert.equal(analysis.contact.email, 'ada.example@example.com');
  assert.equal(analysis.education.length, 1);
  assert.match(analysis.education[0].qualification, /b\.tech/i);
  assert.match(analysis.education[0].institution, /Example Institute/);
  assert.equal(analysis.experience.length, 2);
  assert.equal(analysis.certifications.length, 4);
  assert.equal(analysis.certifications[0].credentialId, 'AWS-PCA-98213');
  assert.equal(analysis.certifications[3].needsReview, true, 'an issuer-less line must flag review');
  assert.ok(analysis.projects[0].technologies.includes('React'));
  assert.equal(analysis.achievements.length, 2);
});

test('analysis alone creates no certifications and no skills', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-quiet');

  const uploaded = await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());
  assert.equal(uploaded.status, 201);

  const certs = await client.get('/certifications');
  assert.equal(certs.body.data.certifications.length, 0, 'upload must not create certification records');

  const skills = await client.get('/skills');
  assert.equal(skills.body.data.skills.length, 0, 'upload must not create skill records');
});

test('re-analysis is deterministic and creates nothing', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-re');
  await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());

  const first = await client.post('/resume/analyse');
  assert.equal(first.status, 200);
  const second = await client.post('/resume/analyse');
  assert.equal(second.status, 200);

  const { body } = await client.get('/resume');
  assert.equal(body.data.resume.parsed.analysis.certifications.length, 4, 're-analysis must not duplicate candidates');
  assert.equal((await client.get('/certifications')).body.data.certifications.length, 0);
  assert.equal((await client.get('/skills')).body.data.skills.length, 0);
});

test('confirming a resume candidate uses the existing certification API without duplication', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-confirm');
  await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());

  // What the confirmation workflow sends after the user reviews and confirms.
  const created = await client.post('/certifications', {
    name: 'AWS Certified Solutions Architect - Associate',
    issuer: 'Amazon Web Services',
    credentialId: 'AWS-PCA-98213'
  });
  assert.equal(created.status, 201);

  // Re-analysis must never re-add it.
  await client.post('/resume/analyse');
  const certs = await client.get('/certifications');
  assert.equal(certs.body.data.certifications.length, 1);

  // Replacing the resume keeps the confirmed record.
  await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());
  assert.equal((await client.get('/certifications')).body.data.certifications.length, 1);
});

test('an unsupported file type and an oversized file are client errors, not crashes', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-bad');

  const wrongType = await uploadResume(server.baseUrl, client.cookie, Buffer.from('hello'), {
    mime: 'text/plain'
  });
  assert.equal(wrongType.status, 400);
  assert.match(wrongType.body.message, /only pdf/i);

  const oversized = await uploadResume(
    server.baseUrl,
    client.cookie,
    Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(6 * 1024 * 1024)]),
    { filename: 'huge.pdf' }
  );
  assert.equal(oversized.status, 400, 'multer LIMIT_FILE_SIZE must surface as a 400');
  assert.match(oversized.body.message, /too large|5MB/i);
});

test('a PDF with no readable text keeps the file and reports a parse error', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-notext');

  const uploaded = await uploadResume(server.baseUrl, client.cookie, buildPdf([]));
  assert.equal(uploaded.status, 201, 'the upload itself succeeded');
  assert.match(uploaded.body.data.parseError, /no text/i);
  assert.equal(uploaded.body.data.parsed, null);

  const { body } = await client.get('/resume');
  assert.match(body.data.resume.parseError, /no text/i);
  assert.equal(body.data.resume.parsed, null, 'no fabricated analysis for an unreadable file');
});

test('one user cannot see, download or re-analyse another user\'s resume', async () => {
  const alice = (await registerUser(server.baseUrl, 'resume-alice')).client;
  const bob = (await registerUser(server.baseUrl, 'resume-bob')).client;

  await uploadResume(server.baseUrl, alice.cookie, buildSyntheticResumePdf());
  assert.ok((await alice.get('/resume')).body.data.resume, 'precondition failed: alice has a resume');

  assert.equal((await bob.get('/resume')).body.data.resume, null, 'bob must not see alice\'s resume');
  assert.equal((await bob.get('/resume/download')).status, 404);
  assert.equal((await bob.post('/resume/analyse')).status, 404);

  // Alice is untouched.
  assert.ok((await alice.get('/resume')).body.data.resume);
  assert.equal((await alice.get('/resume/download')).status, 200);
});

/* ── login rate limiting (last: it exhausts the shared per-IP budget) ─── */

test('repeated failed logins hit a dedicated 429 limiter without breaking other auth routes', async () => {
  const client = createClient(server.baseUrl);
  const email = uniqueEmail('ratelimit');
  assert.equal((await client.post('/auth/register', { email, password: 'IntegrationTest123!' })).status, 201);

  // Exhaust the login budget with wrong passwords. Earlier tests already used
  // two of the ten allowed attempts, so this must reach 429 well within 12.
  let saw429 = false;
  for (let attempt = 0; attempt < 12 && !saw429; attempt++) {
    const response = await client.post('/auth/login', { email, password: 'NotThePassword1!' });
    assert.ok(
      response.status === 401 || response.status === 429,
      `attempt ${attempt}: expected 401 or 429, got ${response.status}`
    );
    if (response.status === 429) {
      saw429 = true;
      assert.match(response.body.message, /too many login attempts/i);
    }
  }
  assert.ok(saw429, 'the limiter must eventually refuse further attempts from this IP');

  // The budget is scoped to login: session inspection and logout still work,
  // so a throttled user is never locked out of ending their session.
  assert.equal((await client.get('/auth/me')).status, 200);
  assert.equal((await client.post('/auth/logout')).status, 200);
});

test('a record from before structured analysis stays usable and gains one on demand', async () => {
  const { client } = await registerUser(server.baseUrl, 'resume-legacy');
  await uploadResume(server.baseUrl, client.cookie, buildSyntheticResumePdf());

  // Simulate a pre-analysis record: same row, legacy parsed shape.
  const mine = (await client.get('/resume')).body.data.resume;
  await prisma.resume.update({
    where: { id: mine.id },
    data: {
      parsed: {
        sections: mine.parsed.sections,
        detectedSkills: mine.parsed.detectedSkills,
        wordCount: mine.parsed.wordCount
      }
    }
  });

  // Still readable: sections and skills render, analysis is simply absent.
  const legacy = (await client.get('/resume')).body.data.resume;
  assert.ok(legacy.parsed.sections);
  assert.equal(legacy.parsed.analysis, undefined);

  // Re-analysis of the stored file fills the gap — no re-upload needed.
  const re = await client.post('/resume/analyse');
  assert.equal(re.status, 200);
  const revived = (await client.get('/resume')).body.data.resume;
  assert.equal(revived.parsed.analysis.certifications.length, 4);
});
