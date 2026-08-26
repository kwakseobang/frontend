import { clearTokens, getTokens, setTokens } from "@/lib/auth/tokenStorage";
import type { AuthTokens } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
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
  const res = await rawRequest("/api/v1/auth/reissue", {
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

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? `요청에 실패했습니다 (${res.status})`;
  } catch {
    return `요청에 실패했습니다 (${res.status})`;
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
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return body.data as T;
}
