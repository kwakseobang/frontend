"use client";

import type { Memory } from "@/types/memory";
import { formatFull } from "@/lib/date";
import styles from "./MemoryDetail.module.css";

interface MemoryDetailProps {
  memory: Memory;
  isOwner: boolean;
  backLabel: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MemoryDetail({ memory, isOwner, backLabel, onBack, onEdit, onDelete }: MemoryDetailProps) {
  const isPublic = memory.visibility === "PUBLIC";
  const badgeStyle = isPublic
    ? { color: "var(--color-public-text)", background: "var(--color-public-bg)" }
    : { color: "var(--color-text-secondary)", background: "rgba(143,135,120,.12)" };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <button className={styles.backLink} onClick={onBack}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </button>
        {isOwner && (
          <div className={styles.actions}>
            <button className={styles.iconButton} onClick={onEdit} aria-label="수정">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
            <button className={[styles.iconButton, styles.danger].join(" ")} onClick={onDelete} aria-label="삭제">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {memory.images.length > 0 && (
        <div className={[styles.filmstrip, "filmstrip"].join(" ")}>
          {memory.images.map((img, i) => (
            <div key={i} className={styles.filmstripImage} style={{ background: img }} />
          ))}
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.text}>{memory.text}</div>
        <div className={styles.footer}>
          <span className={styles.time}>{formatFull(memory.time)}</span>
          <span className={styles.badge} style={badgeStyle}>
            {isPublic ? "공개" : "비공개"}
          </span>
        </div>
      </div>
    </div>
  );
}
