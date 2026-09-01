"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { getFavorites } from "@/lib/api/favorites";
import { toCardMemory } from "@/lib/memoryView";
import styles from "./page.module.css";

const PAGE_SIZE = 20;

export default function FavoritesPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["favorites", "list", 1, PAGE_SIZE],
    queryFn: () => getFavorites(1, PAGE_SIZE),
  });

  const memories = useMemo(() => (data?.contents ?? []).map(toCardMemory), [data]);
  const isEmpty = !isLoading && memories.length === 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>즐겨찾기</div>
        <div className={styles.rollCount}>ROLL NO. {String(memories.length).padStart(3, "0")}</div>
      </div>

      {isLoading ? null : isEmpty ? (
        <EmptyState
          title="즐겨찾기한 기록이 없습니다"
          subtitle="기록 상세에서 하트를 눌러 모아보세요"
          ctaLabel="기록 보러가기"
          onCta={() => router.push("/home")}
        />
      ) : (
        <MemoryGrid memories={memories} onOpen={(id) => router.push(`/entry/${id}`)} />
      )}
    </div>
  );
}
