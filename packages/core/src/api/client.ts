import { clearTokens, getTokens, setTokens } from "../auth/tokenStore";
import { getCoreConfig } from "../config";
import type { AuthTokens } from "../types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

/**
 * The request never reached a response: offline, DNS/TLS failure, the backend not
 * listening — or our own timeout firing. Distinct from ApiError because it carries no
 * status and, unlike a 4xx, says nothing about whether the session is still valid.
 *
 * This matters most on a phone. An installed PWA resumed after being backgrounded is
 * routinely handed a dead socket, and `fetch` will sit on it until the platform gives
 * up (over a minute on iOS) — which is the endless spinner this class exists to cut short.
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly timedOut: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

/**
 * Nothing the user waits on should hang the UI for longer than this. A warm backend
 * answers these calls in well under a second, so the budget is here for a bad uplink,
 * not for a slow query — and it is deliberately shorter than it feels like it should
 * be, because React Query retries on top of it: the number the user actually sits
 * through is roughly 3 attempts plus backoff, not one timeout.
 */
const REQUEST_TIMEOUT_MS = 8_000;
/** Uploads move real bytes over a phone uplink, so they get a much longer leash. */
const UPLOAD_TIMEOUT_MS = 60_000;

interface RequestOptions {
  method?: string;
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
  /**
   * Use this token instead of the stored session. Lets the login flow verify a
   * freshly issued token before persisting it, so a half-authenticated state never
   * reaches the UI. A 401 here is final — there is nothing to reissue against.
   */
  accessToken?: string;
  /** Override the default timeout for one call. */
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(getCoreConfig().baseUrl + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest(path: string, options: RequestOptions, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.json !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const timeoutMs = options.timeoutMs ?? (options.form ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  // AbortController rather than AbortSignal.timeout(): the latter is missing from
  // older Hermes/React Native runtimes this package also has to run on.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
      signal: controller.signal,
    });
  } catch (cause) {
    const timedOut = controller.signal.aborted;
    throw new NetworkError(
      timedOut ? `서버 응답이 없습니다 (${Math.round(timeoutMs / 1000)}초 초과)` : "네트워크에 연결할 수 없습니다",
      timedOut,
      cause,
    );
  } finally {
    clearTimeout(timer);
  }
}

// Backend error shape: { error: { status, code, message, data } }. `message` is a
// generic per-ErrorType string (e.g. "요청 형식이 올바르지 않습니다.") — the actual
// detail (field validation errors, the raw exception message for 500s, etc.) lives
// in `data` and was previously dropped on the floor. We fold it into the message so
// nothing the backend sends is silently hidden from the user.
function formatErrorData(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return null;
    return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
  }
  return String(data);
}

interface ParsedError {
  message: string;
  code?: string;
  data?: unknown;
}

async function parseError(res: Response): Promise<ParsedError> {
  try {
    const body = await res.json();
    const baseMessage: string = body?.error?.message ?? `요청에 실패했습니다 (${res.status})`;
    const detail = formatErrorData(body?.error?.data);
    return {
      message: detail ? `${baseMessage} (${detail})` : baseMessage,
      code: body?.error?.code,
      data: body?.error?.data,
    };
  } catch {
    return { message: `요청에 실패했습니다 (${res.status})` };
  }
}

/**
 * Why "fatal" is a separate axis from "ok": a failed reissue used to mean one thing —
 * log the user out. But a refresh token is good for 14 days, and most reissue failures
 * on a phone are not the token going bad, they are the request never landing. Ending a
 * valid session because the backend was briefly unreachable is what dropped the user on
 * /login after every app resume. Only the backend actually rejecting the token is fatal.
 */
type ReissueResult =
  | { ok: true; tokens: AuthTokens }
  | { ok: false; fatal: true }
  | { ok: false; fatal: false; cause: unknown };

let reissuePromise: Promise<ReissueResult> | null = null;

async function doReissue(): Promise<ReissueResult> {
  const tokens = getTokens();
  // No refresh token to spend — nothing to recover, and no request worth making.
  if (!tokens) return { ok: false, fatal: true };

  let res: Response;
  try {
    res = await rawRequest("/api/auth/reissue", {
      method: "POST",
      json: { refreshToken: tokens.refreshToken },
    });
  } catch (cause) {
    return { ok: false, fatal: false, cause };
  }

  if (!res.ok) {
    // 5xx — including the 502/504 a cold or restarting backend emits — is the server
    // being unwell, not the session being over. Keep the tokens and let the caller
    // retry. A 4xx is the backend's considered answer: this token is not acceptable.
    if (res.status >= 500) {
      const parsed = await parseError(res);
      return {
        ok: false,
        fatal: false,
        cause: new ApiError(res.status, parsed.message, parsed.code, parsed.data),
      };
    }
    return { ok: false, fatal: true };
  }

  try {
    const body = await res.json();
    const next = body?.data as AuthTokens | undefined;
    // A truncated or unexpected body is a transport problem, not a rejected token.
    if (!next?.accessToken || !next?.refreshToken) {
      return { ok: false, fatal: false, cause: new ApiError(res.status, "재발급 응답이 올바르지 않습니다") };
    }
    setTokens(next);
    return { ok: true, tokens: next };
  } catch (cause) {
    return { ok: false, fatal: false, cause };
  }
}

// Concurrent 401s must share one reissue call — the backend rotates single-use refresh
// tokens, so two independent reissue() calls with the same stale token would let one
// succeed and the other be rejected, wrongly logging the user out.
function reissue(): Promise<ReissueResult> {
  if (!reissuePromise) {
    reissuePromise = doReissue().finally(() => {
      reissuePromise = null;
    });
  }
  return reissuePromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  const explicitToken = options.accessToken;
  let accessToken = explicitToken ?? (auth ? getTokens()?.accessToken : undefined);

  let res = await rawRequest(path, options, accessToken);

  if (res.status === 401 && auth && !explicitToken) {
    const result = await reissue();
    if (!result.ok) {
      if (!result.fatal) {
        // Session left intact on purpose: we never got an answer about whether it is
        // still valid, so the caller retries rather than the user being logged out.
        throw result.cause instanceof Error
          ? result.cause
          : new NetworkError("세션을 갱신하지 못했습니다", false, result.cause);
      }
      clearTokens();
      // Where "logged out" goes is the host's call: the web does a hard navigation
      // (which also discards in-memory state like the React Query cache), the app
      // replaces the route stack. Either way this is not called from a component,
      // so there is no router in scope here.
      getCoreConfig().onSessionExpired();
      throw new ApiError(401, "인증이 만료되었습니다");
    }
    accessToken = result.tokens.accessToken;
    res = await rawRequest(path, options, accessToken);
  }

  if (!res.ok) {
    const parsed = await parseError(res);
    throw new ApiError(res.status, parsed.message, parsed.code, parsed.data);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.data as T;
}

/**
 * Shared retry predicate for both clients' query layers. "Retryable" means the request
 * plausibly succeeds if repeated: a transport failure, or a server that is sick rather
 * than answering. A 4xx is the backend's considered answer — repeating it only delays
 * showing the user what went wrong.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500;
  if (error instanceof NetworkError) return true;
  return false;
}
