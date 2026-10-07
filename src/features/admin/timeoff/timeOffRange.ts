import { fromClinicTime } from "@/lib/tz";
import type { TimeOffFormValues } from "./schemas";

/** Convierte el form (fechas/horas locales) a límites UTC reales. */
export function timeOffRangeUtc(values: TimeOffFormValues): { starts_at: string; ends_at: string } {
  if (values.all_day) {
    const starts_at = fromClinicTime(`${values.from_date}T00:00:00`);
    const endOfToDate = fromClinicTime(`${values.to_date}T00:00:00`);
    // Guatemala es UTC-6 fijo (sin DST): sumar 24h es seguro acá.
    const ends_at = new Date(endOfToDate.getTime() + 24 * 60 * 60 * 1000);
    return { starts_at: starts_at.toISOString(), ends_at: ends_at.toISOString() };
  }
  const starts_at = fromClinicTime(`${values.from_date}T${values.from_time || "00:00"}:00`);
  const ends_at = fromClinicTime(`${values.to_date}T${values.to_time || "23:59"}:00`);
  return { starts_at: starts_at.toISOString(), ends_at: ends_at.toISOString() };
}
