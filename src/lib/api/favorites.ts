import { request } from "./client";
import { PAGE_SIZE } from "@/lib/constants";
import type { MemoryListItem, PageResponse } from "@/types/api";

export function addFavorite(memoryId: number | string) {
  return request<void>(`/api/memories/${memoryId}/favorites`, { method: "POST" });
}

export function removeFavorite(memoryId: number | string) {
  return request<void>(`/api/memories/${memoryId}/favorites`, { method: "DELETE" });
}

export function getFavorites(page: number, size: number) {
  return request<PageResponse<MemoryListItem>>("/api/memories/favorites", { query: { page, size } });
}

// A backend that always reports hasNext:true would otherwise spin this loop forever and
// hang the detail screen. 100 pages is far past any realistic favorites list.
const MAX_PAGES = 100;

/**
 * The detail/list APIs don't expose whether a memory is favorited, so the only way to know
 * is to check membership in the favorites list itself. Favorites are a personal, hand-picked
 * subset (not the full memory history), so walking every page to build the id set is cheap
 * in practice and keeps the heart toggle correct instead of only reflecting page 1.
 */
export async function getAllFavoriteIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getFavorites(page, PAGE_SIZE);
    for (const item of res.contents) ids.add(item.id);
    if (!res.hasNext) break;
  }
  return ids;
}
