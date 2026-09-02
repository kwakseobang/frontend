import { describe, expect, it, vi } from "vitest";
import { clearTokens, getTokens, hasTokensSnapshot, setTokens, subscribeToTokens } from "./tokenStorage";

const tokens = { accessToken: "access-1", refreshToken: "refresh-1" };

describe("getTokens", () => {
  it("returns null when nothing is stored", () => {
    expect(getTokens()).toBeNull();
  });

  it("round-trips a stored pair", () => {
    setTokens(tokens);
    expect(getTokens()).toEqual(tokens);
  });

  // A half-written session must not read as authenticated, or every request goes out
  // with a token that cannot be reissued.
  it("returns null when only one of the two is present", () => {
    setTokens(tokens);
    localStorage.removeItem("memento:refreshToken");
    expect(getTokens()).toBeNull();
  });
});

describe("clearTokens", () => {
  it("removes both keys", () => {
    setTokens(tokens);
    clearTokens();
    expect(getTokens()).toBeNull();
  });
});

describe("hasTokensSnapshot", () => {
  it("tracks whether a full session is stored", () => {
    expect(hasTokensSnapshot()).toBe(false);
    setTokens(tokens);
    expect(hasTokensSnapshot()).toBe(true);
    clearTokens();
    expect(hasTokensSnapshot()).toBe(false);
  });
});

describe("subscribeToTokens", () => {
  it("notifies on write and on clear", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToTokens(onChange);

    setTokens(tokens);
    expect(onChange).toHaveBeenCalledTimes(1);

    clearTokens();
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    setTokens(tokens);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  // Cross-tab sync: logging out in one tab has to drop the session in the others.
  it("notifies on a storage event from another tab", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToTokens(onChange);

    window.dispatchEvent(new StorageEvent("storage", { key: "memento:accessToken" }));
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
