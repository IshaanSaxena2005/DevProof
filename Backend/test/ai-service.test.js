const assert = require('node:assert/strict');
const test = require('node:test');

process.env.GROQ_API_KEY = 'test-key';

const { AiService } = require('../dist/services/ai.service.js');
const { prisma } = require('../dist/config/database.js');

const originalFetch = global.fetch;
const originalUserFindUnique = prisma.user.findUnique;

function restore() {
  global.fetch = originalFetch;
  prisma.user.findUnique = originalUserFindUnique;
}

test.afterEach(restore);

test('generateInsights returns no evidence when there are no completed analyses', async () => {
  prisma.user.findUnique = async () => ({
    id: 'user-1',
    repositories: []
  });

  global.fetch = async () => {
    throw new Error('Groq should not be called when there is no evidence');
  };

  const result = await AiService.generateInsights('user-1');

  assert.deepEqual(result, {
    hasEvidence: false,
    insights: null,
    evidence: {
      repositoriesAnalyzed: 0,
      averageScore: null
    }
  });
});

test('generateInsights validates a Groq response when evidence exists', async () => {
  prisma.user.findUnique = async () => ({
    id: 'user-1',
    repositories: [
      {
        name: 'devproof',
        language: 'TypeScript',
        analyses: [
          {
            overallScore: 88,
            healthStatus: 'GOOD',
            metrics: [
              { category: 'CODE_QUALITY', score: 92, detail: 'Strong modular structure' }
            ],
            findings: [
              { severity: 'LOW', title: 'Missing tests', description: 'Add tests' }
            ]
          }
        ]
      }
    ]
  });

  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'The repository evidence is strong.',
                strengths: [
                  { title: 'Code quality', detail: 'The code quality metric is 92/100.' }
                ],
                risks: [],
                recommendations: [
                  { title: 'Add tests', rationale: 'The evidence includes a missing tests finding.', priority: 'HIGH' }
                ]
              })
            }
          }
        ]
      };
    },
    async text() {
      return '';
    }
  });

  const result = await AiService.generateInsights('user-1');

  assert.equal(result.hasEvidence, true);
  assert.equal(result.evidence.repositoriesAnalyzed, 1);
  assert.equal(result.evidence.averageScore, 88);
  assert.equal(result.insights.summary, 'The repository evidence is strong.');
  assert.equal(result.insights.strengths[0].title, 'Code quality');
  assert.equal(result.insights.recommendations[0].priority, 'HIGH');
});
