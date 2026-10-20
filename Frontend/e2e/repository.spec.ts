/**
 * Journey E — Repository connection and analysis UI.
 *
 * IMPORTANT: the GitHub boundary is fully mocked at the browser network layer
 * (page.route). These tests verify DevProof's UI states — loading, success,
 * empty, error — and that analysis results populate the dashboard sections.
 * They do NOT verify live GitHub OAuth, the GitHub App installation flow, or
 * real repository analysis; those require real credentials and remain
 * untested here by design.
 *
 * Authentication is real (isolated backend, dedicated test account); only the
 * GitHub-facing endpoints are fixture-backed.
 */
import { expect, test, type Page } from "@playwright/test";
import { API_V1, collectPageErrors, STORAGE_MAIN } from "./helpers";

// Session injected from global setup; GitHub endpoints are mocked per test.
test.use({ storageState: STORAGE_MAIN });

/**
 * Make the signed-in session look like a GitHub-linked account by patching
 * /auth/me with a synthetic githubAccount (the UI keys the repository picker
 * off its presence). The backend itself stays real; only this one response is
 * rewritten, and nothing here contacts GitHub.
 */
async function serveLinkedGitHubSession(page: Page): Promise<void> {
  const res = await page.request.get(`${API_V1}/auth/me`);
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  const patched = {
    ...body,
    data: {
      ...body.data,
      user: {
        ...body.data.user,
        githubAccount: {
          username: "e2e-owner",
          profileUrl: "https://github.com/e2e-owner",
          avatarUrl: null,
          totalRepos: 1,
          lastSyncedAt: null
        }
      }
    }
  };
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: patched }));
}

const GH_LIST = "**/api/v1/repositories/github*";
const REPO_LIST = "**/api/v1/repositories";
const REPO_CONNECT = "**/api/v1/repositories/connect";

const ghRepoOption = {
  fullName: "e2e-owner/e2e-repo",
  name: "e2e-repo",
  description: "A fixture repository for the E2E suite.",
  language: "TypeScript",
  isPrivate: false,
  starsCount: 12,
  forksCount: 3,
  htmlUrl: "https://github.com/e2e-owner/e2e-repo",
  githubUpdatedAt: new Date().toISOString()
};

const connectedRepo = {
  id: "e2e-repo-1",
  name: "e2e-repo",
  fullName: "e2e-owner/e2e-repo",
  description: "A fixture repository for the E2E suite.",
  language: "TypeScript",
  isPrivate: false,
  starsCount: 12,
  forksCount: 3,
  githubUpdatedAt: ghRepoOption.githubUpdatedAt,
  pushedAt: ghRepoOption.githubUpdatedAt,
  analyses: [{ overallScore: 87, analyzedAt: new Date().toISOString() }]
};

