import { ApiError } from "./api/client";

/**
 * Every mutation in the app shows "the backend's message if it sent one, otherwise a
 * screen-specific fallback". Keeping that in one place means a change to how backend
 * errors surface (see formatErrorData in lib/api/client.ts) lands everywhere at once.
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
