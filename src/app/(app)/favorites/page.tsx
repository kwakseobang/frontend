"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PillButton } from "@/components/form/PillButton";
import { getFavorites } from "@/lib/api/favorites";
import { PAGE_SIZE } from "@/lib/constants";
import { toCardMemory } from "@/lib/memoryView";
import styles from "./page.module.css";

export default function FavoritesPage() {
  const router = useRouter();

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["favorites", "list"],
    queryFn: ({ pageParam }) => getFavorites(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNext ? allPages.length + 1 : undefined),
  });

  const memories = useMemo(
    () => (data?.pages.flatMap((page) => page.contents) ?? []).map(toCardMemory),
    [data],
  );
  const isEmpty = !isLoading && memories.length === 0;
  const openDetail = useCallback((id: number) => router.push(`/entry/${id}`), [router]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>즐겨찾기</h1>
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
        <>
          <MemoryGrid memories={memories} onOpen={openDetail} />
          {hasNextPage && (
            <div className={styles.loadMoreRow}>
              <PillButton variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
              </PillButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
