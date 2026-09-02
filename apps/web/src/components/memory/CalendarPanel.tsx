"use client";

import { WEEKDAYS, buildCalendarCells, formatDayLabel } from "@/lib/core";
import type { Memory } from "@/lib/core";
import { memo, useMemo } from "react";

import { MemoryCard } from "./MemoryCard";
import styles from "./CalendarPanel.module.css";

interface CalendarPanelProps {
  /** entries for the selected day only */
  memories: Memory[];
  isDayLoading: boolean;
  entryDates: Set<string>;
  year: number;
  month: number; // 0-indexed
  monthLabel: string;
  selectedDate: string;
  todayIso: string;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpen: (id: number) => void;
}

export function CalendarPanel({
  memories,
  isDayLoading,
  entryDates,
  year,
  month,
  monthLabel,
  selectedDate,
  todayIso,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onOpen,
}: CalendarPanelProps) {
  return (
    <div className={styles.wrap}>
      <CalendarGrid
        year={year}
        month={month}
        monthLabel={monthLabel}
        entryDates={entryDates}
        selectedDate={selectedDate}
        todayIso={todayIso}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <DayEntries
        selectedDate={selectedDate}
        memories={memories}
        isLoading={isDayLoading}
        onOpen={onOpen}
      />
    </div>
  );
}

interface CalendarGridProps {
  year: number;
  month: number;
  monthLabel: string;
  entryDates: Set<string>;
  selectedDate: string;
  todayIso: string;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

// Memoized so it only recomputes when the month/selection actually changes, not on
// every unrelated re-render of the parent (e.g. tab switches, entries loading).
const CalendarGrid = memo(function CalendarGrid({
  year,
  month,
  monthLabel,
  entryDates,
  selectedDate,
  todayIso,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const cells = useMemo(
    () => buildCalendarCells(year, month, entryDates, selectedDate, todayIso),
    [year, month, entryDates, selectedDate, todayIso],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.monthHeader}>
        <button
          type="button"
          className={styles.monthNav}
          aria-label="이전 달"
          onClick={onPrevMonth}
        >
          ‹
        </button>
        <div className={styles.monthLabel}>{monthLabel}</div>
        <button
          type="button"
          className={styles.monthNav}
          aria-label="다음 달"
          onClick={onNextMonth}
        >
          ›
        </button>
      </div>
      <div className={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} className={styles.weekday}>
            {wd}
          </div>
        ))}
      </div>
      <div className={styles.cellGrid}>
        {cells.map((cell, i) => {
          const classes = [styles.cell];
          if (cell.iso) classes.push(styles.clickable);
          if (cell.isToday && !cell.isSelected) classes.push(styles.today);
          if (cell.isSelected) classes.push(styles.selected);
          return (
            <div
              key={cell.iso ?? `empty-${i}`}
              className={classes.join(" ")}
              role={cell.iso ? "button" : undefined}
              tabIndex={cell.iso ? 0 : undefined}
              aria-label={cell.iso ? formatDayLabel(cell.iso + "T00:00") : undefined}
              onClick={() => cell.iso && onSelectDate(cell.iso)}
              onKeyDown={(e) => {
                if (cell.iso && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectDate(cell.iso);
                }
              }}
            >
              <span className={styles.cellDay}>{cell.day}</span>
              <span className={[styles.dot, cell.hasEntry ? styles.visible : ""].join(" ")} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface DayEntriesProps {
  selectedDate: string;
  memories: Memory[];
  isLoading: boolean;
  onOpen: (id: number) => void;
}

// Isolated from CalendarGrid so a date click's inevitable dayQuery refetch only
// re-renders this section (and shows its own loading state) instead of blanking
// out the whole panel while data for the new date loads in.
const DayEntries = memo(function DayEntries({ selectedDate, memories, isLoading, onOpen }: DayEntriesProps) {
  return (
    <div className={styles.entries}>
      <div className={styles.entriesHeader}>
        <div className={styles.entriesLabel}>{formatDayLabel(selectedDate + "T00:00")}</div>
        <div className={styles.hr} />
      </div>
      {isLoading ? null : memories.length === 0 ? (
        <div className={styles.empty}>이 날의 기록이 없어요.</div>
      ) : (
        <div className={styles.grid}>
          {memories.map((entry, i) => (
            <MemoryCard key={entry.id} memory={entry} rotate={i % 2 === 0 ? "even" : "odd"} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
});
