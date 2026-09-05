import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * `localhost` means the phone itself, not the Mac running the backend, so a device or
 * simulator needs a reachable host: the Mac's LAN IP, or 10.0.2.2 from the Android
 * emulator. Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env.local.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const usesCleartext = API_BASE_URL.startsWith("http://");

/** Plugins this file configures with options, and so must not also inherit bare from app.json. */
const CONFIGURED_HERE = ["expo-splash-screen"];

/**
 * `npx expo install` maintains the plugin list in app.json for us, so this extends that
 * config rather than replacing it — returning a standalone object silently dropped the
 * plugins the CLI had added (expo-image, datetimepicker, …).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Memento",
  slug: "memento",
  version: "0.1.0",
  orientation: "portrait",
  // Deep links: memento://entry/3. Universal/App Links come later (Phase 5).
  scheme: "memento",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.kwakseobang.memento",
    infoPlist: {
      // Photo attachment is the point of the app; iOS rejects the build without a reason string.
      NSPhotoLibraryUsageDescription: "기록에 첨부할 사진을 선택하기 위해 사진 라이브러리에 접근합니다.",
      // Talking to a local backend over plain HTTP. NSAllowsLocalNetworking keeps ATS on
      // for the public internet and only exempts the LAN, unlike NSAllowsArbitraryLoads.
      ...(usesCleartext ? { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } : {}),
    },
  },
  android: {
    package: "com.kwakseobang.memento",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0a0908",
    },
    permissions: ["READ_MEDIA_IMAGES"],
  },
  plugins: [
    ...(config.plugins ?? []).filter(
      (plugin) => !(typeof plugin === "string" && CONFIGURED_HERE.includes(plugin)),
    ),
    ["expo-splash-screen", { image: "./assets/icon.png", resizeMode: "contain", backgroundColor: "#0a0908" }],
    // Android blocks plain HTTP by default. Same reason as NSAllowsLocalNetworking
    // above, and likewise only while the API is on http — a release build against an
    // https backend gets neither exemption.
    ["expo-build-properties", { android: { usesCleartextTraffic: usesCleartext } }],
  ],
  experiments: {
    typedRoutes: true,
  },
});
