import { request } from "./client";
import type { MemoryDetail, MemoryListItem, MemoryStatistics, PageResponse, Visibility } from "@/types/api";

export function getTimeline(page: number, size: number) {
  return request<PageResponse<MemoryListItem>>("/api/memories", { query: { page, size } });
}

export function getMyStatistics() {
  return request<MemoryStatistics>("/api/memories/statistics");
}

export function getMemoriesByDate(date: string) {
  return request<MemoryListItem[]>("/api/memories/date", { query: { date } });
}

export function getMemoryDatesForMonth(year: number, month: number) {
  return request<string[]>("/api/memories/dates", { query: { year, month } });
}

export function getMemory(id: number | string) {
  return request<MemoryDetail>(`/api/memories/${id}`);
}

export function deleteMemory(id: number | string) {
  return request<void>(`/api/memories/${id}`, { method: "DELETE" });
}

export interface MemoryWriteInput {
  content: string;
  memoryAt: string;
  visibility: Visibility;
  /**
   * Full ordered replacement set of images. Omit entirely (undefined) to leave the memory's
   * existing images untouched — the backend treats an absent `files` part as "no change" and
   * a present one (even empty) as "replace all existing media with this set".
   */
  images?: File[];
}

function toMemoryForm(input: MemoryWriteInput): FormData {
  const form = new FormData();
  const request = { content: input.content, memoryAt: input.memoryAt, visibility: input.visibility };
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (input.images) {
    for (const image of input.images) form.append("files", image);
  }
  return form;
}

export function createMemory(input: MemoryWriteInput) {
  return request<number>("/api/memories", { method: "POST", form: toMemoryForm(input) });
}

export function updateMemory(id: number | string, input: MemoryWriteInput) {
  return request<void>(`/api/memories/${id}`, { method: "PATCH", form: toMemoryForm(input) });
}

/** Same content/media invariant as MemoryWriteInput, but nothing is required until publish. */
export type MemoryDraftInput = MemoryWriteInput;

export function createDraft(input: MemoryDraftInput) {
  return request<number>("/api/memories/drafts", { method: "POST", form: toMemoryForm(input) });
}

export function getDrafts() {
  return request<MemoryListItem[]>("/api/memories/drafts");
}

export function publishDraft(id: number | string) {
  return request<void>(`/api/memories/${id}/publish`, { method: "PATCH" });
}
