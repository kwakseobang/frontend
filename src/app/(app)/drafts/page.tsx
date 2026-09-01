"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { getDrafts } from "@/lib/api/memories";
import { toCardMemory } from "@/lib/memoryView";
import styles from "./page.module.css";

export default function DraftsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["memories", "drafts"],
    queryFn: getDrafts,
  });

  const memories = useMemo(
    () => (data ?? []).map(toCardMemory).sort((a, b) => b.time.localeCompare(a.time)),
    [data],
  );
  const isEmpty = !isLoading && memories.length === 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>임시저장</div>
        <div className={styles.rollCount}>ROLL NO. {String(memories.length).padStart(3, "0")}</div>
      </div>

      {isLoading ? null : isEmpty ? (
        <EmptyState
          title="임시저장한 기록이 없습니다"
          subtitle="쓰다 만 기록을 이어서 완성해보세요"
          ctaLabel="새로 기록하기"
          onCta={() => router.push("/write")}
        />
      ) : (
        <MemoryGrid memories={memories} onOpen={(id) => router.push(`/entry/${id}`)} />
      )}
    </div>
  );
}
