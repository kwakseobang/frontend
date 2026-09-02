import { getCoreConfig, type UploadFile } from "./config";

/**
 * One image in the write form: either freshly picked on this device, or one the memory
 * already has on the server. Hosts may carry extra fields (the web keeps an object URL
 * for preview) — only these two shapes matter here.
 */
export type ImageSlot = { kind: "new"; file: UploadFile } | { kind: "existing"; url: string };

/**
 * Backend PATCH semantics: omitting `files` keeps existing media untouched, but sending any
 * `files` replaces the memory's entire media set. So when the user actually changed the image
 * set, we must resend every kept "existing" image as a re-fetched upload alongside the new
 * ones — sending only newly-added files would silently delete the ones left untouched.
 */
export async function resolveImagesForSave(
  images: ImageSlot[],
  original: ImageSlot[],
): Promise<UploadFile[] | undefined> {
  const originalUrls = original.filter((i) => i.kind === "existing").map((i) => i.url);
  const currentUrls = images.filter((i) => i.kind === "existing").map((i) => i.url);
  const hasNewFiles = images.some((i) => i.kind === "new");
  const unchanged =
    !hasNewFiles && originalUrls.length === currentUrls.length && originalUrls.every((u, i) => u === currentUrls[i]);

  if (unchanged) return undefined;

  const { fetchRemoteAsUpload } = getCoreConfig().formData;
  return Promise.all(images.map((slot) => (slot.kind === "new" ? slot.file : fetchRemoteAsUpload(slot.url))));
}