function json(body: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function openConnectPanel(page: Page) {
  await page.goto("/dashboard/repositories");
  // The empty state also offers an "Add Repository" action; the toolbar
  // toggle is the first one in the DOM.
  await page.getByRole("button", { name: "Add Repository" }).first().click();
}

test("GitHub outage surfaces the backend error state", async ({ page }) => {
  // The mocked 503 is this test's own deliberate fixture; its resource-level
  // console line is expected. What matters is that the app surfaces the
  // backend's message instead of crashing.
  const errors = collectPageErrors(page, {
    ignoreResourceUrls: [/\/api\/v1\/repositories\/github/]
  });
  await serveLinkedGitHubSession(page);

  await page.route(GH_LIST, (route) =>
    route.fulfill(
      // The API client reads the top-level `message` of the error envelope.
      json({ success: false, message: "GitHub is unavailable." }, 503)
    )
  );

  await openConnectPanel(page);
  await expect(page.getByText("GitHub is unavailable.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("loading your repositories shows an accessible loading state", async ({ page }) => {
  await serveLinkedGitHubSession(page);
  await page.route(GH_LIST, async (route) => {
    await new Promise((r) => setTimeout(r, 700)); // simulated slow upstream
    await route.fulfill(
      json({ success: true, data: { repositories: [], accessState: "granted", installationCount: 1 } })
    );
  });

  await openConnectPanel(page);
  // The loading state announces itself in text, not only with a spinner.
  await expect(page.getByText(/loading your repositories/i)).toBeVisible();
});

test("empty GitHub access explains the installation state", async ({ page }) => {
  await serveLinkedGitHubSession(page);
  await page.route(GH_LIST, (route) =>
    route.fulfill(
      json({
        success: true,
        data: {
          repositories: [],
          accessState: "not_installed",
          installationCount: 0,
          installationUrl: "https://github.com/apps/devproof-test"
        }
      })
    )
  );

  await openConnectPanel(page);
  await expect(page.getByText(/not installed on your github account/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /install devproof/i })).toBeVisible();
});

test("connect flow populates the dashboard with analysis results", async ({ page }) => {
  const errors = collectPageErrors(page);
  await serveLinkedGitHubSession(page);

  let connected = false;

  // GitHub availability list (mocked).
  await page.route(GH_LIST, (route) =>
    route.fulfill(
      json({ success: true, data: { repositories: [ghRepoOption], accessState: "granted", installationCount: 1 } })
    )
  );
  // Connected repositories list: empty before the connect, populated after.
  await page.route(REPO_LIST, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(
      json({ success: true, data: { repositories: connected ? [connectedRepo] : [] } })
    );
  });
  // The connect call itself (mocked; a real connect would hit GitHub server-side).
  await page.route(REPO_CONNECT, (route) => {
    connected = true;
    return route.fulfill(json({ success: true, message: "Repository connected successfully", data: { repository: connectedRepo } }, 201));
  });
  // Analysis result served to the details page.
  await page.route("**/api/v1/repositories/e2e-repo-1*", (route) =>
    route.fulfill(json({ success: true, data: { repository: connectedRepo } }))
  );

  await openConnectPanel(page);
  await expect(page.getByText("e2e-owner/e2e-repo")).toBeVisible();
  await page.getByRole("button", { name: "Connect" }).click();

  // Success state: the repository card appears with its analysis score chip.
  await expect(page.getByRole("heading", { name: "e2e-repo" })).toBeVisible();
  await expect(page.getByText(/score:\s*87\/100/i)).toBeVisible();

  // The analysis result populates the repository details section.
  await page.getByRole("heading", { name: "e2e-repo" }).click();
  await expect(page).toHaveURL(/\/dashboard\/repositories\/e2e-repo-1$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("repository description editor adds and updates descriptions", async ({ page }) => {
  const errors = collectPageErrors(page);
  await serveLinkedGitHubSession(page);

  const repoWithDesc = {
    ...connectedRepo,
    description: "Original description"
  };

  await page.route(REPO_LIST, (route) =>
    route.fulfill(json({ success: true, data: { repositories: [repoWithDesc] } }))
  );
  await page.route("**/api/v1/repositories/e2e-repo-1*", (route) =>
    route.fulfill(json({ success: true, data: { repository: repoWithDesc } }))
  );

  // Mock the description update endpoint
  let updatedDescription: string | null = null;
  await page.route("**/api/v1/repositories/e2e-repo-1/description", (route) => {
    if (route.request().method() === "PATCH") {
      route.request().postDataJSON().then((body: any) => {
        updatedDescription = body.description;
        const updated = { ...repoWithDesc, description: body.description };
        route.fulfill(json({ success: true, message: "Repository description updated successfully", data: { repository: updated } }, 200));
      });
    } else {
      route.fallback();
    }
  });

  await page.goto("/dashboard/repositories");
  await expect(page.getByRole("heading", { name: "e2e-repo" })).toBeVisible();

  // Open the description editor
  await page.getByRole("button", { name: /edit description/i }).click();
  await expect(page.getByRole("textbox", { name: /repository description/i })).toBeVisible();

  // Clear and enter new description
  const textarea = page.getByRole("textbox", { name: /repository description/i });
  await textarea.clear();
  await textarea.fill("Updated repository description");

  // Save
  await page.getByRole("button", { name: /save/i }).click();

  // Verify success message
  await expect(page.getByText(/description updated/i)).toBeVisible();
  expect(updatedDescription).toBe("Updated repository description");

  expect(errors).toEqual([]);
});

test("description editor handles validation errors", async ({ page }) => {
  const errors = collectPageErrors(page);
  await serveLinkedGitHubSession(page);

  await page.route(REPO_LIST, (route) =>
    route.fulfill(json({ success: true, data: { repositories: [connectedRepo] } }))
  );
  await page.route("**/api/v1/repositories/e2e-repo-1*", (route) =>
    route.fulfill(json({ success: true, data: { repository: connectedRepo } }))
  );

  await page.goto("/dashboard/repositories");
  await expect(page.getByRole("heading", { name: "e2e-repo" })).toBeVisible();

  // Open the description editor
  await page.getByRole("button", { name: /add description/i }).click();
  await expect(page.getByRole("textbox", { name: /repository description/i })).toBeVisible();

  // Enter a description that exceeds the limit
  const textarea = page.getByRole("textbox", { name: /repository description/i });
  await textarea.fill("a".repeat(2001));

  // Try to save - button should be disabled or validation should show
  const saveButton = page.getByRole("button", { name: /save/i });
  await expect(saveButton).toBeDisabled();

  expect(errors).toEqual([]);
});

