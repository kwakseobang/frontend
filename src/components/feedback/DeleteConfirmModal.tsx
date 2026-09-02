"use client";

import { useEffect, useRef } from "react";
import styles from "./DeleteConfirmModal.module.css";

interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ open, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Send focus back where it came from on close, so dismissing the dialog does not
    // dump keyboard users at the top of the document.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    // The page behind a modal must not scroll — on iOS especially, scrolling the body
    // under the overlay is disorienting and can leave the dialog off-screen.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      // Tab must not walk out of the dialog into the inert page behind it.
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
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      // Clicking the backdrop is the expected way out of a dialog like this; the
      // target check keeps a click that started inside the card from closing it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
      >
        <div id="delete-confirm-title" className={styles.title}>
          이 기록을 삭제할까요?
        </div>
        <div className={styles.body}>삭제한 기록은 다시 되돌릴 수 없어요.</div>
        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={[styles.button, styles.cancel].join(" ")}
            onClick={onCancel}
          >
            취소
          </button>
          <button type="button" className={[styles.button, styles.confirm].join(" ")} onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
