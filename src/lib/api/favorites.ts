import { request } from "./client";
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

const FAVORITE_ID_PAGE_SIZE = 20;

/**
 * The detail/list APIs don't expose whether a memory is favorited, so the only way to know
 * is to check membership in the favorites list itself. Favorites are a personal, hand-picked
 * subset (not the full memory history), so walking every page to build the id set is cheap
 * in practice and keeps the heart toggle correct instead of only reflecting page 1.
 */
export async function getAllFavoriteIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  let page = 1;
  while (true) {
    const res = await getFavorites(page, FAVORITE_ID_PAGE_SIZE);
    for (const item of res.contents) ids.add(item.id);
    if (!res.hasNext) break;
    page += 1;
  }
  return ids;
}
