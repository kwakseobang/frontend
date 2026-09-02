import { guessImageType, nativeFormDataAdapter } from "./multipart";

const written: { uri: string; contents: string }[] = [];

jest.mock("expo-file-system", () => {
  class FakeFile {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((p) => (typeof p === "string" ? p : (p as { uri: string }).uri))
        .join("/");
    }
    create() {}
    write(contents: string) {
      written.push({ uri: this.uri, contents });
    }
    static downloadFileAsync = jest.fn(async (_url: string, destination: { uri: string }) => destination);
  }
  class FakeDirectory extends FakeFile {
    exists = true;
  }
  return {
    File: FakeFile,
    Directory: FakeDirectory,
    Paths: { cache: { uri: "file:///cache" } },
  };
});

beforeEach(() => {
  written.length = 0;
});

describe("appendJsonPart", () => {
  // The whole reason this adapter exists: RN's FormData drops the content type on Blob
  // parts, and Spring's @RequestPart("request") rejects a JSON part without it. Writing
  // the JSON to a file and appending it as a file part is what preserves the type.
  it("appends the JSON as a file part carrying application/json", async () => {
    const form = new FormData();
    const append = jest.spyOn(form, "append");

    await nativeFormDataAdapter.appendJsonPart(form, "request", { content: "안녕", visibility: "PRIVATE" });

    expect(append).toHaveBeenCalledTimes(1);
    // FormData.append is typed as taking a Blob; the whole point here is that we hand it
    // React Native's file descriptor instead, which the runtime accepts and TS does not.
    const [name, part] = append.mock.calls[0] as unknown as [
      string,
      { uri: string; name: string; type: string },
    ];
    expect(name).toBe("request");
    expect(part.type).toBe("application/json");
    expect(part.name).toBe("request.json");
    expect(part.uri).toContain("file:///cache");
  });

  it("writes the serialized payload to the file it points at", async () => {
    const form = new FormData();
    const payload = { content: "안녕", memoryAt: "2026-09-02T11:00", visibility: "PRIVATE" };

    await nativeFormDataAdapter.appendJsonPart(form, "request", payload);

    expect(written).toHaveLength(1);
    expect(JSON.parse(written[0].contents)).toEqual(payload);
  });

  // Two saves in flight must not overwrite each other's part while fetch is still
  // reading it, so the scratch filename cannot be a fixed one.
  it("uses a distinct file per call", async () => {
    const form = new FormData();
    await nativeFormDataAdapter.appendJsonPart(form, "request", { a: 1 });
    await nativeFormDataAdapter.appendJsonPart(form, "request", { a: 2 });

    expect(written[0].uri).not.toBe(written[1].uri);
  });
});

describe("guessImageType", () => {
  it("maps the extensions the backend accepts", () => {
    expect(guessImageType("photo.jpg")).toBe("image/jpeg");
    expect(guessImageType("photo.jpeg")).toBe("image/jpeg");
    expect(guessImageType("photo.png")).toBe("image/png");
    expect(guessImageType("photo.webp")).toBe("image/webp");
    expect(guessImageType("photo.gif")).toBe("image/gif");
  });

  it("is case insensitive", () => {
    expect(guessImageType("PHOTO.PNG")).toBe("image/png");
  });

  // GCS URLs do not always end in an extension; the backend re-validates either way.
  it("falls back to jpeg when the name says nothing", () => {
    expect(guessImageType("photo")).toBe("image/jpeg");
    expect(guessImageType("photo.heic")).toBe("image/jpeg");
  });
});
