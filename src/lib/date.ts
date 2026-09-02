const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface IsoParts {
  year: number;
  month: number; // 1-indexed, as written in the string
  day: number;
  hour: number;
  minute: number;
}

/**
 * Parses "YYYY-MM-DD[THH:mm[:ss]]" without going through Date, so a value is never
 * silently shifted by the runtime's timezone. Returns null instead of throwing: the
 * write form binds a <input type="datetime-local"> straight to this, and clearing
 * that input yields "" — which used to render "NaN. undefined. undefined" as the
 * paper's date stamp.
 */
function parseIso(iso: string | null | undefined): IsoParts | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const parts = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: h === undefined ? 0 : Number(h),
    minute: mi === undefined ? 0 : Number(mi),
  };
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31) return null;
  if (parts.hour > 23 || parts.minute > 59) return null;
  return parts;
}

export function formatTime(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  const ampm = parts.hour < 12 ? "오전" : "오후";
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${ampm} ${h12}:${String(parts.minute).padStart(2, "0")}`;
}

export function formatDayLabel(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  const dt = new Date(parts.year, parts.month - 1, parts.day);
  return `${parts.month}월 ${parts.day}일 ${WEEKDAYS[dt.getDay()]}요일`;
}

export function formatFull(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${formatTime(iso)}`;
}

export function formatStamp(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return "";
  return `${parts.year}. ${String(parts.month).padStart(2, "0")}. ${String(parts.day).padStart(2, "0")}`;
}

export function dateOf(iso: string): string {
  return iso.split("T")[0];
}

/** True for the "YYYY-MM-DDTHH:mm" shape the write form and the backend both expect. */
export function isValidDateTime(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && parseIso(iso) !== null;
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
