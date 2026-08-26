"use client";

import { useRef, useState } from "react";
import styles from "./AvatarUploadSlot.module.css";

interface AvatarUploadSlotProps {
  size?: number;
  imageUrl: string | null;
  placeholderLetter: string;
  onFileSelected: (file: File) => void;
}

export function AvatarUploadSlot({
  size = 78,
  imageUrl,
  placeholderLetter,
  onFileSelected,
}: AvatarUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      className={[styles.slot, dragOver ? styles.dragOver : ""].join(" ")}
      style={{ width: size, height: size }}
      role="button"
      tabIndex={0}
      aria-label="프로필 이미지 변경"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="프로필 이미지" className={styles.image} />
      ) : (
        <span className={styles.placeholder}>{placeholderLetter}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
