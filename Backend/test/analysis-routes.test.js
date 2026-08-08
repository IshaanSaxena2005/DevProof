const assert = require('node:assert/strict');
const test = require('node:test');

const analysisRoutes = require('../dist/routes/analysis.routes.js').default;

function routePaths(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
}

test('analysis routes keep the repo-specific path ahead of the id path', () => {
  const paths = routePaths(analysisRoutes);

  const repoRouteIndex = paths.indexOf('/repo/:repositoryId');
  const idRouteIndex = paths.indexOf('/:id');

  assert.notEqual(repoRouteIndex, -1, 'repo route should be registered');
  assert.notEqual(idRouteIndex, -1, 'id route should be registered');
  assert.ok(
    repoRouteIndex < idRouteIndex,
    'repo route must appear before the generic id route'
  );
});
