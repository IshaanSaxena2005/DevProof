/**
 * Thin client for the DevProof backend.
 *
 * The backend wraps every response as { success, message, data?, error? } and
 * authenticates via an httpOnly cookie, so every request sends credentials and
 * the envelope is unwrapped here — callers just get `data`.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "")
  ?? "http://localhost:5000/api/v1";

/** Field-level validation detail, as produced by the Zod error handler. */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  /** Populated for 400s raised by validateRequest. */
  readonly fieldErrors: FieldError[];

  constructor(message: string, statusCode: number, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }

  /** True when the session is missing or expired. */
  get isUnauthorized() {
    return this.statusCode === 401;
  }

  /** Message for a specific field, if the backend flagged one. */
  fieldError(name: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === name || e.field === `body.${name}`)?.message;
  }
}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}

/** Normalizes the several error shapes the backend can return into FieldError[]. */
function toFieldErrors(error: unknown): FieldError[] {
  if (!Array.isArray(error)) return [];
  return error.flatMap((e) =>
    e && typeof e === "object" && "field" in e && "message" in e
      ? [{ field: String((e as FieldError).field), message: String((e as FieldError).message) }]
      : []
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      // Sends and accepts the httpOnly auth cookie.
      credentials: "include",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      ...init,
    });
  } catch {
    // fetch only rejects on network-level failure, never on a 4xx/5xx.
    throw new ApiError("Cannot reach the DevProof API. Is the backend running?", 0);
  }

  // 204 and other empty bodies would blow up .json().
  const raw = await response.text();
  let body: Envelope<T> | null = null;
  if (raw) {
    try {
      body = JSON.parse(raw) as Envelope<T>;
    } catch {
      throw new ApiError(
        `Unexpected non-JSON response from the API (HTTP ${response.status}).`,
        response.status
      );
    }
  }

  if (!response.ok || body?.success === false) {
    throw new ApiError(
      body?.message ?? `Request failed with status ${response.status}`,
      response.status,
      toFieldErrors(body?.error)
    );
  }

  return body?.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "POST",
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    }),
  patch: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { BASE_URL };
