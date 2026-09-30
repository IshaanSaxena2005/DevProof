const assert = require('node:assert/strict');
const test = require('node:test');

const { LeetCodeService } = require('../dist/services/leetcode.service.js');

/**
 * LeetCode's GraphQL endpoint is undocumented and unversioned, so these tests
 * pin the two things that actually matter: that a present field is mapped to
 * the right place, and that an absent one becomes null rather than zero.
 */

function graphqlResponse(data, errors) {
  return new Response(JSON.stringify(errors ? { data, errors } : { data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/** A fully populated upstream payload; individual tests strip parts away. */
function fullPayload() {
  return {
    matchedUser: {
      username: 'someone',
      profile: { ranking: 12345 },
      submitStats: {
        acSubmissionNum: [
          { difficulty: 'All', count: 300, submissions: 500 },
          { difficulty: 'Easy', count: 150, submissions: 200 },
          { difficulty: 'Medium', count: 120, submissions: 220 },
          { difficulty: 'Hard', count: 30, submissions: 80 }
        ],
        totalSubmissionNum: [{ difficulty: 'All', count: 320, submissions: 1000 }]
      },
      userCalendar: {
        streak: 7,
        totalActiveDays: 90,
        // 2024-01-01 and 2024-01-02, keyed by unix seconds as a JSON string.
        submissionCalendar: JSON.stringify({ '1704067200': 3, '1704153600': 5 })
      },
      languageProblemCount: [{ languageName: 'Python', problemsSolved: 200 }],
      tagProblemCounts: {
        advanced: [{ tagName: 'Dynamic Programming', problemsSolved: 40 }],
        fundamental: [{ tagName: 'Array', problemsSolved: 120 }]
      }
    },
    userContestRanking: {
      attendedContestsCount: 10,
      rating: 1800.5,
      globalRanking: 5000,
      topPercentage: 12.5
    },
    allQuestionsCount: [
      { difficulty: 'Easy', count: 900 },
      { difficulty: 'Medium', count: 2000 },
      { difficulty: 'Hard', count: 800 }
    ]
  };
}

function stubFetch(t, responder) {
  const original = global.fetch;
  t.after(() => {
    global.fetch = original;
  });
  global.fetch = responder;
}

test('maps a full profile onto the normalized shape', async (t) => {
  stubFetch(t, async () => graphqlResponse(fullPayload()));

  const p = await LeetCodeService.fetchProfile('someone');

  assert.equal(p.totalSolved, 300);
  assert.equal(p.easySolved, 150);
  assert.equal(p.mediumSolved, 120);
  assert.equal(p.hardSolved, 30);
  assert.equal(p.ranking, 12345);
  assert.equal(p.rating, 1800.5);
  assert.equal(p.contestsAttended, 10);
  assert.equal(p.streakDays, 7);
  assert.equal(p.totalActiveDays, 90);
  assert.equal(p.profileUrl, 'https://leetcode.com/u/someone/');
});

test('acceptance rate is accepted submissions over total submissions', async (t) => {
  stubFetch(t, async () => graphqlResponse(fullPayload()));

  const p = await LeetCodeService.fetchProfile('someone');

  // 500 accepted submissions / 1000 total submissions — NOT 300/320 solved.
  assert.equal(p.acceptanceRate, 0.5);
});

test('a user who has never entered a contest has a null rating, not zero', async (t) => {
  const payload = fullPayload();
  payload.userContestRanking = null;
  stubFetch(t, async () => graphqlResponse(payload));

  const p = await LeetCodeService.fetchProfile('someone');

  assert.equal(p.rating, null, 'zero would render as a real but terrible score');
  assert.equal(p.contestsAttended, null);
  assert.equal(p.globalRanking, null);
  assert.equal(p.topPercentage, null);
  // Solve counts are still real measurements and must survive.
  assert.equal(p.totalSolved, 300);
});

test('a missing user is a 404 even though LeetCode answers 200', async (t) => {
  stubFetch(t, async () =>
    graphqlResponse({ matchedUser: null, userContestRanking: null }, [
      { message: 'That user does not exist.' }
    ])
  );

  await assert.rejects(() => LeetCodeService.fetchProfile('nobody'), /no public profile/i);
});

test('the submission calendar is converted from epoch keys to ISO dates', async (t) => {
  stubFetch(t, async () => graphqlResponse(fullPayload()));

  const p = await LeetCodeService.fetchProfile('someone');
  const calendar = p.rawStats.submissionCalendar;

  assert.deepEqual(Object.keys(calendar).sort(), ['2024-01-01', '2024-01-02']);
  assert.equal(calendar['2024-01-01'], 3);
  assert.equal(calendar['2024-01-02'], 5);
});

test('a malformed calendar costs the heatmap, not the whole sync', async (t) => {
  const payload = fullPayload();
  payload.matchedUser.userCalendar.submissionCalendar = 'not json at all';
  stubFetch(t, async () => graphqlResponse(payload));

  const p = await LeetCodeService.fetchProfile('someone');

  assert.deepEqual(p.rawStats.submissionCalendar, {});
  assert.equal(p.totalSolved, 300, 'the rest of the profile must still load');
});

test('missing optional sections degrade to empty rather than throwing', async (t) => {
  stubFetch(t, async () =>
    graphqlResponse({
      matchedUser: { username: 'sparse', submitStats: { acSubmissionNum: [] } },
      userContestRanking: null
    })
  );

  const p = await LeetCodeService.fetchProfile('sparse');

  assert.equal(p.totalSolved, 0);
  assert.equal(p.streakDays, null);
  assert.deepEqual(p.rawStats.topics, []);
  assert.deepEqual(p.rawStats.languages, []);
  assert.deepEqual(p.rawStats.totalAvailable, { easy: null, medium: null, hard: null });
});

test('topics are flattened across difficulty groupings and sorted', async (t) => {
  stubFetch(t, async () => graphqlResponse(fullPayload()));

  const p = await LeetCodeService.fetchProfile('someone');

  assert.deepEqual(p.rawStats.topics, [
    { tag: 'Array', solved: 120 },
    { tag: 'Dynamic Programming', solved: 40 }
  ]);
});

test('a blank handle is rejected before any network call', async (t) => {
  let called = false;
  stubFetch(t, async () => {
    called = true;
    return graphqlResponse(fullPayload());
  });

  await assert.rejects(() => LeetCodeService.fetchProfile('   '), /username is required/i);
  assert.equal(called, false, 'no request should be made for an empty handle');
});

test('rate limiting surfaces as a retryable service error', async (t) => {
  stubFetch(t, async () => new Response('slow down', { status: 429 }));

  await assert.rejects(() => LeetCodeService.fetchProfile('someone'), /rate limiting/i);
});
