import { getCoreConfig } from "../config";
import type { AuthTokens } from "../types/api";

/**
 * The session lives in memory and is *mirrored* to platform storage, rather than being
 * read out of storage on every access. That inversion is what lets React Native join:
 * SecureStore is async-only, but api/client.ts needs the access token synchronously in
 * the middle of building a request.
 */
let cached: AuthTokens | null = null;
let hydrated = false;
let hydration: Promise<void> | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Persistence failures must never take the session down with them — see setTokens. */
function runQuietly(operation: () => Promise<unknown>): void {
  try {
    void operation().catch(() => {});
  } catch {
    // A store that throws synchronously is still just a failed write.
  }
}

/**
 * Loads the persisted session once, at boot. Resolves synchronously-in-effect where the
 * store supports it (web); on React Native this is the promise the splash screen waits
 * on, and until it settles `isTokenStoreHydrated()` is false — "we don't know yet",
 * which is different from "logged out" and must not trigger a redirect to login.
 */
export function hydrateTokens(): Promise<void> {
  if (hydration) return hydration;
  const persistence = getCoreConfig().tokenPersistence;

  if (persistence.loadSync) {
    cached = persistence.loadSync();
    hydrated = true;
    hydration = Promise.resolve();
    return hydration;
  }

  hydration = persistence
    .load()
    .catch(() => null)
    .then((tokens) => {
      cached = tokens;
      hydrated = true;
      emit();
    });
  return hydration;
}

export function isTokenStoreHydrated(): boolean {
  return hydrated;
}

export function getTokens(): AuthTokens | null {
  return cached;
}

export function setTokens(tokens: AuthTokens): void {
  cached = tokens;
  hydrated = true;
  emit();
  // Fire-and-forget: a failed write leaves the session working for this run and only
  // shows up as being logged out on the next cold start. Blocking the caller (and so
  // the login flow) on a keychain write would be the worse trade.
  runQuietly(() => getCoreConfig().tokenPersistence.save(tokens));
}

export function clearTokens(): void {
  cached = null;
  hydrated = true;
  emit();
  runQuietly(() => getCoreConfig().tokenPersistence.clear());
}

/**
 * Adopts a session that changed outside this runtime — the web bridges its cross-tab
 * "storage" event through here, so logging out in one tab drops the session in the
 * others instead of leaving a UI with no tokens behind it.
 */
export function syncTokensFromPersistence(tokens: AuthTokens | null): void {
  const unchanged =
    cached?.accessToken === tokens?.accessToken && cached?.refreshToken === tokens?.refreshToken;
  if (unchanged) return;
  cached = tokens;
  hydrated = true;
  emit();
}

/** useSyncExternalStore source, so a session change re-renders without an effect. */
export function subscribeToTokens(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Boolean rather than the token object: getSnapshot must return a stable value. */
export function hasTokensSnapshot(): boolean {
  return cached !== null;
}

/** Test seam — drops all in-memory state so each case starts from a cold boot. */
export function resetTokenStoreForTests(): void {
  cached = null;
  hydrated = false;
  hydration = null;
  listeners.clear();
}
