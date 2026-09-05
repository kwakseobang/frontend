import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureCore, type CoreConfig, type TokenPersistence } from "../config";
import { getTokens, resetTokenStoreForTests, setTokens } from "../auth/tokenStore";
import { ApiError, NetworkError, isRetryableError, request } from "./client";
import type { AuthTokens } from "../types/api";

const tokens: AuthTokens = { accessToken: "access-1", refreshToken: "refresh-1" };
const reissued: AuthTokens = { accessToken: "access-2", refreshToken: "refresh-2" };

const persistence: TokenPersistence = {
  loadSync: () => null,
  load: async () => null,
  save: async () => {},
  clear: async () => {},
};

function configure(overrides: Partial<CoreConfig> = {}) {
  configureCore({
    baseUrl: "http://localhost:8080",
    tokenPersistence: persistence,
    onSessionExpired: () => {},
    formData: {
      appendJsonPart: async () => {},
      appendFilePart: () => {},
      fetchRemoteAsUpload: async () => ({ uri: "", name: "", type: "" }),
    },
    ...overrides,
  });
}

/** Minimal stand-in for the responses fetch hands back. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const ok = (data: unknown) => jsonResponse(200, { data });
const unauthorized = () => jsonResponse(401, { error: { message: "만료" } });

beforeEach(() => {
  resetTokenStoreForTests();
  configure();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("request timeouts", () => {
  it("gives up on a request the server never answers instead of hanging the UI", async () => {
    vi.useFakeTimers();
    // A socket that resolves never — what an iOS PWA gets handed after a resume.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      ),
    );

    const pending = request("/api/memories").catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(9_000);

    const err = await pending;
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).timedOut).toBe(true);
  });

  it("clears the timer on a normal response so the abort never fires late", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => ok([1, 2])));

    await expect(request("/api/memories")).resolves.toEqual([1, 2]);
    // Nothing left scheduled: a leaked abort would land on a later, unrelated request.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports an unreachable backend as a network failure, not an API error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));

    const err = await request("/api/memories").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect((err as NetworkError).timedOut).toBe(false);
  });
});

describe("401 recovery", () => {
  it("reissues once and replays the original request", async () => {
    setTokens(tokens);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(ok(reissued))
      .mockResolvedValueOnce(ok("replayed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/api/memories")).resolves.toBe("replayed");
    expect(getTokens()).toEqual(reissued);
    // The replay must carry the new token, not the one that just 401'd.
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${reissued.accessToken}`);
  });

  it("shares one reissue across concurrent 401s so the rotated token is not spent twice", async () => {
    setTokens(tokens);
    let reissueCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/auth/reissue")) {
          reissueCalls += 1;
          return ok(reissued);
        }
        return url.includes("replayed-marker") ? ok("x") : unauthorized();
      }),
    );

    // Both start against the same stale access token.
    const results = await Promise.allSettled([request("/api/a"), request("/api/b")]);
    expect(reissueCalls).toBe(1);
    expect(results).toHaveLength(2);
  });

  // The regression that dropped the user on /login every time they reopened the PWA:
  // the refresh token was fine, the request just never landed.
  it("keeps the session when the reissue request cannot reach the backend", async () => {
    setTokens(tokens);
    const onSessionExpired = vi.fn();
    configure({ onSessionExpired });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/auth/reissue")) throw new TypeError("Failed to fetch");
        return unauthorized();
      }),
    );

    const err = await request("/api/memories").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(getTokens()).toEqual(tokens);
  });

  it("keeps the session when the reissue endpoint answers 5xx", async () => {
    setTokens(tokens);
    const onSessionExpired = vi.fn();
    configure({ onSessionExpired });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/api/auth/reissue") ? jsonResponse(502, {}) : unauthorized(),
      ),
    );

    const err = await request("/api/memories").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(502);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(getTokens()).toEqual(tokens);
  });

  it("ends the session only when the backend rejects the refresh token", async () => {
    setTokens(tokens);
    const onSessionExpired = vi.fn();
    configure({ onSessionExpired });
    vi.stubGlobal("fetch", vi.fn(async () => unauthorized()));

    const err = await request("/api/memories").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(getTokens()).toBeNull();
  });

  it("treats a malformed reissue body as transport noise rather than a dead session", async () => {
    setTokens(tokens);
    const onSessionExpired = vi.fn();
    configure({ onSessionExpired });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/api/auth/reissue") ? ok({ accessToken: "only-half" }) : unauthorized(),
      ),
    );

    await expect(request("/api/memories")).rejects.toBeInstanceOf(ApiError);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(getTokens()).toEqual(tokens);
  });

  it("does not reissue for a request that carries an explicit token", async () => {
    setTokens(tokens);
    const fetchMock = vi.fn(async () => unauthorized());
    vi.stubGlobal("fetch", fetchMock);

    await expect(request("/api/members/me", { accessToken: "fresh" })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getTokens()).toEqual(tokens);
  });
});

describe("isRetryableError", () => {
  it("retries transport failures and sick servers, not the backend's considered answers", () => {
    expect(isRetryableError(new NetworkError("offline", false))).toBe(true);
    expect(isRetryableError(new ApiError(503, "unavailable"))).toBe(true);
    expect(isRetryableError(new ApiError(404, "없음"))).toBe(false);
    expect(isRetryableError(new ApiError(401, "만료"))).toBe(false);
    expect(isRetryableError(new Error("boom"))).toBe(false);
  });
});
