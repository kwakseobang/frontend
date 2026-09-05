import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // No DOM: everything in this package must run under React Native too, so a test
    // that needs a browser global belongs in the platform package, not here.
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});
