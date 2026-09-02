import type { AuthTokens } from "@/types/api";

const ACCESS_KEY = "memento:accessToken";
const REFRESH_KEY = "memento:refreshToken";
const CHANGE_EVENT = "memento:auth-change";

export function getTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * useSyncExternalStore source, so AuthContext can read the session without a
 * setState-in-effect (which React flags as a cascading render, and which meant the
 * whole app tree rendered twice on every cold start).
 *
 * The "storage" event covers the cross-tab case: log out in one tab and every other
 * open tab drops its session too, instead of holding a UI that no longer has tokens.
 */
export function subscribeToTokens(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Boolean rather than the token object: getSnapshot must return a stable value. */
export function hasTokensSnapshot(): boolean {
  return getTokens() !== null;
}
