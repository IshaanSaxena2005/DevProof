const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const originalEnv = {
  GITHUB_APP_ID: process.env.GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET
};

const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

process.env.GITHUB_APP_ID = '12345';
process.env.GITHUB_PRIVATE_KEY = privateKey;
process.env.GITHUB_WEBHOOK_SECRET = 'webhook-secret';

const { GitHubAppService } = require('../dist/services/githubApp.service.js');

function restoreEnv() {
  process.env.GITHUB_APP_ID = originalEnv.GITHUB_APP_ID;
  process.env.GITHUB_PRIVATE_KEY = originalEnv.GITHUB_PRIVATE_KEY;
  process.env.GITHUB_WEBHOOK_SECRET = originalEnv.GITHUB_WEBHOOK_SECRET;
}

test.after(restoreEnv);

test('createAppJwt returns a signed RS256 token', () => {
  const token = GitHubAppService.createAppJwt(1_700_000_000);

  assert.equal(typeof token, 'string');
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test('verifyWebhookSignature accepts a valid GitHub signature', () => {
  const payload = Buffer.from(JSON.stringify({ hello: 'world' }));
  const signature = `sha256=${crypto
    .createHmac('sha256', 'webhook-secret')
    .update(payload)
    .digest('hex')}`;

  assert.equal(GitHubAppService.verifyWebhookSignature(payload, signature), true);
});

test('verifyWebhookSignature rejects an invalid GitHub signature', () => {
  const payload = Buffer.from(JSON.stringify({ hello: 'world' }));

  assert.equal(GitHubAppService.verifyWebhookSignature(payload, 'sha256=deadbeef'), false);
});

test('verifyWebhookSignature rejects a payload with no signature header at all', () => {
  const payload = Buffer.from(JSON.stringify({ hello: 'world' }));

  assert.equal(GitHubAppService.verifyWebhookSignature(payload, undefined), false);
});

/**
 * The regression this guards against: an unset secret used to return true,
 * so a server that had simply not been configured accepted forged payloads
 * from anyone. Verification must fail closed.
 *
 * `env` is parsed once at module load, so the unconfigured case needs a fresh
 * copy of both modules rather than just mutating process.env.
 */
test('an unset webhook secret rejects every payload instead of accepting them', () => {
  const envPath = require.resolve('../dist/config/env.js');
  const servicePath = require.resolve('../dist/services/githubApp.service.js');
  const saved = process.env.GITHUB_WEBHOOK_SECRET;

  delete require.cache[envPath];
  delete require.cache[servicePath];
  process.env.GITHUB_WEBHOOK_SECRET = '';

  try {
    const { GitHubAppService: Unconfigured } = require(servicePath);
    const payload = Buffer.from(JSON.stringify({ hello: 'world' }));

    assert.equal(Unconfigured.isWebhookVerificationConfigured(), false);

    // Correctly signed against *some* secret, and still refused: with no secret
    // configured there is nothing to verify against, so nothing is trusted.
    const signature = `sha256=${crypto
      .createHmac('sha256', 'any-secret-at-all')
      .update(payload)
      .digest('hex')}`;

    assert.equal(Unconfigured.verifyWebhookSignature(payload, signature), false);
    assert.equal(Unconfigured.verifyWebhookSignature(payload, undefined), false);
  } finally {
    process.env.GITHUB_WEBHOOK_SECRET = saved;
    delete require.cache[envPath];
    delete require.cache[servicePath];
  }
});
