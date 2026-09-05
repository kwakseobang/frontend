"use client";

import { formatTime } from "@/lib/core";
import type { Memory } from "@/lib/core";
import { memo } from "react";
import Image from "next/image";

import styles from "./MemoryCard.module.css";

interface MemoryCardProps {
  memory: Memory;
  rotate: "even" | "odd";
  onOpen: (id: number) => void;
}

export const MemoryCard = memo(function MemoryCard({ memory, rotate, onOpen }: MemoryCardProps) {
  const rot = rotate === "even" ? "-1.1deg" : "0.9deg";
  const hasImages = memory.images.length > 0;
  const hasExtra = memory.images.length > 1;

  return (
    <div
      className={styles.card}
      style={{ transform: `rotate(${rot})` }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(memory.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(memory.id);
        }
      }}
    >
      {hasImages && (
        <div className={styles.imageWrap}>
          <Image
            src={memory.images[0]}
            alt=""
            fill
            sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
          {hasExtra && <div className={styles.extraBadge}>+{memory.images.length - 1}</div>}
        </div>
      )}
      <div className={styles.text}>{memory.text}</div>
      <div className={styles.footer}>
        <span className={styles.time}>{formatTime(memory.time)}</span>
        {memory.visibility === "PUBLIC" && <span className={styles.publicBadge}>공개</span>}
      </div>
    </div>
  );
});
