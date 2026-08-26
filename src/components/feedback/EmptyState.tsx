"use client";

import { PillButton } from "@/components/form/PillButton";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({ title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.silhouette} />
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
      <PillButton variant="large" onClick={onCta}>
        {ctaLabel}
      </PillButton>
    </div>
  );
}
