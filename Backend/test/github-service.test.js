const assert = require('node:assert/strict');
const test = require('node:test');

const { GitHubService } = require('../dist/services/github.service.js');

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
