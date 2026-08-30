"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/lib/api/auth";
import * as membersApi from "@/lib/api/members";
import { ApiError } from "@/lib/api/client";
import { clearTokens, getTokens, setTokens } from "@/lib/auth/tokenStorage";
import type { Member } from "@/types/api";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasTokens, setHasTokens] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setHasTokens(getTokens() !== null);
    setIsHydrated(true);
  }, []);

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
      setTokens(tokens);
      try {
        const me = await membersApi.getMe();
        queryClient.setQueryData(ME_QUERY_KEY, me);
        setHasTokens(true);
      } catch (err) {
        // Roll back so a reload doesn't silently authenticate with tokens whose
        // profile fetch we already reported as a login failure.
        clearTokens();
        throw err;
      }
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
      setHasTokens(false);
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
