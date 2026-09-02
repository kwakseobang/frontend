import {
  configureCore,
  hydrateTokens,
  syncTokensFromPersistence,
  type AuthTokens,
  type TokenPersistence,
  type UploadFile,
} from "@memento/core";

/**
 * Wires @memento/core to the browser. This module is imported for its side effect and
 * must run before anything calls the API or reads the session — AuthContext imports it
 * at the top of its module for exactly that reason.
 *
 * It is evaluated during SSR too (it is pulled in by a client component), so every
 * browser global is guarded rather than assumed.
 */

if (!process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set — refusing to run a production build against an implicit localhost fallback.");
}
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const ACCESS_KEY = "memento:accessToken";
const REFRESH_KEY = "memento:refreshToken";

function readTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  // A half-written session must not read as authenticated, or every request goes out
  // with a token that cannot be reissued.
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

const persistence: TokenPersistence = {
  loadSync: readTokens,
  load: async () => readTokens(),
  save: async (tokens) => {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear: async () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

configureCore({
  baseUrl: BASE_URL,
  tokenPersistence: persistence,
  onSessionExpired: () => {
    // A hard redirect rather than a router push: this is called from lib code with no
    // router in scope, and reloading also discards in-memory state (React Query cache,
    // etc.) that belonged to the expired session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (typeof window !== "undefined") window.location.href = "/login";
  },
  formData: {
    appendJsonPart: async (form, name, value) => {
      form.append(name, new Blob([JSON.stringify(value)], { type: "application/json" }));
    },
    appendFilePart: (form, name, file) => {
      form.append(name, file as Blob);
    },
    fetchRemoteAsUpload: async (url): Promise<UploadFile> => {
      const res = await fetch(url);
      const blob = await res.blob();
      const filename = url.split("/").pop()?.split("?")[0] || "image";
      return new File([blob], filename, { type: blob.type });
    },
  },
});

hydrateTokens();

// Cross-tab sync: log out in one tab and every other open tab drops its session too,
// instead of holding a UI that no longer has tokens behind it.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== ACCESS_KEY && event.key !== REFRESH_KEY) return;
    syncTokensFromPersistence(readTokens());
  });
}
