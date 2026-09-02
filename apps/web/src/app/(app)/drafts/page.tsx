"use client";

import { memoriesApi, toCardMemory } from "@/lib/core";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";

import styles from "./page.module.css";

export default function DraftsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["memories", "drafts"],
    queryFn: memoriesApi.getDrafts,
  });

  const memories = useMemo(
    () => (data ?? []).map(toCardMemory).sort((a, b) => b.time.localeCompare(a.time)),
    [data],
  );
  const isEmpty = !isLoading && memories.length === 0;
  const openDetail = useCallback((id: number) => router.push(`/entry/${id}`), [router]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>임시저장</h1>
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
        <MemoryGrid memories={memories} onOpen={openDetail} />
      )}
    </div>
  );
}
