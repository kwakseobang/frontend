import { ApiError, NetworkError } from "./api/client";

/**
 * Every mutation in the app shows "the backend's message if it sent one, otherwise a
 * screen-specific fallback". Keeping that in one place means a change to how backend
 * errors surface (see formatErrorData in lib/api/client.ts) lands everywhere at once.
 *
 * A NetworkError gets its own branch rather than the fallback: "네트워크에 연결할 수
 * 없습니다" tells the user to check their connection and try again, which a fallback
 * like "기록을 저장하지 못했습니다" does not.
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof NetworkError) return err.message;
  return fallback;
}
