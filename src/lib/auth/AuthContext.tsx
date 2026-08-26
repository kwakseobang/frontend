"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "@/lib/api/auth";
import * as membersApi from "@/lib/api/members";
import { clearTokens, getTokens, setTokens } from "@/lib/auth/tokenStorage";
import type { Member } from "@/types/api";

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
  const [member, setMember] = useState<Member | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = getTokens();
      if (!tokens) return;
      try {
        const me = await membersApi.getMe();
        if (!cancelled) setMember(me);
      } catch {
        clearTokens();
      }
    })().finally(() => {
      if (!cancelled) setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    const tokens = await authApi.login({ loginId, password });
    setTokens(tokens);
    try {
      const me = await membersApi.getMe();
      setMember(me);
    } catch (err) {
      // Roll back so a reload doesn't silently authenticate with tokens whose
      // profile fetch we already reported as a login failure.
      clearTokens();
      throw err;
    }
  }, []);

  const signup = useCallback(async (loginId: string, password: string, nickname: string) => {
    await authApi.signup({ loginId, password, nickname });
    await login(loginId, password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Server-side logout can fail (e.g. already-expired token); local session
      // is cleared regardless so the user always ends up logged out client-side.
    } finally {
      clearTokens();
      setMember(null);
    }
  }, []);

  const refreshMember = useCallback((next: Member) => setMember(next), []);

  return (
    <AuthContext.Provider
      value={{ member, isHydrated, isAuthenticated: member !== null, login, signup, logout, refreshMember }}
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
