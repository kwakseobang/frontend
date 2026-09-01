"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import styles from "./layout.module.css";

// Unlike the (app) group, this route stays reachable while logged out — the backend
// allows anonymous GET on PUBLIC memories so a copied link works for anyone, not just
// other members. No auth redirect here; MemoryDetail itself hides owner-only actions.
export default function EntryLayout({ children }: { children: React.ReactNode }) {
  const { isHydrated, isAuthenticated } = useAuth();

  if (!isHydrated) return null;

  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <Link href={isAuthenticated ? "/home" : "/"} className={styles.logo}>
          <div className={styles.logoDot} />
          <div className={styles.logoText}>Memento</div>
        </Link>
        <div className={styles.navGroup}>
          <ThemeToggle />
          <Link href={isAuthenticated ? "/home" : "/login"} className={styles.navLink}>
            {isAuthenticated ? "홈으로" : "로그인"}
          </Link>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
