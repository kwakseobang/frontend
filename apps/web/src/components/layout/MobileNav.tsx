"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileNav.module.css";

export function MobileNav() {
  const pathname = usePathname();
  const isHome = pathname === "/home";
  const isFavorites = pathname.startsWith("/favorites");
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
      <Link href="/favorites" className={[styles.item, isFavorites ? styles.active : ""].join(" ")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span className={styles.label}>즐겨찾기</span>
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
