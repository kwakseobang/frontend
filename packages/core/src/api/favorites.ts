import { request } from "./client";
import type { MemoryListItem, PageResponse } from "../types/api";

export function addFavorite(memoryId: number | string) {
  return request<void>(`/api/memories/${memoryId}/favorites`, { method: "POST" });
}

export function removeFavorite(memoryId: number | string) {
  return request<void>(`/api/memories/${memoryId}/favorites`, { method: "DELETE" });
}

export function getFavorites(page: number, size: number) {
  return request<PageResponse<MemoryListItem>>("/api/memories/favorites", { query: { page, size } });
}
