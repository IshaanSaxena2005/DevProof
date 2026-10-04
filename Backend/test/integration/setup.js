const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * Integration test harness.
 *
 * These tests run against a real HTTP server, real Prisma and a real database,
 * because the failures they exist to catch — a route wired wrong, a validator
 * rejecting valid input, one user reading another's rows — only appear when
 * those pieces are connected.
 *
 * The database is a dedicated one, never the development database: tests create
 * and delete rows, and doing that to real data would be destructive.
 */

const BACKEND_ROOT = path.resolve(__dirname, '../..');

// config/env.ts loads .env, but that happens when the app is required — which is
// after this module needs DATABASE_URL to decide which database to point at. CI
// sets the variable directly and has no .env, so a missing file is fine here.
require('dotenv').config({ path: path.resolve(BACKEND_ROOT, '.env') });

/**
 * Point DATABASE_URL at a sibling "<name>_test" database.
 *
 * In CI the database is already a throwaway, so DATABASE_URL is used as-is;
 * locally it is derived so a developer running `npm run test:integration` can
 * never lose their own data to a test run.
 */
function resolveTestDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL must be set to run integration tests.');

  // CI provisions a disposable database; no need for a second one.
  if (process.env.CI) return base;

  const url = new URL(base);
  // pathname is "/devproof_db"
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

const TEST_DATABASE_URL = resolveTestDatabaseUrl();

/**
 * Create the test database if absent and bring it up to the latest migration.
 *
 * `migrate deploy` is idempotent, so repeated runs are cheap after the first.
 */
function prepareDatabase() {
  const url = new URL(TEST_DATABASE_URL);
  const databaseName = url.pathname.replace(/^\//, '').split('?')[0];

  if (!process.env.CI) {
    // Connect to the default database to issue CREATE DATABASE.
    const adminUrl = new URL(TEST_DATABASE_URL);
    adminUrl.pathname = '/postgres';

    try {
      execFileSync(
        'npx',
        ['prisma', 'db', 'execute', '--url', adminUrl.toString(), '--stdin'],
        { input: `CREATE DATABASE "${databaseName}";`, cwd: BACKEND_ROOT, stdio: 'pipe', shell: true }
      );
    } catch {
      // Almost always "database already exists", which is the normal case.
    }
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
    shell: true
  });
}

prepareDatabase();

// Must be set before the app is required: config/env.ts reads it at import.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret-value';
process.env.NODE_ENV = 'test';

const app = require('../../dist/app.js').default;
const { prisma } = require('../../dist/config/database.js');

/** Start the app on an ephemeral port and return its base URL. */
async function startServer() {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}/api/v1`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

/**
 * A fetch that carries one user's session cookie.
 *
 * Each caller gets its own jar, which is what lets a test act as two different
 * users in the same process and prove they cannot see each other's data.
 */
function createClient(baseUrl) {
  let cookie = null;

  return {
    async request(path, options = {}) {
      const headers = { ...(options.headers || {}) };
      if (cookie) headers.Cookie = cookie;
      if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];

      const text = await response.text();
      let body = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { status: response.status, body, headers: response.headers };
    },
    get(path) {
      return this.request(path);
    },
    post(path, body) {
      return this.request(path, { method: 'POST', body });
    },
    patch(path, body) {
      return this.request(path, { method: 'PATCH', body });
    },
    delete(path) {
      return this.request(path, { method: 'DELETE' });
    },
    get cookie() {
      return cookie;
    }
  };
}

/** A unique email per call, so parallel runs never collide. */
function uniqueEmail(label) {
  return `it-${label}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@devproof.test`;
}

/** Register a user and return a client already carrying their session. */
async function registerUser(baseUrl, label) {
  const client = createClient(baseUrl);
  const email = uniqueEmail(label);
  const password = 'IntegrationTest123!';

  const response = await client.post('/auth/register', { email, password, name: `IT ${label}` });
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Could not register test user: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return { client, email, password };
}

/** Remove every user this suite created, cascading to all their rows. */
async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'it-' } } });
  await prisma.$disconnect();
}

module.exports = { startServer, createClient, registerUser, uniqueEmail, cleanup, prisma };
