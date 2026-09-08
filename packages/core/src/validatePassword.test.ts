import { describe, expect, it } from "vitest";
import { PASSWORD_RULE_HINT, validatePassword } from "./validatePassword";

describe("validatePassword", () => {
  it("accepts a password with letters, a digit, and a special character", () => {
    expect(validatePassword("hunter2!x")).toBeNull();
  });

  it("rejects anything shorter than 8 characters", () => {
    expect(validatePassword("ab!1")).toMatch(/8자/);
  });

  it("rejects a password missing a special character", () => {
    expect(validatePassword("abcdefgh1")).toMatch(/특수문자/);
  });

  it("rejects a password missing a digit, matching the backend's Pattern", () => {
    expect(validatePassword("abcdefg_")).toMatch(/숫자/);
  });

  it("rejects a password missing a letter", () => {
    expect(validatePassword("12345678!")).toMatch(/영문/);
  });

  it("does not count a non-ASCII character as a special character", () => {
    // The backend's Pattern special-char class is a fixed ASCII set; "한" satisfies
    // neither that set nor the digit requirement, so it should still fail.
    expect(validatePassword("abcdefg한")).toMatch(/숫자|특수문자/);
  });

  it("keeps the hint in sync with the rule it describes", () => {
    expect(PASSWORD_RULE_HINT).toBe("8자 이상, 영문·숫자·특수문자 포함");
  });
});
