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

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div
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
            className={[styles.button, styles.cancel].join(" ")}
            onClick={onCancel}
          >
            취소
          </button>
          <button className={[styles.button, styles.confirm].join(" ")} onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
