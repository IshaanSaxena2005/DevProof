const assert = require('node:assert/strict');
const test = require('node:test');

const githubWebhookRoutes = require('../dist/routes/githubWebhook.routes.js').default;

function routeDescriptions(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort()
    }));
}

test('github webhook routes expose the status and event endpoints', () => {
  assert.deepEqual(routeDescriptions(githubWebhookRoutes), [
    { path: '/github/status', methods: ['get'] },
    { path: '/github', methods: ['post'] }
  ]);
});
