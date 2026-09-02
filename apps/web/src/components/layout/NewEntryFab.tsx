"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NewEntryFab.module.css";

export function NewEntryFab() {
  const pathname = usePathname();
  if (pathname === "/write") return null;

  return (
    <Link href="/write" className={styles.fab} aria-label="새 기록">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </Link>
  );
}
