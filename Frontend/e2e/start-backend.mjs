/**
 * Playwright `webServer` command for the backend (Task 21).
 *
 * Responsibilities, in order:
 *   1. Fail fast with a clear message if Backend/dist is not built.
 *   2. Recreate an ISOLATED database on the local compose Postgres
 *      (devproof_e2e_test) — drop, create, then apply the committed Prisma
 *      migrations. Only this dedicated database is ever touched; the
 *      development database (devproof_db) and any production database are
 *      never referenced by this script.
 *   3. Start the built backend on the e2e port with an isolated environment.
 *      Every variable below is a non-secret placeholder: the e2e suite must
 *      never read or require real credentials, and GitHub OAuth + Groq stay
 *      disabled so no live external service is contacted from the tests.
 *
 * Override points (CI / other machines):
 *   E2E_DATABASE_URL — full Postgres URL of the dedicated e2e database.
 *   E2E_BACKEND_PORT — backend port (default 5399).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const backendDir = path.resolve(frontendDir, "..", "Backend");
const port = process.env.E2E_BACKEND_PORT || "5399";

const databaseUrl =
  process.env.E2E_DATABASE_URL ||
  "postgresql://devproof:devproof_local_dev@localhost:5434/devproof_e2e_test?schema=public";

const isolatedEnv = {
  ...process.env,
  NODE_ENV: "test",
  PORT: port,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: "devproof-e2e-secret-not-used-in-production",
  FRONTEND_URL: "http://127.0.0.1:4319",
  // Deliberately disabled so tests can never contact live services:
  GITHUB_CLIENT_ID: "",
  GITHUB_CLIENT_SECRET: "",
  GITHUB_WEBHOOK_URL: "",
  GITHUB_CALLBACK_URL: "",
  GITHUB_WEBHOOK_SECRET: "",
  GITHUB_APP_ID: "",
  GITHUB_PRIVATE_KEY: "",
  GITHUB_APP_SLUG: "",
  GROQ_API_KEY: ""
};

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

/** Run a prisma CLI subcommand; returns the exit code. */
function prisma(args) {
  // shell:true is required to launch the npm shim (npx.cmd) on Windows.
  const result = spawnSync(npx, ["prisma", ...args], {
    cwd: backendDir,
    env: isolatedEnv,
    stdio: "inherit",
    shell: true
  });
  return result.status ?? 1;
}

if (!existsSync(path.join(backendDir, "dist", "server.js"))) {
  console.error(
    "[e2e] Backend/dist/server.js is missing. Run `npm run build` inside Backend/ first " +
      "(the E2E suite runs the real compiled backend, not ts-node)."
  );
  process.exit(1);
}

// Admin connection for CREATE/DROP DATABASE (same server, postgres database).
const adminUrl = databaseUrl.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

console.log("[e2e] Recreating isolated database devproof_e2e_test on the local Postgres...");
const sqlFile = (sql) => {
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), "devproof-e2e-")), "stmt.sql");
  writeFileSync(file, sql);
  return file;
};
prisma(["db", "execute", "--url", adminUrl, "--file", sqlFile("DROP DATABASE IF EXISTS devproof_e2e_test")]);
prisma(["db", "execute", "--url", adminUrl, "--file", sqlFile("CREATE DATABASE devproof_e2e_test")]);

console.log("[e2e] Applying committed migrations to devproof_e2e_test...");
const migrateStatus = prisma(["migrate", "deploy"]);
if (migrateStatus !== 0) {
  console.error("[e2e] prisma migrate deploy failed on the isolated database; aborting.");
  process.exit(migrateStatus ?? 1);
}

console.log(`[e2e] Starting backend on http://127.0.0.1:${port} (isolated DB, no external services).`);
const server = spawn(process.execPath, [path.join("dist", "server.js")], {
  cwd: backendDir,
  env: isolatedEnv,
  stdio: "inherit"
});

const stop = (signal) => () => server.kill(signal);
process.on("SIGTERM", stop("SIGTERM"));
process.on("SIGINT", stop("SIGINT"));
server.on("exit", (code) => process.exit(code ?? 0));
