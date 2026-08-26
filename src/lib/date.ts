const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatTime(iso: string): string {
  const timePart = iso.split("T")[1];
  const [h, m] = timePart.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string): string {
  const [datePart] = iso.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return `${mo}월 ${d}일 ${WEEKDAYS[dt.getDay()]}요일`;
}

export function formatFull(iso: string): string {
  const [y, mo, d] = iso.split("T")[0].split("-").map(Number);
  return `${y}년 ${mo}월 ${d}일 ${formatTime(iso)}`;
}

export function formatStamp(iso: string): string {
  const [y, mo, d] = iso.split("T")[0].split("-").map(Number);
  return `${y}. ${String(mo).padStart(2, "0")}. ${String(d).padStart(2, "0")}`;
}

export function dateOf(iso: string): string {
  return iso.split("T")[0];
}

export interface CalendarCell {
  day: number | "";
  iso: string | null;
  isSelected: boolean;
  isToday: boolean;
  hasEntry: boolean;
}

export function buildCalendarCells(
  year: number,
  month: number, // 0-indexed
  entryDates: Set<string>,
  selectedDate: string,
  todayIso: string,
): CalendarCell[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: "", iso: null, isSelected: false, isToday: false, hasEntry: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      iso,
      isSelected: iso === selectedDate,
      isToday: iso === todayIso,
      hasEntry: entryDates.has(iso),
    });
  }
  return cells;
}

export { WEEKDAYS };
