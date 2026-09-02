const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/**
 * Value for a file input's `accept`. Keeping it in sync with ALLOWED_TYPES means the
 * OS picker greys out files we would only reject afterwards — the old `image/*` let
 * users select e.g. a HEIC or BMP and only told them it was wrong after the fact.
 */
export const IMAGE_ACCEPT = ALLOWED_TYPES.join(",");

/**
 * UX-only defense-in-depth — rejects obviously-wrong files before upload so the
 * user gets immediate feedback instead of a round-trip error. The backend must
 * independently validate type/size regardless; this is not a security boundary.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "jpg, png, webp, gif 형식의 이미지만 업로드할 수 있어요.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "이미지 용량은 15MB를 넘을 수 없어요.";
  }
  return null;
}
