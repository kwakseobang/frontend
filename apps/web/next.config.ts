import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// The API lives on a separate origin (Spring Boot), so connect-src has to name it
// explicitly — otherwise every fetch from lib/api/* is blocked by CSP.
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").origin;
  } catch {
    return "http://localhost:8080";
  }
}

/**
 * script-src keeps 'unsafe-inline' deliberately: Next streams the RSC payload through
 * inline <script> tags and the root layout runs a pre-hydration theme script, both of
 * which would need a per-request nonce. Serving a nonce means reading headers() in the
 * root layout, which opts every route out of static generation — too high a price for
 * an app whose only HTML sink is a fixed literal (no user content is ever injected as
 * markup). The rest of the policy still shuts the doors that matter: no third-party
 * script hosts, no framing, no <base> or form-action hijacking, no plugins.
 */
function contentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes (card rotation, badge colors) are used throughout.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://storage.googleapis.com",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin()}${isDev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  // Only when the API is already on https — otherwise this would rewrite the very
  // API calls connect-src just allowed (e.g. `next start` against a local backend).
  if (!isDev && apiOrigin().startsWith("https://")) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // No route uses these; denying them keeps an injected script from prompting the user.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Only meaningful over HTTPS, and preload requires the apex domain to opt in — so it
  // stays off here and is set at the CDN/domain level when the site actually ships.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // @memento/core is shipped as TypeScript source (no build step) and shared with the
  // React Native app, so Next has to compile it rather than expect prebuilt JS.
  transpilePackages: ["@memento/core"],
  // Drops the "X-Powered-By: Next.js" response header — free version disclosure otherwise.
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "storage.googleapis.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
