"use client";

import {
  ApiError,
  authApi,
  clearTokens,
  hasTokensSnapshot,
  membersApi,
  setTokens,
  subscribeToTokens,
} from "@/lib/core";
import type { Member } from "@/lib/core";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const ME_QUERY_KEY = ["member", "me"];

interface AuthState {
  member: Member | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  signup: (loginId: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMember: (member: Member) => void;
}

const AuthContext = createContext<AuthState | null>(null);

// Server render has no localStorage, so it always reports "not hydrated, not logged in";
// the client store takes over on the first commit. Reading this through
// useSyncExternalStore rather than useEffect+setState keeps the boot to a single render
// pass and lets a logout in another tab propagate here (see subscribeToTokens).
const neverChanges = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isHydrated = useSyncExternalStore(neverChanges, alwaysTrue, alwaysFalse);
  const hasTokens = useSyncExternalStore(subscribeToTokens, hasTokensSnapshot, alwaysFalse);

  // A failed fetch here (network error, backend 5xx, etc.) must not log the
  // user out — only client.ts's 401-after-failed-reissue path may do that.
  // A genuine 401 that reaches this query has already gone through that path
  // (tokens cleared, redirected to /login), so retrying it is pointless.
  const { data: member } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: membersApi.getMe,
    enabled: hasTokens,
    retry: (failureCount, err) => (err instanceof ApiError && err.status === 401 ? false : failureCount < 2),
  });

  const login = useCallback(
    async (loginId: string, password: string) => {
      const tokens = await authApi.login({ loginId, password });
      // Verified before persisting: storing first would flip isAuthenticated (and
      // trigger the guest-only redirect) while the profile fetch is still in flight,
      // and a failure would then have to be undone mid-navigation.
      const me = await membersApi.getMeWithToken(tokens.accessToken);
      queryClient.setQueryData(ME_QUERY_KEY, me);
      setTokens(tokens);
    },
    [queryClient],
  );

  const signup = useCallback(
    async (loginId: string, password: string, nickname: string) => {
      await authApi.signup({ loginId, password, nickname });
      await login(loginId, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Server-side logout can fail (e.g. already-expired token); local session
      // is cleared regardless so the user always ends up logged out client-side.
    } finally {
      clearTokens();
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    }
  }, [queryClient]);

  const refreshMember = useCallback(
    (next: Member) => queryClient.setQueryData(ME_QUERY_KEY, next),
    [queryClient],
  );

  return (
    <AuthContext.Provider
      value={{ member: member ?? null, isHydrated, isAuthenticated: hasTokens, login, signup, logout, refreshMember }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
