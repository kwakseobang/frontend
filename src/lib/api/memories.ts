import { request } from "./client";
import type { MemoryDetail, MemoryListItem, PageResponse, Visibility } from "@/types/api";

export function getTimeline(page: number, size: number) {
  return request<PageResponse<MemoryListItem>>("/api/v1/memories", { query: { page, size } });
}

export function getMemoriesByDate(date: string) {
  return request<MemoryListItem[]>("/api/v1/memories/date", { query: { date } });
}

export function getMemoryDatesForMonth(year: number, month: number) {
  return request<string[]>("/api/v1/memories/dates", { query: { year, month } });
}

export function getMemory(id: number | string) {
  return request<MemoryDetail>(`/api/v1/memories/${id}`);
}

export function deleteMemory(id: number | string) {
  return request<void>(`/api/v1/memories/${id}`, { method: "DELETE" });
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
  return request<number>("/api/v1/memories", { method: "POST", form: toMemoryForm(input) });
}

export function updateMemory(id: number | string, input: MemoryWriteInput) {
  return request<void>(`/api/v1/memories/${id}`, { method: "PATCH", form: toMemoryForm(input) });
}
