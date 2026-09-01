"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./MobileTopBar.module.css";

export function MobileTopBar() {
  return (
    <div className={styles.bar}>
      <Link href="/home" className={styles.logo}>
        <span className={styles.logoDot} />
        <span className={styles.logoText}>Memento</span>
      </Link>
      <ThemeToggle />
    </div>
  );
}
