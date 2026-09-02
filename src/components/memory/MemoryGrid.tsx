"use client";

import { useMemo } from "react";
import type { Memory } from "@/types/memory";
import { formatDayLabel, dateOf } from "@/lib/date";
import { MemoryCard } from "./MemoryCard";
import styles from "./MemoryGrid.module.css";

interface MemoryGridProps {
  memories: Memory[];
  onOpen: (id: number) => void;
}

interface DayGroup {
  day: string;
  dayLabel: string;
  entries: Memory[];
}

function groupByDay(memories: Memory[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const m of memories) {
    const day = dateOf(m.time);
    if (!current || current.day !== day) {
      current = { day, dayLabel: formatDayLabel(m.time), entries: [] };
      groups.push(current);
    }
    current.entries.push(m);
  }
  return groups;
}

export function MemoryGrid({ memories, onOpen }: MemoryGridProps) {
  const groups = useMemo(() => groupByDay(memories), [memories]);

  return (
    <>
      {groups.map((group) => (
        <div key={group.day} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.dayLabel}>{group.dayLabel}</div>
            <div className={styles.hr} />
          </div>
          <div className={styles.grid}>
            {group.entries.map((entry, i) => (
              <MemoryCard
                key={entry.id}
                memory={entry}
                rotate={i % 2 === 0 ? "even" : "odd"}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
