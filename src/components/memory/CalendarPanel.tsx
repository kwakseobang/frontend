"use client";

import type { Memory } from "@/types/memory";
import { WEEKDAYS, buildCalendarCells, formatDayLabel } from "@/lib/date";
import { MemoryCard } from "./MemoryCard";
import styles from "./CalendarPanel.module.css";

interface CalendarPanelProps {
  /** entries for the selected day only */
  memories: Memory[];
  entryDates: Set<string>;
  year: number;
  month: number; // 0-indexed
  monthLabel: string;
  selectedDate: string;
  todayIso: string;
  onSelectDate: (iso: string) => void;
  onOpen: (id: number) => void;
}

export function CalendarPanel({
  memories,
  entryDates,
  year,
  month,
  monthLabel,
  selectedDate,
  todayIso,
  onSelectDate,
  onOpen,
}: CalendarPanelProps) {
  const cells = buildCalendarCells(year, month, entryDates, selectedDate, todayIso);
  const dayEntries = memories;

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.monthLabel}>{monthLabel}</div>
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

      <div className={styles.entries}>
        <div className={styles.entriesHeader}>
          <div className={styles.entriesLabel}>{formatDayLabel(selectedDate + "T00:00")}</div>
          <div className={styles.hr} />
        </div>
        {dayEntries.length === 0 ? (
          <div className={styles.empty}>이 날의 기록이 없어요.</div>
        ) : (
          <div className={styles.grid}>
            {dayEntries.map((entry, i) => (
              <MemoryCard
                key={entry.id}
                memory={entry}
                rotate={i % 2 === 0 ? "even" : "odd"}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
