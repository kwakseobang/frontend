export type Visibility = "PUBLIC" | "PRIVATE";

export interface PageResponse<T> {
  contents: T[];
  hasNext: boolean;
}

export interface Member {
  id: number;
  loginId: string;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
}

/** Timeline/calendar list item — content truncated to 200 chars, single thumbnail. */
export interface MemoryListItem {
  id: number;
  content: string | null;
  memoryAt: string;
  visibility: Visibility;
  thumbnailUrl: string | null;
}

/** Full detail — GET /api/memories/{id}. */
export interface MemoryDetail {
  id: number;
  content: string | null;
  memoryAt: string;
  visibility: Visibility;
  imageUrls: string[];
  isOwner: boolean;
  isDraft: boolean;
}

export interface MemoryStatistics {
  totalCount: number;
  daysTogether: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
