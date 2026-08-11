const assert = require('node:assert/strict');
const test = require('node:test');

const { GitHubService } = require('../dist/services/github.service.js');

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('parseRepoUrl accepts a full github URL', () => {
  assert.deepEqual(
    GitHubService.parseRepoUrl('https://github.com/owner/repo.git'),
    { owner: 'owner', name: 'repo' }
  );
});

test('parseRepoUrl accepts owner/repo shorthand', () => {
  assert.deepEqual(
    GitHubService.parseRepoUrl('owner/repo'),
    { owner: 'owner', name: 'repo' }
  );
});

test('parseRepoUrl rejects invalid repository strings', () => {
  assert.throws(
    () => GitHubService.parseRepoUrl('not-a-repo-url'),
    /Invalid GitHub repository URL format/
  );
});

test('fetchRawFileContent decodes base64 content from the GitHub contents API', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => jsonResponse({
    type: 'file',
    encoding: 'base64',
    content: Buffer.from('hello world', 'utf8').toString('base64')
  });

  const content = await GitHubService.fetchRawFileContent('owner', 'repo', 'src/index.ts', 'main');

  assert.equal(content, 'hello world');
});

test('fetchRepoTree throws when the branch lookup fails', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => new Response('not found', { status: 404 });

  await assert.rejects(
    () => GitHubService.fetchRepoTree('owner', 'repo', 'main'),
    /Branch "main" was not found/
  );
});
