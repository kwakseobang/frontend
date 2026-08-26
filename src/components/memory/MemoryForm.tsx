"use client";

import { useRef } from "react";
import type { Visibility } from "@/types/memory";
import { formatStamp } from "@/lib/date";
import { VisibilityChip } from "@/components/form/VisibilityChip";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import styles from "./MemoryForm.module.css";

export type ImageSlot = { kind: "new"; file: File; previewUrl: string } | { kind: "existing"; url: string };

export interface MemoryFormValue {
  text: string;
  images: ImageSlot[];
  time: string;
  visibility: Visibility;
}

interface MemoryFormProps {
  title: string;
  value: MemoryFormValue;
  onChange: (value: MemoryFormValue) => void;
  onBack: () => void;
  onSave: () => void;
  maxImages: number;
  error?: string;
  saving?: boolean;
}

export function MemoryForm({ title, value, onChange, onBack, onSave, maxImages, error, saving }: MemoryFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAddImage = value.images.length < maxImages;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = maxImages - value.images.length;
    const next: ImageSlot[] = Array.from(files)
      .slice(0, room)
      .map((file) => ({ kind: "new", file, previewUrl: URL.createObjectURL(file) }));
    if (next.length > 0) onChange({ ...value, images: [...value.images, ...next] });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={onBack} aria-label="뒤로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-quaternary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={styles.title}>{title}</div>
        <PillButton variant="compact" onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </PillButton>
      </div>

      <div className={styles.paper}>
        <textarea
          className={styles.textarea}
          placeholder="어떤 순간이었나요?"
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
        <div className={styles.stamp}>{formatStamp(value.time)}</div>
      </div>

      <div className={styles.imageRow}>
        {value.images.map((slot, i) => (
          <div
            key={i}
            className={styles.thumb}
            style={{ backgroundImage: `url(${slot.kind === "new" ? slot.previewUrl : slot.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <button
              type="button"
              className={styles.removeButton}
              aria-label="사진 삭제"
              onClick={() => onChange({ ...value, images: value.images.filter((_, idx) => idx !== i) })}
            >
              ✕
            </button>
          </div>
        ))}
        {canAddImage && (
          <button className={styles.addSlot} onClick={() => inputRef.current?.click()} aria-label="사진 추가">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className={styles.metaRow}>
        <div className={styles.metaCol}>
          <div className={styles.metaLabel}>기록 시간</div>
          <UnderlineInput
            type="datetime-local"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
          />
        </div>
        <div className={styles.metaCol}>
          <div className={styles.metaLabel}>공개 범위</div>
          <VisibilityChip
            value={value.visibility}
            onChange={(visibility) => onChange({ ...value, visibility })}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
