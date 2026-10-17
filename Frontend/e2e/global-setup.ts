/**
 * Playwright global setup:
 *  1. Make sure the dedicated E2E test accounts exist on the isolated backend
 *     (idempotent — reuses accounts from earlier runs).
 *  2. Sign each account in ONCE through the real /auth/login endpoint and save
 *     the resulting session as Playwright storage state. Specs inject these
 *     states instead of logging in again, keeping total login attempts far
 *     under the backend's deliberate per-IP limit (10 / 15 min).
 *
 * The saved cookies are for the isolated backend only; nothing here touches
 * production credentials, tokens, or services.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { request as playwrightRequest } from "@playwright/test";
import {
  API_V1,
  ensureUser,
  ISOLATION_USER,
  MAIN_USER,
  STORAGE_ISOLATION,
  STORAGE_MAIN
} from "./helpers";

async function saveSession(
  user: { email: string; password: string },
  storagePath: string
): Promise<void> {
  const context = await playwrightRequest.newContext();
  try {
    const login = await context.post(`${API_V1}/auth/login`, {
      data: { email: user.email, password: user.password }
    });
    if (!login.ok()) {
      throw new Error(
        `[e2e] Could not create a saved session for ${user.email}: ` +
          `login=${login.status()} ${await login.text()}`
      );
    }
    mkdirSync(path.dirname(storagePath), { recursive: true });
    await context.storageState({ path: storagePath });
  } finally {
    await context.dispose();
  }
}

export default async function globalSetup(): Promise<void> {
  const api = await playwrightRequest.newContext();
  try {
    await ensureUser(api, MAIN_USER);
    await ensureUser(api, ISOLATION_USER);
  } finally {
    await api.dispose();
  }

  await saveSession(MAIN_USER, STORAGE_MAIN);
  await saveSession(ISOLATION_USER, STORAGE_ISOLATION);
}
