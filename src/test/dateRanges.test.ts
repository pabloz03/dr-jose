import { describe, expect, it } from "vitest";
import { CalendarDate } from "@internationalized/date";
import { weekStart, dayRangeUtc, weekRangeUtc, monthRangeUtc, weekDays } from "@/features/admin/calendar/dateRanges";

describe("weekStart", () => {
  it("un miércoles regresa el lunes de esa semana", () => {
    // 2026-03-11 es miércoles
    expect(weekStart(new CalendarDate(2026, 3, 11)).toString()).toBe("2026-03-09");
  });

  it("un lunes se regresa a sí mismo", () => {
    expect(weekStart(new CalendarDate(2026, 3, 9)).toString()).toBe("2026-03-09");
  });

  it("un domingo regresa el lunes anterior, no el mismo día", () => {
    // 2026-03-15 es domingo
    expect(weekStart(new CalendarDate(2026, 3, 15)).toString()).toBe("2026-03-09");
  });
});

describe("dayRangeUtc / weekRangeUtc / monthRangeUtc", () => {
  it("dayRangeUtc dura 24 horas", () => {
    const { from, to } = dayRangeUtc(new CalendarDate(2026, 3, 10));
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("weekRangeUtc dura 7 días exactos y empieza en lunes", () => {
    const { from, to } = weekRangeUtc(new CalendarDate(2026, 3, 11));
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    expect(from).toBe(dayRangeUtc(new CalendarDate(2026, 3, 9)).from);
  });

  it("monthRangeUtc cubre del día 1 al primer día del mes siguiente", () => {
    const { from, to } = monthRangeUtc(new CalendarDate(2026, 2, 15));
    expect(from).toBe(dayRangeUtc(new CalendarDate(2026, 2, 1)).from);
    expect(to).toBe(dayRangeUtc(new CalendarDate(2026, 3, 1)).from);
  });
});

describe("weekDays", () => {
  it("devuelve 7 días empezando en lunes", () => {
    const days = weekDays(new CalendarDate(2026, 3, 11)).map((d) => d.toString());
    expect(days).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });
});
