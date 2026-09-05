import { Directory, File, Paths } from "expo-file-system";
import type { FileRef, FormDataAdapter, UploadFile } from "@memento/core";

/** Scratch space for the JSON parts below; the OS may reclaim it at any time. */
const uploadScratch = new Directory(Paths.cache, "memento-upload");

function scratchFile(name: string): File {
  if (!uploadScratch.exists) uploadScratch.create({ intermediates: true });
  const file = new File(uploadScratch, name);
  file.create({ overwrite: true });
  return file;
}

const EXTENSION_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * A downloaded image arrives as bytes on disk with no content type attached, but the
 * multipart part needs one. The URL's extension is all there is to go on; jpeg is the
 * safe default since the backend re-validates anyway.
 */
export function guessImageType(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot === -1 ? undefined : EXTENSION_TYPES[name.slice(dot).toLowerCase()]) ?? "image/jpeg";
}

export const nativeFormDataAdapter: FormDataAdapter = {
  /**
   * ⚠️ The riskiest code in the port. The backend's @RequestPart("request") requires
   * Content-Type: application/json on this part, and React Native's FormData only
   * attaches a per-part content type to *file* parts — a Blob part loses it. So the
   * JSON is written to a real file and appended as one.
   *
   * Unverified against the real backend until the spike runs on a device (see
   * app/multipart-spike.tsx). If Spring rejects it, the fallback is to have the backend
   * also accept `request` as a plain string form field.
   */
  appendJsonPart: async (form, name, value) => {
    // Unique per call: two saves in flight must not overwrite each other's part while
    // fetch is still reading it. The scratch directory is cache, so the OS cleans up.
    const file = scratchFile(`${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    file.write(JSON.stringify(value));
    const part: FileRef = { uri: file.uri, name: `${name}.json`, type: "application/json" };
    form.append(name, part as unknown as Blob);
  },

  appendFilePart: (form, name, file) => {
    form.append(name, file as unknown as Blob);
  },

  /**
   * Editing a memory resends every kept image (see resolveImagesForSave in core), so an
   * already-uploaded image has to come back down as a local file first.
   */
  fetchRemoteAsUpload: async (url): Promise<UploadFile> => {
    const filename = url.split("/").pop()?.split("?")[0] || "image.jpg";
    const destination = scratchFile(filename);
    const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });
    return { uri: downloaded.uri, name: filename, type: guessImageType(filename) };
  },
};
