import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import { toErrorMessage } from "./errors";

describe("toErrorMessage", () => {
  it("prefers the backend's message", () => {
    expect(toErrorMessage(new ApiError(400, "닉네임이 중복됩니다"), "기본 메시지")).toBe("닉네임이 중복됩니다");
  });

  it("falls back for a plain Error, whose message is not user-facing", () => {
    expect(toErrorMessage(new Error("TypeError: fetch failed"), "기본 메시지")).toBe("기본 메시지");
  });

  it("falls back for a non-Error throw", () => {
    expect(toErrorMessage("boom", "기본 메시지")).toBe("기본 메시지");
    expect(toErrorMessage(undefined, "기본 메시지")).toBe("기본 메시지");
  });
});
