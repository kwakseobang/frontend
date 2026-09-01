"use client";

import { useEffect, useRef, useState } from "react";
import type { Memory } from "@/types/memory";
import { formatFull } from "@/lib/date";
import { PillButton } from "@/components/form/PillButton";
import { useToast } from "@/components/toast/ToastProvider";
import styles from "./MemoryDetail.module.css";

interface MemoryDetailProps {
  memory: Memory;
  isOwner: boolean;
  backLabel: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDraft?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoritePending?: boolean;
  onPublish?: () => void;
  publishPending?: boolean;
}

export function MemoryDetail({
  memory,
  isOwner,
  backLabel,
  onBack,
  onEdit,
  onDelete,
  isDraft,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  onPublish,
  publishPending,
}: MemoryDetailProps) {
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isPublic = memory.visibility === "PUBLIC";
  // A draft is hidden from everyone but its owner regardless of visibility (the
  // backend 404s it for other viewers), so a copied link would just be dead until publish.
  const canShareLink = isPublic && !isDraft;
  const badgeStyle = isPublic
    ? { color: "var(--color-public-text)", background: "var(--color-public-bg)" }
    : { color: "var(--color-text-secondary)", background: "rgba(143,135,120,.12)" };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/entry/${memory.id}`);
      showToast("링크가 복사되었습니다");
    } catch {
      showToast("링크 복사에 실패했습니다");
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <button className={styles.backLink} onClick={onBack}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </button>
        {(isOwner || canShareLink) && (
          <div className={styles.actions}>
            {isOwner && isDraft && (
              <PillButton variant="compact" onClick={onPublish} disabled={publishPending}>
                {publishPending ? "발행 중..." : "발행하기"}
              </PillButton>
            )}
            {isOwner && (
              <button
                className={styles.iconButton}
                onClick={onToggleFavorite}
                disabled={favoritePending}
                aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                aria-pressed={isFavorite}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "var(--color-brand)" : "none"}
                  stroke={isFavorite ? "var(--color-brand)" : "var(--color-text-quaternary)"}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7z" />
                </svg>
              </button>
            )}
            {(canShareLink || (isOwner && (onEdit || onDelete))) && (
              <div className={styles.menuWrap} ref={menuRef}>
                <button
                  className={styles.iconButton}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="더보기"
                  aria-expanded={menuOpen}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-text-quaternary)">
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className={styles.menu}>
                    {canShareLink && (
                      <button className={styles.menuItem} onClick={handleCopyLink}>
                        링크 복사
                      </button>
                    )}
                    {isOwner && onEdit && (
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                      >
                        수정
                      </button>
                    )}
                    {isOwner && onDelete && (
                      <button
                        className={[styles.menuItem, styles.danger].join(" ")}
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isDraft && <div className={styles.draftBanner}>임시저장된 기록이에요. 발행하기 전까지는 나만 볼 수 있어요.</div>}

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
