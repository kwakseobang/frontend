import { describe, expect, it } from "vitest";
import { IMAGE_ACCEPT, validateImageFile } from "./validateImageFile";

function fileOfSize(bytes: number, type: string): File {
  const file = new File(["x"], "photo", { type });
  // File size is read-only, so stub it rather than allocating 15MB in the test run.
  Object.defineProperty(file, "size", { value: bytes });
  return file;
}

describe("validateImageFile", () => {
  it("accepts each supported image type", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(validateImageFile(fileOfSize(1024, type))).toBeNull();
    }
  });

  it("rejects a non-image file", () => {
    expect(validateImageFile(fileOfSize(1024, "text/plain"))).toMatch(/이미지만/);
  });

  it("rejects an image type the backend does not take", () => {
    expect(validateImageFile(fileOfSize(1024, "image/heic"))).toMatch(/이미지만/);
  });

  it("rejects a file over 15MB", () => {
    expect(validateImageFile(fileOfSize(15 * 1024 * 1024 + 1, "image/jpeg"))).toMatch(/15MB/);
  });

  it("accepts a file exactly at the 15MB limit", () => {
    expect(validateImageFile(fileOfSize(15 * 1024 * 1024, "image/jpeg"))).toBeNull();
  });
});

describe("IMAGE_ACCEPT", () => {
  // The picker must offer exactly what validateImageFile will let through.
  it("lists the same types the validator accepts", () => {
    expect(IMAGE_ACCEPT).toBe("image/jpeg,image/png,image/webp,image/gif");
    for (const type of IMAGE_ACCEPT.split(",")) {
      expect(validateImageFile(fileOfSize(1024, type))).toBeNull();
    }
  });
});
