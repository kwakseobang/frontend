"use client";

import { PAGE_SIZE, memoriesApi, toCardMemory, todayIso } from "@/lib/core";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarPanel } from "@/components/memory/CalendarPanel";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { PillButton } from "@/components/form/PillButton";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  // Computed per mount, not at module load: the module is evaluated once per browser
  // session, so an installed PWA left open past midnight kept highlighting yesterday
  // as "today" and opening the calendar on it.
  const [today] = useState(todayIso);
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(() => today.slice(0, 7));
  const [year, month] = viewMonth.split("-").map(Number);

  const shiftMonth = useCallback((delta: number) => {
    setViewMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const next = new Date(y, m - 1 + delta, 1);
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  const timelineQuery = useInfiniteQuery({
    queryKey: ["memories", "timeline"],
    queryFn: ({ pageParam }) => memoriesApi.getTimeline(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNext ? allPages.length + 1 : undefined),
    enabled: mode === "list",
  });

  const datesQuery = useQuery({
    queryKey: ["memories", "dates", year, month],
    queryFn: () => memoriesApi.getMemoryDatesForMonth(year, month),
    enabled: mode === "calendar",
  });

  const dayQuery = useQuery({
    queryKey: ["memories", "date", selectedDate],
    queryFn: () => memoriesApi.getMemoriesByDate(selectedDate),
    enabled: mode === "calendar",
  });

  const listMemories = useMemo(
    () =>
      (timelineQuery.data?.pages.flatMap((page) => page.contents) ?? [])
        .map(toCardMemory)
        .sort((a, b) => b.time.localeCompare(a.time)),
    [timelineQuery.data],
  );
  const dayMemories = useMemo(
    () => (dayQuery.data ?? []).map(toCardMemory).sort((a, b) => b.time.localeCompare(a.time)),
    [dayQuery.data],
  );
  const entryDates = useMemo(() => new Set(datesQuery.data ?? []), [datesQuery.data]);

  // Note: dayQuery is deliberately excluded here. Its queryKey includes selectedDate,
  // so it goes back to "loading" on every date click (no cache for a new date yet) —
  // gating the whole panel on it would unmount/remount the entire calendar grid each
  // click. Only the day-entries list inside CalendarPanel should react to dayQuery.
  //
  // The two modes drive the same body slot, so loading/error are read off whichever
  // query the visible mode actually depends on.
  const activeQuery = mode === "list" ? timelineQuery : datesQuery;
  const isLoading = activeQuery.isLoading;
  const isEmpty = mode === "list" && !isLoading && listMemories.length === 0;
  const retryActive = useCallback(() => {
    if (mode === "list") void timelineQuery.refetch();
    else void datesQuery.refetch();
  }, [mode, timelineQuery, datesQuery]);

  const openDetail = useCallback((id: number) => router.push(`/entry/${id}`), [router]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>기록</h1>
          <div className={styles.rollCount}>
            ROLL NO. {String(mode === "list" ? listMemories.length : entryDates.size).padStart(3, "0")}
          </div>
        </div>
        <div className={styles.tabTrack}>
          <button
            className={[styles.tab, mode === "calendar" ? styles.active : ""].join(" ")}
            onClick={() => setMode("calendar")}
          >
            달력
          </button>
          <button
            className={[styles.tab, mode === "list" ? styles.active : ""].join(" ")}
            onClick={() => setMode("list")}
          >
            목록
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="기록을 불러오는 중" />
      ) : activeQuery.isError ? (
        <ErrorState error={activeQuery.error} fallback="기록을 불러오지 못했습니다" onRetry={retryActive} />
      ) : isEmpty ? (
        <EmptyState
          title="아직 기록이 없습니다"
          subtitle="첫 번째 순간을 남겨보세요"
          ctaLabel="기록하기"
          onCta={() => router.push("/write")}
        />
      ) : mode === "calendar" ? (
        <CalendarPanel
          memories={dayMemories}
          isDayLoading={dayQuery.isLoading}
          entryDates={entryDates}
          year={year}
          month={month - 1}
          monthLabel={`${year}년 ${month}월`}
          selectedDate={selectedDate}
          todayIso={today}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onOpen={openDetail}
        />
      ) : (
        <>
          <MemoryGrid memories={listMemories} onOpen={openDetail} />
          {timelineQuery.hasNextPage && (
            <div className={styles.loadMoreRow}>
              <PillButton
                variant="outline"
                onClick={() => timelineQuery.fetchNextPage()}
                disabled={timelineQuery.isFetchingNextPage}
              >
                {timelineQuery.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
              </PillButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
