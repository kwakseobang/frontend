import { request } from "./client";
import type { AuthTokens } from "@/types/api";

export function signup(input: { loginId: string; password: string; nickname: string }) {
  return request<void>("/api/members/signup", { method: "POST", json: input, auth: false });
}

export function login(input: { loginId: string; password: string }) {
  return request<AuthTokens>("/api/auth/login", { method: "POST", json: input, auth: false });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}
