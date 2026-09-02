"use client";

import type { Visibility } from "@/lib/core";
import type { KeyboardEvent } from "react";

import styles from "./VisibilityChip.module.css";

interface VisibilityChipProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
}

export function VisibilityChip({ value, onChange }: VisibilityChipProps) {
  const handleKeyDown = (target: Visibility) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(target);
    }
  };

  return (
    <div className={styles.row} role="radiogroup" aria-label="공개 범위">
      <div
        className={[styles.chip, value === "PRIVATE" ? styles.active : ""].join(" ")}
        role="radio"
        aria-checked={value === "PRIVATE"}
        tabIndex={0}
        onClick={() => onChange("PRIVATE")}
        onKeyDown={handleKeyDown("PRIVATE")}
      >
        나만 보기
      </div>
      <div
        className={[styles.chip, value === "PUBLIC" ? styles.active : ""].join(" ")}
        role="radio"
        aria-checked={value === "PUBLIC"}
        tabIndex={0}
        onClick={() => onChange("PUBLIC")}
        onKeyDown={handleKeyDown("PUBLIC")}
      >
        공개
      </div>
    </div>
  );
}
