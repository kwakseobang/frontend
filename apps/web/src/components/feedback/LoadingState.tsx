"use client";

import styles from "./LoadingState.module.css";

interface LoadingStateProps {
  /** What is being waited on, e.g. "기록을 불러오는 중". */
  label?: string;
  /** "block" fills a screen body; "inline" sits inside a panel that already has chrome. */
  variant?: "block" | "inline";
}

/**
 * Every screen used to render `null` while its query was in flight, which on a phone
 * looked identical to a broken app — the shell painted, the body stayed empty, and
 * nothing told the user anything was happening. This is the one thing that goes there.
 */
export function LoadingState({ label = "불러오는 중", variant = "block" }: LoadingStateProps) {
  return (
    <div className={variant === "inline" ? styles.inline : styles.block} role="status" aria-live="polite">
      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
