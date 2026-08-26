import { request } from "./client";
import type { Member } from "@/types/api";

export function getMe() {
  return request<Member>("/api/v1/members/profile");
}

export function updateMe(input: { nickname: string; bio: string }) {
  return request<void>("/api/v1/members/profile", { method: "PATCH", json: input });
}

export function updateMyProfileImage(image: File) {
  const form = new FormData();
  form.append("image", image);
  return request<void>("/api/v1/members/profile-image", { method: "PATCH", form });
}
