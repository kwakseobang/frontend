import { describe, expect, it } from "vitest";
import {
  buildCalendarCells,
  dateOf,
  formatDayLabel,
  formatFull,
  formatStamp,
  formatTime,
  isValidDateTime,
} from "./date";

describe("formatTime", () => {
  it("uses 오전 before noon", () => {
    expect(formatTime("2026-08-18T09:05")).toBe("오전 9:05");
  });

  it("uses 오후 from noon onward", () => {
    expect(formatTime("2026-08-18T15:12")).toBe("오후 3:12");
    expect(formatTime("2026-08-18T12:00")).toBe("오후 12:00");
  });

  it("renders midnight as 오전 12", () => {
    expect(formatTime("2026-08-18T00:30")).toBe("오전 12:30");
  });

  it("pads single-digit minutes", () => {
    expect(formatTime("2026-08-18T07:07")).toBe("오전 7:07");
  });

  it("returns an empty string rather than throwing on malformed input", () => {
    expect(formatTime("")).toBe("");
    expect(formatTime("2026-08-18")).toBe("오전 12:00");
    expect(formatTime("nonsense")).toBe("");
  });
});

describe("formatStamp", () => {
  it("zero-pads month and day", () => {
    expect(formatStamp("2026-08-05T10:00")).toBe("2026. 08. 05");
  });

  // Regression: clearing the write form's datetime-local input made this render
  // "NaN. undefined. undefined" straight into the paper mock.
  it("returns an empty string for a cleared datetime input", () => {
    expect(formatStamp("")).toBe("");
  });

  it("rejects an out-of-range month", () => {
    expect(formatStamp("2026-13-01T00:00")).toBe("");
  });
});

describe("formatFull", () => {
  it("combines date and time", () => {
    expect(formatFull("2026-08-18T15:12")).toBe("2026년 8월 18일 오후 3:12");
  });

  it("degrades to an empty string on bad input", () => {
    expect(formatFull("")).toBe("");
  });
});

describe("formatDayLabel", () => {
  it("appends the Korean weekday", () => {
    // 2026-08-18 is a Tuesday.
    expect(formatDayLabel("2026-08-18T00:00")).toBe("8월 18일 화요일");
  });

  it("accepts a bare date with no time part", () => {
    expect(formatDayLabel("2026-08-18")).toBe("8월 18일 화요일");
  });
});

describe("dateOf", () => {
  it("keeps only the date half", () => {
    expect(dateOf("2026-08-18T15:12")).toBe("2026-08-18");
  });
});

describe("isValidDateTime", () => {
  it("accepts the shape the write form and backend use", () => {
    expect(isValidDateTime("2026-08-18T15:12")).toBe(true);
  });

  it("rejects an empty or date-only value", () => {
    expect(isValidDateTime("")).toBe(false);
    expect(isValidDateTime("2026-08-18")).toBe(false);
  });

  it("rejects impossible times", () => {
    expect(isValidDateTime("2026-08-18T25:00")).toBe(false);
  });
});

describe("buildCalendarCells", () => {
  const entryDates = new Set(["2026-08-18"]);

  it("pads the leading blanks up to the first weekday", () => {
    // 2026-08-01 is a Saturday, so six blanks precede it.
    const cells = buildCalendarCells(2026, 7, entryDates, "2026-08-18", "2026-08-18");
    expect(cells.slice(0, 6).every((c) => c.iso === null && c.day === "")).toBe(true);
    expect(cells[6]).toMatchObject({ day: 1, iso: "2026-08-01" });
  });

  it("emits one cell per day of the month", () => {
    const cells = buildCalendarCells(2026, 7, entryDates, "2026-08-18", "2026-08-18");
    expect(cells.filter((c) => c.iso !== null)).toHaveLength(31);
  });

  it("handles a leap-year February", () => {
    const cells = buildCalendarCells(2028, 1, new Set(), "2028-02-01", "2028-02-01");
    expect(cells.filter((c) => c.iso !== null)).toHaveLength(29);
  });

  it("flags selection, today and entry dots independently", () => {
    const cells = buildCalendarCells(2026, 7, entryDates, "2026-08-18", "2026-08-20");
    const byIso = (iso: string) => cells.find((c) => c.iso === iso)!;
    expect(byIso("2026-08-18")).toMatchObject({ isSelected: true, isToday: false, hasEntry: true });
    expect(byIso("2026-08-20")).toMatchObject({ isSelected: false, isToday: true, hasEntry: false });
  });
});
