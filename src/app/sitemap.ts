import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Individual /entry/[id] memory pages are share-link-only by design (see
// ../memento/docs/api.md) — never listed publicly, so they're intentionally
// excluded here rather than crawled/discovered.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
