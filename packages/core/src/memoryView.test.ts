import { describe, expect, it } from "vitest";
import { toCardMemory, toDetailMemory, todayIso } from "./memoryView";
import type { MemoryDetail, MemoryListItem } from "./types/api";

const listItem: MemoryListItem = {
  id: 7,
  content: "여름 저녁",
  memoryAt: "2026-08-18T15:12",
  visibility: "PUBLIC",
  thumbnailUrl: "https://storage.googleapis.com/bucket/media/a.jpg",
};

describe("toCardMemory", () => {
  it("maps the API item onto the view model", () => {
    expect(toCardMemory(listItem)).toEqual({
      id: 7,
      time: "2026-08-18T15:12",
      text: "여름 저녁",
      images: ["https://storage.googleapis.com/bucket/media/a.jpg"],
      visibility: "PUBLIC",
    });
  });

  // next/image needs a bare URL; these used to be pre-wrapped CSS `url(...)` strings.
  it("keeps the thumbnail as a raw URL", () => {
    expect(toCardMemory(listItem).images[0]).not.toContain("url(");
  });

  it("treats a missing thumbnail as no images", () => {
    expect(toCardMemory({ ...listItem, thumbnailUrl: null }).images).toEqual([]);
  });

  it("normalizes null content to an empty string", () => {
    expect(toCardMemory({ ...listItem, content: null }).text).toBe("");
  });
});

describe("toDetailMemory", () => {
  const detail: MemoryDetail = {
    id: 7,
    content: null,
    memoryAt: "2026-08-18T15:12",
    visibility: "PRIVATE",
    imageUrls: ["https://storage.googleapis.com/bucket/media/a.jpg", "https://storage.googleapis.com/bucket/media/b.jpg"],
    isOwner: true,
    isDraft: false,
  };

  it("passes every image URL through untouched", () => {
    expect(toDetailMemory(detail).images).toEqual(detail.imageUrls);
  });

  it("normalizes null content to an empty string", () => {
    expect(toDetailMemory(detail).text).toBe("");
  });
});

describe("todayIso", () => {
  it("produces a zero-padded YYYY-MM-DD in local time", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
