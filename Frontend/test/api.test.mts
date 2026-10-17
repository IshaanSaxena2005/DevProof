/**
 * API client tests.
 *
 * `src/lib/api.mts` is the single choke point every dashboard request goes
 * through, so the guarantees it makes are app-wide: demo mode can never write,
 * the `{ success, data, error }` envelope is unwrapped, and every failure
 * arrives as an ApiError with the field-level detail Login renders. None of
 * those are visible from a page test, so they are tested here against a stubbed
 * fetch — no backend required.
 *
 * `.mts` and node:test, matching the other suites in this directory.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError, BASE_URL } from "../src/lib/api.mts";
import { setDemoActive, DEMO_READ_ONLY_MESSAGE } from "../src/demo/mode.mts";

type Stub = {
  calls: { url: string; init: RequestInit }[];
  respond: (status: number, body: unknown, ok?: boolean) => void;
  networkFail: () => void;
};

const stub: Stub = {
  calls: [],
  respond() {},
  networkFail() {},
};

const realFetch = globalThis.fetch;

beforeEach(() => {
  stub.calls = [];
  setDemoActive(false);

  stub.respond = (status, body, ok = status >= 200 && status < 300) => {
    globalThis.fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
      stub.calls.push({ url: String(url), init });
      return {
        ok,
        status,
        text: async () => (body === undefined ? "" : JSON.stringify(body)),
      } as Response;
    }) as typeof fetch;
  };

  stub.networkFail = () => {
    globalThis.fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
      stub.calls.push({ url: String(url), init });
      throw new TypeError("fetch failed");
    }) as typeof fetch;
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
  setDemoActive(false);
});

test("successful responses unwrap the data envelope", async () => {
  stub.respond(200, { success: true, message: "ok", data: { id: 7, name: "Ada" } });

  assert.deepEqual(await api.get("/skills"), { id: 7, name: "Ada" });
});

test("every request sends credentials so the httpOnly session cookie travels", async () => {
  stub.respond(200, { success: true, data: null });

  await api.get("/auth/me");

  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].init.credentials, "include");
  assert.equal(stub.calls[0].url, `${BASE_URL}/auth/me`);
});

test("a failed envelope becomes an ApiError with field-level detail", async () => {
  stub.respond(400, {
    success: false,
    message: "Validation Error",
    error: [{ field: "body.email", message: "Invalid email" }],
  });

  const err = await api.post("/auth/register", { email: "nope" }).then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 400);
  assert.equal(err.message, "Validation Error");
  // Login looks up errors by bare field name; the client must bridge the
  // "body." prefix the Zod handler adds.
  assert.equal(err.fieldError("email"), "Invalid email");
});

test("a 401 reports itself as an expired or missing session", async () => {
  stub.respond(401, { success: false, message: "Authentication required. Please log in." });

  const err = await api.get("/auth/me").then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal(err.isUnauthorized, true);
});

test("an unreachable backend fails as a network error, not a crash", async () => {
  stub.networkFail();

  const err = await api.get("/health").then(
    () => null,
    (e: unknown) => e,
  );

  assert.ok(err instanceof ApiError);
  assert.equal(err.statusCode, 0);
  assert.match(err.message, /cannot reach/i);
});

test("demo mode refuses writes before any request is sent", async () => {
  setDemoActive(true);
  stub.respond(200, { success: true, data: null });

  for (const call of [
    () => api.post("/skills", { name: "Kotlin" }),
    () => api.patch("/certifications/abc", { name: "x" }),
    () => api.delete("/courses/abc"),
  ]) {
    const err = await call().then(
      () => null,
      (e: unknown) => e,
    );
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 403);
    assert.equal(err.message, DEMO_READ_ONLY_MESSAGE);
  }

  assert.equal(stub.calls.length, 0, "a demo visitor's write must never reach the network");
});

test("demo mode still allows reads", async () => {
  setDemoActive(true);
  stub.respond(200, { success: true, data: { skills: [] } });

  assert.deepEqual(await api.get("/skills"), { skills: [] });
  assert.equal(stub.calls.length, 1);
});
