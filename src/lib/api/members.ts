import { request } from "./client";
import type { Member } from "@/types/api";

// Deliberately not an optional parameter on getMe: it is passed directly as a React
// Query queryFn, which would call it with a QueryFunctionContext as the first argument.
export function getMe() {
  return request<Member>("/api/members/profile");
}

/** Used only by the login flow, to verify a freshly issued token before storing it. */
export function getMeWithToken(accessToken: string) {
  return request<Member>("/api/members/profile", { accessToken });
}

export function updateMe(input: { nickname: string; bio: string }) {
  return request<void>("/api/members/profile", { method: "PATCH", json: input });
}

export function updateMyProfileImage(image: File) {
  const form = new FormData();
  form.append("image", image);
  return request<void>("/api/members/profile-image", { method: "PATCH", form });
}
