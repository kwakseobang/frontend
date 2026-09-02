import * as SecureStore from "expo-secure-store";
import { secureStorePersistence } from "./secureStorePersistence";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

const getItemAsync = SecureStore.getItemAsync as jest.Mock;
const setItemAsync = SecureStore.setItemAsync as jest.Mock;
const deleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

function storedAs(values: Record<string, string | null>) {
  getItemAsync.mockImplementation(async (key: string) => values[key] ?? null);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("load", () => {
  it("returns the stored pair", async () => {
    storedAs({ "memento.accessToken": "access-1", "memento.refreshToken": "refresh-1" });

    await expect(secureStorePersistence.load()).resolves.toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
  });

  it("returns null when nothing is stored", async () => {
    storedAs({});
    await expect(secureStorePersistence.load()).resolves.toBeNull();
  });

  // Without the refresh token there is nothing to reissue against, so reporting a
  // session here would send every request out with a token that can only 401.
  it("returns null when only the access token survived", async () => {
    storedAs({ "memento.accessToken": "access-1" });
    await expect(secureStorePersistence.load()).resolves.toBeNull();
  });

  it("returns null when only the refresh token survived", async () => {
    storedAs({ "memento.refreshToken": "refresh-1" });
    await expect(secureStorePersistence.load()).resolves.toBeNull();
  });
});

describe("save", () => {
  it("writes both halves of the session", async () => {
    await secureStorePersistence.save({ accessToken: "access-2", refreshToken: "refresh-2" });

    expect(setItemAsync).toHaveBeenCalledWith("memento.accessToken", "access-2");
    expect(setItemAsync).toHaveBeenCalledWith("memento.refreshToken", "refresh-2");
  });
});

describe("clear", () => {
  it("removes both halves", async () => {
    await secureStorePersistence.clear();

    expect(deleteItemAsync).toHaveBeenCalledWith("memento.accessToken");
    expect(deleteItemAsync).toHaveBeenCalledWith("memento.refreshToken");
  });
});
