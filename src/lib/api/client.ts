import { clearTokens, getTokens, setTokens } from "@/lib/auth/tokenStorage";
import type { AuthTokens } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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

interface RequestOptions {
  method?: string;
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(BASE_URL + path);
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

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
  });
}

let reissuePromise: Promise<AuthTokens | null> | null = null;

async function doReissue(): Promise<AuthTokens | null> {
  const tokens = getTokens();
  if (!tokens) return null;
  const res = await rawRequest("/api/auth/reissue", {
    method: "POST",
    json: { refreshToken: tokens.refreshToken },
  });
  if (!res.ok) return null;
  const body = await res.json();
  const next = body.data as AuthTokens;
  setTokens(next);
  return next;
}

// Concurrent 401s must share one reissue call — the backend rotates single-use refresh
// tokens, so two independent reissue() calls with the same stale token would let one
// succeed and the other be rejected, wrongly logging the user out.
function reissue(): Promise<AuthTokens | null> {
  if (!reissuePromise) {
    reissuePromise = doReissue().finally(() => {
      reissuePromise = null;
    });
  }
  return reissuePromise;
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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  let tokens = auth ? getTokens() : null;

  let res = await rawRequest(path, options, tokens?.accessToken);

  if (res.status === 401 && auth) {
    const reissued = await reissue();
    if (!reissued) {
      clearTokens();
      // Not called from a component — no router available. A hard redirect also
      // discards in-memory state (React Query cache, etc.) on session expiry.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError(401, "인증이 만료되었습니다");
    }
    tokens = reissued;
    res = await rawRequest(path, options, tokens.accessToken);
  }

  if (!res.ok) {
    const parsed = await parseError(res);
    throw new ApiError(res.status, parsed.message, parsed.code, parsed.data);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.data as T;
}
