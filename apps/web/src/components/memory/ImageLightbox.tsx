"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import styles from "./ImageLightbox.module.css";

interface ImageLightboxProps {
  images: string[];
  /** null means closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Full-screen viewer for a filmstrip image. Mirrors DeleteConfirmModal's a11y pattern
 * (focus trap, Escape, body scroll lock, focus restore) since this is the app's only
 * other full-screen overlay.
 */
export function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && hasMultiple && index !== null) {
        onNavigate((index - 1 + images.length) % images.length);
        return;
      }
      if (e.key === "ArrowRight" && hasMultiple && index !== null) {
        onNavigate((index + 1) % images.length);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, index, hasMultiple, images, onClose, onNavigate]);

  if (!open || index === null) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-label="사진 확대 보기">
        <button ref={closeRef} type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        <div className={styles.imageWrap}>
          <Image src={images[index]} alt="" fill sizes="100vw" style={{ objectFit: "contain" }} priority />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              className={[styles.navButton, styles.prevButton].join(" ")}
              onClick={() => onNavigate((index - 1 + images.length) % images.length)}
              aria-label="이전 사진"
            >
              <BackChevronIcon size={22} stroke="currentColor" />
            </button>
            <button
              type="button"
              className={[styles.navButton, styles.nextButton].join(" ")}
              onClick={() => onNavigate((index + 1) % images.length)}
              aria-label="다음 사진"
            >
              <span className={styles.mirrored}>
                <BackChevronIcon size={22} stroke="currentColor" />
              </span>
            </button>
            <div className={styles.counter}>
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
