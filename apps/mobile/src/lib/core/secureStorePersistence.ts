import * as SecureStore from "expo-secure-store";
import type { AuthTokens, TokenPersistence } from "@memento/core";

const ACCESS_KEY = "memento.accessToken";
const REFRESH_KEY = "memento.refreshToken";

/**
 * SecureStore is async-only, which is why core keeps the session in memory and only
 * mirrors it here (see packages/core/src/auth/tokenStore.ts). There is deliberately no
 * loadSync: the app gates its splash screen on hydrateTokens() instead.
 */
export const secureStorePersistence: TokenPersistence = {
  load: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    // A half-written session must not read as authenticated, or every request goes out
    // with a token that cannot be reissued.
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },
  save: async (tokens: AuthTokens) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    ]);
  },
  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
