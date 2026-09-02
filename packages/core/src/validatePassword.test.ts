import { describe, expect, it } from "vitest";
import { PASSWORD_RULE_HINT, validatePassword } from "./validatePassword";

describe("validatePassword", () => {
  it("accepts a password meeting both rules", () => {
    expect(validatePassword("hunter2!x")).toBeNull();
  });

  it("rejects anything shorter than 8 characters", () => {
    expect(validatePassword("ab!1")).toMatch(/8자/);
  });

  it("rejects a long password with no special character", () => {
    expect(validatePassword("abcdefgh1")).toMatch(/특수문자/);
  });

  it("counts a non-alphanumeric character as special", () => {
    expect(validatePassword("abcdefg_")).toBeNull();
    expect(validatePassword("abcdefg한")).toBeNull();
  });

  it("keeps the hint in sync with the rule it describes", () => {
    expect(PASSWORD_RULE_HINT).toBe("8자 이상, 특수문자 포함");
  });
});
