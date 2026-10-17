import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E configuration (Task 21).
 *
 * Deliberately separate from the unit test setup (node --test via `npm test`):
 * this suite drives a real Chromium against the production Vite build served
 * by `vite preview`, plus the real compiled backend running against an
 * isolated SQLite database (e2e/start-backend.mjs). No live GitHub, LeetCode,
 * GFG or Groq service is contacted — external boundaries stay disabled or are
 * mocked per test with page.route().
 *
 * Base URL is configurable: set E2E_BASE_URL to point the suite at an already
 * running stack (servers are then not started by Playwright).
 */
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4319";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // The suite shares one backend + one SQLite file; serial execution keeps
  // runs deterministic (auth state, created records).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Spline and landing animations are asserted on desktop; keep the default
    // reduced-motion off so animations are observable, individual specs opt in.
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined // an external stack is provided; do not start servers
    : [
        {
          command: "node e2e/start-backend.mjs",
          url: `${process.env.E2E_BACKEND_ORIGIN || "http://127.0.0.1:5399"}/api/v1/health`,
          reuseExistingServer: false,
          timeout: 120_000,
          stdout: "pipe",
          stderr: "pipe"
        },
        {
          command: "npm run preview -- --outDir dist-e2e --port 4319 --strictPort --host 127.0.0.1",
          url: "http://127.0.0.1:4319",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000
        }
      ]
});
