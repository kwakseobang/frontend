"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useAuth } from "@/lib/auth/AuthContext";
import styles from "./layout.module.css";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace("/login");
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isAuthenticated) return null;

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.contentOuter}>
        <div className={styles.contentInner}>{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
