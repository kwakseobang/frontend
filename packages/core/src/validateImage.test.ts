import { describe, expect, it } from "vitest";
import { IMAGE_ACCEPT, validateImage } from "./validateImage";

describe("validateImage", () => {
  it("accepts each supported image type", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(validateImage({ type, size: 1024 })).toBeNull();
    }
  });

  it("rejects a non-image file", () => {
    expect(validateImage({ type: "text/plain", size: 1024 })).toMatch(/이미지만/);
  });

  it("rejects an image type the backend does not take", () => {
    expect(validateImage({ type: "image/heic", size: 1024 })).toMatch(/이미지만/);
  });

  it("rejects a file over 15MB", () => {
    expect(validateImage({ type: "image/jpeg", size: 15 * 1024 * 1024 + 1 })).toMatch(/15MB/);
  });

  it("accepts a file exactly at the 15MB limit", () => {
    expect(validateImage({ type: "image/jpeg", size: 15 * 1024 * 1024 })).toBeNull();
  });

  // React Native's image picker does not always report a size (Android in particular).
  // Rejecting on a missing size would block valid photos; the backend enforces the cap.
  it("accepts a candidate whose size is unknown", () => {
    expect(validateImage({ type: "image/jpeg" })).toBeNull();
  });
});

describe("IMAGE_ACCEPT", () => {
  // The picker must offer exactly what validateImage will let through.
  it("lists the same types the validator accepts", () => {
    expect(IMAGE_ACCEPT).toBe("image/jpeg,image/png,image/webp,image/gif");
    for (const type of IMAGE_ACCEPT.split(",")) {
      expect(validateImage({ type, size: 1024 })).toBeNull();
    }
  });
});
