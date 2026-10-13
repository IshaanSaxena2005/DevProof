const assert = require('node:assert/strict');
const test = require('node:test');

const { GeeksforGeeksService } = require('../dist/services/geeksforgeeks.service.js');

/**
 * These tests never touch the network. GeeksforGeeks is an undocumented,
 * unversioned page scrape, so what matters is how this service behaves when the
 * page is what we expect, when it is something else, and when the site is down
 * — and all three have to be produced deliberately rather than waited for.
 *
 * The fixture mirrors the real payload: statistics embedded as JSON with escaped
 * quotes, surrounded by unrelated objects that reuse the same field names.
 */
function stubFetch(t, responder) {
  const original = global.fetch;
  const calls = [];

  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return responder();
  };

  t.after(() => {
    global.fetch = original;
  });

  return calls;
}

function htmlResponse(body, status = 200) {
  return () =>
    new Response(body, {
      status,
      headers: { 'Content-Type': 'text/html' }
    });
}

/**
 * A page shaped like the real one.
 *
 * The leading object is the trap the first attempt at this fell into: `handle`
 * appears in unrelated records a dozen times on a real profile page, and reading
 * fields with document-wide searches picked values out of the wrong one. Only
 * the object holding total_problems_solved is the user's statistics.
 */
function profilePage(stats, { decoy = true } = {}) {
  const escaped = JSON.stringify(stats).replace(/"/g, '\\"');
  const noise = decoy
    ? '<script>self.__next_f.push([1,"{\\"handle\\":\\"someone_else\\",\\"score\\":9999}"])</script>'
    : '';

  return `<!DOCTYPE html><html><body>${noise}<script>self.__next_f.push([1,"{\\"user\\":${escaped}}"])</script></body></html>`;
}

const ISHAAN = {
  name: 'Ishaan Saxena',
  username: 'saxenaigahb',
  handle: 'nirmal_geeks11',
  score: 34,
  monthly_score: 8,
  total_problems_solved: 14,
  institute_rank: '',
  institute_name: null,
  pod_solved_current_streak: 0,
  pod_solved_longest_streak: 0,
  pod_correct_submissions_count: 0,
  total_articles_published: 0,
  created_date: '2025-11-30 01:31:09'
};

test('reads the statistics object, not a same-named field elsewhere on the page', async (t) => {
  stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  assert.equal(profile.totalSolved, 14);
  assert.equal(profile.rawStats.geeksforgeeks.codingScore, 34, 'must not pick up the decoy score');
  assert.equal(profile.rawStats.geeksforgeeks.displayName, 'Ishaan Saxena');
  assert.equal(profile.rawStats.geeksforgeeks.monthlyScore, 8);
  assert.equal(profile.rawStats.geeksforgeeks.memberSince, '2025-11-30 01:31:09');
});

test('the handle is the username from the profile URL, never the payload handle field', async (t) => {
  // GeeksforGeeks carries an unrelated `handle` inside the same record. Storing
  // it would repoint the profile at a different account on the next sync.
  stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  assert.equal(profile.handle, 'saxenaigahb');
  assert.equal(profile.profileUrl, 'https://www.geeksforgeeks.org/profile/saxenaigahb');
});

test('difficulty counts are null, because GeeksforGeeks publishes no split', async (t) => {
  stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  // Zero here would render as "0 hard problems solved", which is a measurement
  // GeeksforGeeks never made.
  assert.equal(profile.easySolved, null);
  assert.equal(profile.mediumSolved, null);
  assert.equal(profile.hardSolved, null);
  assert.equal(profile.acceptanceRate, null);
  assert.equal(profile.rating, null, 'GeeksforGeeks has no contest rating at all');
  assert.equal(profile.contestsAttended, null);
});

test('an empty institute rank reads as absent rather than as an empty label', async (t) => {
  stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  assert.equal(profile.rawStats.geeksforgeeks.instituteRank, null);
  assert.equal(profile.rawStats.geeksforgeeks.instituteName, null);
});

test('a solved count of zero is kept as zero', async (t) => {
  // Distinct from the nulls above: this one really was measured.
  stubFetch(t, htmlResponse(profilePage({ ...ISHAAN, total_problems_solved: 0 })));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  assert.equal(profile.totalSolved, 0);
});

test('fields missing from the payload cost statistics, not the sync', async (t) => {
  // A deploy that renames or drops fields must still yield a usable profile.
  stubFetch(t, htmlResponse(profilePage({ total_problems_solved: 7 })));

  const profile = await GeeksforGeeksService.fetchProfile('saxenaigahb');

  assert.equal(profile.totalSolved, 7);
  assert.equal(profile.rawStats.geeksforgeeks.codingScore, null);
  assert.equal(profile.rawStats.geeksforgeeks.displayName, null);
});

test('a page with no statistics block is reported as not found', async (t) => {
  stubFetch(t, htmlResponse('<!DOCTYPE html><html><body>Profile not available</body></html>'));

  await assert.rejects(() => GeeksforGeeksService.fetchProfile('ghost'), (error) => {
    assert.equal(error.statusCode, 404);
    return true;
  });
});

test('a 404 from GeeksforGeeks is a 404 here', async (t) => {
  stubFetch(t, htmlResponse('<html><body>Not Found</body></html>', 404));

  await assert.rejects(() => GeeksforGeeksService.fetchProfile('ghost'), (error) => {
    assert.equal(error.statusCode, 404);
    return true;
  });
});

test('rate limiting is a 503, so the caller knows to retry', async (t) => {
  stubFetch(t, htmlResponse('', 429));

  await assert.rejects(() => GeeksforGeeksService.fetchProfile('saxenaigahb'), (error) => {
    assert.equal(error.statusCode, 503);
    return true;
  });
});

test('an unreachable site is a 503, never a 500', async (t) => {
  // Being unable to reach GeeksforGeeks is not a bug in DevProof.
  stubFetch(t, () => {
    throw new Error('getaddrinfo ENOTFOUND www.geeksforgeeks.org');
  });

  await assert.rejects(() => GeeksforGeeksService.fetchProfile('saxenaigahb'), (error) => {
    assert.equal(error.statusCode, 503);
    return true;
  });
});

test('a blank username is rejected before any request is made', async (t) => {
  const calls = stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  await assert.rejects(() => GeeksforGeeksService.fetchProfile('   '), (error) => {
    assert.equal(error.statusCode, 400);
    return true;
  });
  assert.equal(calls.length, 0);
});

test('the username is URL-encoded into the request path', async (t) => {
  const calls = stubFetch(t, htmlResponse(profilePage(ISHAAN)));

  await GeeksforGeeksService.fetchProfile('a b/c');

  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/profile/a%20b%2Fc'), `unexpected url: ${calls[0].url}`);
});
