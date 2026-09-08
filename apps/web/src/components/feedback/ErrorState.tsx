"use client";

import { PillButton } from "@/components/form/PillButton";
import { toErrorMessage } from "@/lib/core";
import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  error: unknown;
  /** Shown when the error carries no message of its own. */
  fallback?: string;
  /** Omit for an error with no sensible retry (e.g. a 404 — retrying would just 404 again). */
  onRetry?: () => void;
}

/**
 * The counterpart to LoadingState: once the retries in QueryProvider are spent, the
 * screen says so and offers a way out, instead of settling into a blank body that the
 * user can only escape by force-quitting the app.
 */
export function ErrorState({ error, fallback = "불러오지 못했습니다", onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.title}>{fallback}</div>
      <div className={styles.detail}>{toErrorMessage(error, "잠시 후 다시 시도해주세요")}</div>
      {onRetry && (
        <PillButton variant="large" onClick={onRetry}>
          다시 시도
        </PillButton>
      )}
    </div>
  );
}
