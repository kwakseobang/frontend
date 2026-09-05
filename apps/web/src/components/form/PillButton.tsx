"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./PillButton.module.css";

type Variant = "primary" | "compact" | "large" | "outline";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function PillButton({ variant = "primary", className, ...rest }: PillButtonProps) {
  const cls = [styles.primary, variant !== "primary" ? styles[variant] : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...rest} />;
}
