import { startOfMonth, startOfWeek, endOfMonth, type CalendarDate } from "@internationalized/date";
import { clinicDayBounds } from "@/lib/tz";

/** Lunes de la semana ISO que contiene `date` — forzado explícito, no vía
 * detección de locale, para no depender de que la librería traiga datos
 * de "es-GT" (puede no existir y hacer fallback silencioso a domingo). */
export function weekStart(date: CalendarDate): CalendarDate {
  return startOfWeek(date, "es-GT", "mon");
}

export function dayRangeUtc(date: CalendarDate) {
  return clinicDayBounds(date.toString());
}

export function weekRangeUtc(date: CalendarDate) {
  const start = weekStart(date);
  const end = start.add({ days: 7 });
  return { from: clinicDayBounds(start.toString()).from, to: clinicDayBounds(end.toString()).from };
}

export function monthRangeUtc(date: CalendarDate) {
  const start = startOfMonth(date);
  const end = endOfMonth(date).add({ days: 1 });
  return { from: clinicDayBounds(start.toString()).from, to: clinicDayBounds(end.toString()).from };
}

export function weekDays(date: CalendarDate): CalendarDate[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => start.add({ days: i }));
}
