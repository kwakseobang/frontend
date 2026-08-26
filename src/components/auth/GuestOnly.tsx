"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace("/home");
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) return null;
  return <>{children}</>;
}
