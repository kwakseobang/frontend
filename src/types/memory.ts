export type Visibility = "PUBLIC" | "PRIVATE";

/** Presentational view-model consumed by MemoryCard/MemoryDetail/CalendarPanel/MemoryGrid; see lib/memoryView.ts for API→view mapping. */
export interface Memory {
  id: number;
  /** memoryAt, ISO-ish local datetime without timezone, e.g. "2026-08-18T15:12" */
  time: string;
  text: string;
  /** Raw image URLs (GCS-hosted) — rendered via next/image, see MemoryCard/MemoryDetail. */
  images: string[];
  visibility: Visibility;
}
