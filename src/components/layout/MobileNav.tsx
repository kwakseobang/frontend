"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileNav.module.css";

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/home";
  const isProfile = pathname.startsWith("/profile");

  return (
    <nav className={styles.nav}>
      <Link href="/home" className={[styles.item, isHome ? styles.active : ""].join(" ")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
        <span className={styles.label}>홈</span>
      </Link>
      <Link href="/write" className={styles.newButton}>
        <span className={styles.newDot}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-brand)" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <span className={styles.label}>기록</span>
      </Link>
      <Link href="/profile" className={[styles.item, isProfile ? styles.active : ""].join(" ")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className={styles.label}>마이</span>
      </Link>
    </nav>
  );
}
