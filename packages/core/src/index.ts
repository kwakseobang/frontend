/**
 * Everything in this package must run unchanged on the web and in React Native, so
 * nothing here may touch the DOM, `window`, `localStorage`, `process.env`, or Next.
 * Anything platform-specific goes through the adapters in ./config.
 */

export { configureCore, getCoreConfig } from "./config";
export type { CoreConfig, FileRef, FormDataAdapter, TokenPersistence, UploadFile } from "./config";

export {
  clearTokens,
  getTokens,
  hasTokensSnapshot,
  hydrateTokens,
  isTokenStoreHydrated,
  resetTokenStoreForTests,
  setTokens,
  subscribeToTokens,
  syncTokensFromPersistence,
} from "./auth/tokenStore";

export { ApiError, NetworkError, isRetryableError, request } from "./api/client";
export * as authApi from "./api/auth";
export * as favoritesApi from "./api/favorites";
export * as membersApi from "./api/members";
export * as memoriesApi from "./api/memories";
export type { MemoryDraftInput, MemoryWriteInput } from "./api/memories";

export type {
  AuthTokens,
  Member,
  MemoryDetail as ApiMemoryDetail,
  MemoryListItem,
  MemoryStatistics,
  PageResponse,
  Visibility,
} from "./types/api";
export type { Memory } from "./types/memory";

export { MAX_IMAGES_PER_MEMORY, PAGE_SIZE } from "./constants";
export { toErrorMessage } from "./errors";
export { toCardMemory, toDetailMemory, todayIso } from "./memoryView";
export { resolveImagesForSave } from "./memoryImages";
export type { ImageSlot } from "./memoryImages";
export { IMAGE_ACCEPT, validateImage } from "./validateImage";
export type { ImageCandidate } from "./validateImage";
export { PASSWORD_RULE_HINT, validatePassword } from "./validatePassword";
export {
  buildCalendarCells,
  dateOf,
  formatDayLabel,
  formatFull,
  formatStamp,
  formatTime,
  isValidDateTime,
  WEEKDAYS,
} from "./date";
export type { CalendarCell } from "./date";
