import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureCore, type CoreConfig, type TokenPersistence } from "../config";
import type { AuthTokens } from "../types/api";
import {
  clearTokens,
  getTokens,
  hasTokensSnapshot,
  hydrateTokens,
  isTokenStoreHydrated,
  resetTokenStoreForTests,
  setTokens,
  subscribeToTokens,
  syncTokensFromPersistence,
} from "./tokenStore";

const tokens: AuthTokens = { accessToken: "access-1", refreshToken: "refresh-1" };
const otherTokens: AuthTokens = { accessToken: "access-2", refreshToken: "refresh-2" };

/** Records writes so we can assert the memory cache and the store stay in step. */
function fakePersistence(initial: AuthTokens | null, { sync }: { sync: boolean }) {
  const state = { value: initial, saves: 0, clears: 0 };
  const persistence: TokenPersistence = {
    load: async () => state.value,
    save: async (next) => {
      state.value = next;
      state.saves += 1;
    },
    clear: async () => {
      state.value = null;
      state.clears += 1;
    },
  };
  if (sync) persistence.loadSync = () => state.value;
  return { state, persistence };
}

function configure(persistence: TokenPersistence, overrides: Partial<CoreConfig> = {}) {
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

beforeEach(() => {
  resetTokenStoreForTests();
});

describe("hydrateTokens", () => {
  // The web's whole boot depends on this: localStorage is synchronous, so the first
  // render must already know the session rather than flashing a logged-out shell.
  it("adopts a synchronously readable session without awaiting", () => {
    const { persistence } = fakePersistence(tokens, { sync: true });
    configure(persistence);

    hydrateTokens();

    expect(isTokenStoreHydrated()).toBe(true);
    expect(getTokens()).toEqual(tokens);
  });

  // React Native's SecureStore is async-only. Until it settles the store must report
  // "not hydrated" — which is "we don't know yet", not "logged out", and so must not
  // send the app to the login screen.
  it("reports not-hydrated until an async store settles", async () => {
    const { persistence } = fakePersistence(tokens, { sync: false });
    configure(persistence);

    const pending = hydrateTokens();
    expect(isTokenStoreHydrated()).toBe(false);
    expect(getTokens()).toBeNull();

    await pending;
    expect(isTokenStoreHydrated()).toBe(true);
    expect(getTokens()).toEqual(tokens);
  });

  it("loads only once even when called concurrently", async () => {
    const { persistence } = fakePersistence(tokens, { sync: false });
    const load = vi.spyOn(persistence, "load");
    configure(persistence);

    await Promise.all([hydrateTokens(), hydrateTokens()]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  // A keychain that fails to read is an empty session, not a crashed boot.
  it("treats a failing store as no session", async () => {
    const { persistence } = fakePersistence(null, { sync: false });
    persistence.load = async () => {
      throw new Error("keychain unavailable");
    };
    configure(persistence);

    await hydrateTokens();

    expect(isTokenStoreHydrated()).toBe(true);
    expect(getTokens()).toBeNull();
  });

  it("notifies subscribers once an async store settles", async () => {
    const { persistence } = fakePersistence(tokens, { sync: false });
    configure(persistence);
    const onChange = vi.fn();
    subscribeToTokens(onChange);

    await hydrateTokens();

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("setTokens / clearTokens", () => {
  it("round-trips a pair and mirrors it to the store", async () => {
    const { state, persistence } = fakePersistence(null, { sync: true });
    configure(persistence);

    setTokens(tokens);
    expect(getTokens()).toEqual(tokens);

    await vi.waitFor(() => expect(state.value).toEqual(tokens));
  });

  it("clears both the cache and the store", async () => {
    const { state, persistence } = fakePersistence(tokens, { sync: true });
    configure(persistence);
    hydrateTokens();

    clearTokens();
    expect(getTokens()).toBeNull();

    await vi.waitFor(() => expect(state.value).toBeNull());
  });

  // The session is authoritative in memory, so a keychain that refuses the write still
  // leaves the user logged in for this run — they only lose it on the next cold start.
  it("keeps the session when persisting fails", () => {
    const { persistence } = fakePersistence(null, { sync: true });
    persistence.save = () => Promise.reject(new Error("write failed"));
    configure(persistence);

    expect(() => setTokens(tokens)).not.toThrow();
    expect(getTokens()).toEqual(tokens);
  });
});

describe("hasTokensSnapshot", () => {
  it("tracks whether a session is held", () => {
    const { persistence } = fakePersistence(null, { sync: true });
    configure(persistence);

    expect(hasTokensSnapshot()).toBe(false);
    setTokens(tokens);
    expect(hasTokensSnapshot()).toBe(true);
    clearTokens();
    expect(hasTokensSnapshot()).toBe(false);
  });
});

describe("subscribeToTokens", () => {
  it("notifies on write and on clear, and stops after unsubscribing", () => {
    const { persistence } = fakePersistence(null, { sync: true });
    configure(persistence);
    const onChange = vi.fn();
    const unsubscribe = subscribeToTokens(onChange);

    setTokens(tokens);
    expect(onChange).toHaveBeenCalledTimes(1);

    clearTokens();
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    setTokens(tokens);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("syncTokensFromPersistence", () => {
  // Cross-tab sync: logging out in one tab has to drop the session in the others.
  it("adopts an externally changed session and notifies", () => {
    const { persistence } = fakePersistence(tokens, { sync: true });
    configure(persistence);
    hydrateTokens();
    const onChange = vi.fn();
    subscribeToTokens(onChange);

    syncTokensFromPersistence(null);

    expect(getTokens()).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("adopts a different session from another tab", () => {
    const { persistence } = fakePersistence(tokens, { sync: true });
    configure(persistence);
    hydrateTokens();

    syncTokensFromPersistence(otherTokens);

    expect(getTokens()).toEqual(otherTokens);
  });

  // Every write mirrors to storage, which fires a storage event in the *other* tabs but
  // also, in some browsers, echoes back here. Re-emitting on an unchanged value would
  // loop through useSyncExternalStore for no reason.
  it("ignores an unchanged session without notifying", () => {
    const { persistence } = fakePersistence(tokens, { sync: true });
    configure(persistence);
    hydrateTokens();
    const onChange = vi.fn();
    subscribeToTokens(onChange);

    syncTokensFromPersistence({ ...tokens });

    expect(onChange).not.toHaveBeenCalled();
  });
});
