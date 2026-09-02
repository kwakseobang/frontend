"use client";

import { useEffect, useRef } from "react";
import type { Visibility } from "@/types/memory";
import { formatStamp } from "@/lib/date";
import { VisibilityChip } from "@/components/form/VisibilityChip";
import { UnderlineInput } from "@/components/form/UnderlineInput";
import { PillButton } from "@/components/form/PillButton";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/validateImageFile";
import { useToast } from "@/components/toast/ToastProvider";
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
  onSaveDraft?: () => void;
  savingDraft?: boolean;
}

export function MemoryForm({
  title,
  value,
  onChange,
  onBack,
  onSave,
  maxImages,
  error,
  saving,
  onSaveDraft,
  savingDraft,
}: MemoryFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAddImage = value.images.length < maxImages;
  const { showToast } = useToast();

  // Every URL.createObjectURL pins its Blob in memory until revoked. Without this the
  // form leaked one full-size image per pick — visible on a phone after a few edits.
  const previewUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = maxImages - value.images.length;
    const selected = Array.from(files);
    const candidates = selected.slice(0, room);
    const next: ImageSlot[] = [];
    let rejected = 0;

    for (const file of candidates) {
      if (validateImageFile(file)) {
        rejected += 1;
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      next.push({ kind: "new", file, previewUrl });
    }

    // Previously the over-limit slice was silent: pick 10 photos with 5 allowed and
    // half of them just never appeared, with no explanation.
    if (selected.length > room) {
      showToast(`사진은 최대 ${maxImages}장까지 첨부할 수 있어요.`);
    } else if (rejected > 0) {
      showToast("일부 이미지가 형식/용량 제한으로 제외되었어요.");
    }
    if (next.length > 0) onChange({ ...value, images: [...value.images, ...next] });
  };

  const removeImage = (index: number) => {
    const slot = value.images[index];
    if (slot.kind === "new") {
      URL.revokeObjectURL(slot.previewUrl);
      previewUrls.current.delete(slot.previewUrl);
    }
    onChange({ ...value, images: value.images.filter((_, idx) => idx !== index) });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <button className={styles.backButton} onClick={onBack} aria-label="뒤로">
          <BackChevronIcon />
        </button>
        <div className={styles.title}>{title}</div>
        <div className={styles.headerActions}>
          {onSaveDraft && (
            <PillButton
              variant="outline"
              className={styles.draftButton}
              onClick={onSaveDraft}
              disabled={saving || savingDraft}
            >
              {savingDraft ? "저장 중..." : "임시저장"}
            </PillButton>
          )}
          <PillButton variant="compact" onClick={onSave} disabled={saving || savingDraft}>
            {saving ? "저장 중..." : "저장"}
          </PillButton>
        </div>
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
              onClick={() => removeImage(i)}
            >
              ✕
            </button>
          </div>
        ))}
        {canAddImage && (
          <button type="button" className={styles.addSlot} onClick={() => inputRef.current?.click()} aria-label="사진 추가">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
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
