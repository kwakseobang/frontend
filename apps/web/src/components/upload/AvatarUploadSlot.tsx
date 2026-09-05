"use client";

import { IMAGE_ACCEPT, validateImage } from "@/lib/core";
import { useRef, useState } from "react";
import Image from "next/image";

import { useToast } from "@/components/toast/ToastProvider";
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
  const { showToast } = useToast();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const error = validateImage(file);
    if (error) {
      showToast(error);
      return;
    }
    onFileSelected(file);
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
        <Image src={imageUrl} alt="프로필 이미지" className={styles.image} width={size} height={size} />
      ) : (
        <span className={styles.placeholder}>{placeholderLetter}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className={styles.fileInput}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
