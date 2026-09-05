import type { AuthTokens } from "./types/api";

/**
 * A file to upload. The web has `File` (a `Blob`); React Native has no such thing and
 * hands `FormData` a `{ uri, name, type }` descriptor instead. Everything in this
 * package stays on this union and lets the platform adapter do the appending.
 */
export interface FileRef {
  uri: string;
  name: string;
  type: string;
}
export type UploadFile = Blob | FileRef;

export interface TokenPersistence {
  /**
   * Only implemented by stores that can be read synchronously (the web's localStorage).
   * When present, boot completes without even a microtask, so the first render already
   * knows whether there is a session — no logged-out flash, no double render pass.
   * React Native's SecureStore is async-only and leaves this undefined.
   */
  loadSync?(): AuthTokens | null;
  load(): Promise<AuthTokens | null>;
  save(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

export interface FormDataAdapter {
  /**
   * The JSON part of a multipart request. The backend's `@RequestPart` requires that
   * part to carry `Content-Type: application/json`, and producing a part with an
   * explicit content type is exactly what differs between platforms: the web wraps the
   * JSON in a typed `Blob`, React Native has to write it to a file first because its
   * `FormData` only sets a per-part content type for file parts.
   */
  appendJsonPart(form: FormData, name: string, value: unknown): Promise<void>;
  appendFilePart(form: FormData, name: string, file: UploadFile): void;
  /**
   * Re-fetches an already-uploaded image into something uploadable again. Editing a
   * memory has to resend every kept image (see resolveImagesForSave), and "download it
   * back" is a fetch+Blob on the web but a filesystem download in React Native.
   */
  fetchRemoteAsUpload(url: string): Promise<UploadFile>;
}

export interface CoreConfig {
  /** Origin of the Spring backend, no trailing slash. */
  baseUrl: string;
  tokenPersistence: TokenPersistence;
  /**
   * Called once a 401 could not be recovered by reissuing. Tokens are already cleared
   * by then; the host decides where "logged out" goes (a hard navigation on the web,
   * a router.replace in the app).
   */
  onSessionExpired: () => void;
  formData: FormDataAdapter;
}

let config: CoreConfig | null = null;

/** Must run before anything in this package touches the network or the session. */
export function configureCore(next: CoreConfig): void {
  config = next;
}

export function getCoreConfig(): CoreConfig {
  if (!config) {
    throw new Error("configureCore() must be called before using @memento/core.");
  }
  return config;
}
