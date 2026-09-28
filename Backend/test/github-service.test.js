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

test('fetchUserRepos reads repositories per installation, not /user/repos', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const requested = [];
  global.fetch = async (url) => {
    requested.push(url);
    if (url.includes('/user/installations?')) {
      return jsonResponse({ total_count: 1, installations: [{ id: 42 }] });
    }
    if (url.includes('/user/installations/42/repositories')) {
      return jsonResponse({
        total_count: 1,
        repositories: [{ id: 1, name: 'app', full_name: 'acme/app', owner: { login: 'acme' } }]
      });
    }
    throw new Error(`unexpected request: ${url}`);
  };

  const result = await GitHubService.fetchUserRepos('token');

  assert.equal(result.installationCount, 1);
  assert.equal(result.repos.length, 1);
  assert.equal(result.repos[0].fullName, 'acme/app');
  assert.equal(result.truncated, false);
  assert.ok(!requested.some((u) => u.includes('/user/repos')));
});

test('fetchUserRepos returns no repositories when the app is installed nowhere', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => jsonResponse({ total_count: 0, installations: [] });

  const result = await GitHubService.fetchUserRepos('token');

  assert.equal(result.installationCount, 0);
  assert.deepEqual(result.repos, []);
});

test('fetchUserRepos deduplicates a repo visible through two installations', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const shared = { id: 7, name: 'shared', full_name: 'acme/shared', owner: { login: 'acme' } };
  global.fetch = async (url) => {
    if (url.includes('/user/installations?')) {
      return jsonResponse({ total_count: 2, installations: [{ id: 1 }, { id: 2 }] });
    }
    return jsonResponse({ total_count: 1, repositories: [shared] });
  };

  const result = await GitHubService.fetchUserRepos('token');

  assert.equal(result.installationCount, 2);
  assert.equal(result.repos.length, 1, 'the same repository must not be synced twice');
});
