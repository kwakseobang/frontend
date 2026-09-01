import { request } from "./client";
import type { Member } from "@/types/api";

export function getMe() {
  return request<Member>("/api/members/profile");
}

export function updateMe(input: { nickname: string; bio: string }) {
  return request<void>("/api/members/profile", { method: "PATCH", json: input });
}

export function updateMyProfileImage(image: File) {
  const form = new FormData();
  form.append("image", image);
  return request<void>("/api/members/profile-image", { method: "PATCH", form });
}
