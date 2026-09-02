import { router } from "expo-router";
import { configureCore } from "@memento/core";
import { secureStorePersistence } from "./secureStorePersistence";
import { nativeFormDataAdapter } from "./multipart";

/**
 * Binds @memento/core to React Native. Imported for its side effect by ./index.ts, which
 * is the only way app code is allowed to reach core.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

configureCore({
  baseUrl: API_BASE_URL,
  tokenPersistence: secureStorePersistence,
  onSessionExpired: () => {
    // replace, not push: the expired session must not be reachable with the back gesture.
    router.replace("/login");
  },
  formData: nativeFormDataAdapter,
});
