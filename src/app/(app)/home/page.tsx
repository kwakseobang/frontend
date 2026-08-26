"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarPanel } from "@/components/memory/CalendarPanel";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { EmptyState } from "@/components/feedback/EmptyState";
import { getMemoriesByDate, getMemoryDatesForMonth, getTimeline } from "@/lib/api/memories";
import { toCardMemory, todayIso } from "@/lib/memoryView";
import styles from "./page.module.css";

const TODAY_ISO = todayIso();
const PAGE_SIZE = 20;

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [year, month] = selectedDate.split("-").map(Number);

  const timelineQuery = useQuery({
    queryKey: ["memories", "timeline", 1, PAGE_SIZE],
    queryFn: () => getTimeline(1, PAGE_SIZE),
    enabled: mode === "list",
  });

  const datesQuery = useQuery({
    queryKey: ["memories", "dates", year, month],
    queryFn: () => getMemoryDatesForMonth(year, month),
    enabled: mode === "calendar",
  });

  const dayQuery = useQuery({
    queryKey: ["memories", "date", selectedDate],
    queryFn: () => getMemoriesByDate(selectedDate),
    enabled: mode === "calendar",
  });

  const listMemories = useMemo(
    () => (timelineQuery.data?.contents ?? []).map(toCardMemory).sort((a, b) => b.time.localeCompare(a.time)),
    [timelineQuery.data],
  );
  const dayMemories = useMemo(
    () => (dayQuery.data ?? []).map(toCardMemory).sort((a, b) => b.time.localeCompare(a.time)),
    [dayQuery.data],
  );
  const entryDates = new Set(datesQuery.data ?? []);

  const isLoading = mode === "list" ? timelineQuery.isLoading : datesQuery.isLoading || dayQuery.isLoading;
  const isEmpty = mode === "list" && !isLoading && listMemories.length === 0;

  const openDetail = (id: number) => router.push(`/entry/${id}`);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>기록</div>
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

      {isLoading ? null : isEmpty ? (
        <EmptyState
          title="아직 기록이 없습니다"
          subtitle="첫 번째 순간을 남겨보세요"
          ctaLabel="기록하기"
          onCta={() => router.push("/write")}
        />
      ) : mode === "calendar" ? (
        <CalendarPanel
          memories={dayMemories}
          entryDates={entryDates}
          year={year}
          month={month - 1}
          monthLabel={`${year}년 ${month}월`}
          selectedDate={selectedDate}
          todayIso={TODAY_ISO}
          onSelectDate={setSelectedDate}
          onOpen={openDetail}
        />
      ) : (
        <MemoryGrid memories={listMemories} onOpen={openDetail} />
      )}
    </div>
  );
}
