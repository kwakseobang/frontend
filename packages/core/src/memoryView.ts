import type { Memory } from "./types/memory";
import type { MemoryDetail as ApiMemoryDetail, MemoryListItem } from "./types/api";

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toCardMemory(item: MemoryListItem): Memory {
  return {
    id: item.id,
    time: item.memoryAt,
    text: item.content ?? "",
    images: item.thumbnailUrl ? [item.thumbnailUrl] : [],
    visibility: item.visibility,
  };
}

export function toDetailMemory(item: ApiMemoryDetail): Memory {
  return {
    id: item.id,
    time: item.memoryAt,
    text: item.content ?? "",
    images: item.imageUrls,
    visibility: item.visibility,
  };
}
