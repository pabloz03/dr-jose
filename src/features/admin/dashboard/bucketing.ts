import { CalendarDate, DateFormatter, parseDate, startOfMonth } from "@internationalized/date";
import { CLINIC_TZ } from "@/lib/tz";
import { weekStart } from "../calendar/dateRanges";

export type Granularity = "semana" | "mes";

const monthLabelFormatter = new DateFormatter("es-GT", { month: "short", year: "numeric" });
const dayLabelFormatter = new DateFormatter("es-GT", { day: "numeric", month: "short" });

/**
 * Clave de bucket para una fila con `day` ("yyyy-MM-dd", ya en hora
 * local de la clínica — calculado en Postgres, nunca re-derivado acá):
 * el lunes ISO de esa semana, o el año-mes. Nunca pasa por `new
 * Date(string)` crudo — `parseDate` de @internationalized/date trabaja
 * sobre el calendario puro, sin ambigüedad de zona horaria.
 */
export function bucketKey(day: string, granularity: Granularity): string {
  const date = parseDate(day);
  if (granularity === "mes") return `${date.year}-${String(date.month).padStart(2, "0")}`;
  return weekStart(date).toString();
}

/** Etiqueta legible para una clave de bucket — usa CalendarDate.toDate(tz), el
 * conversor zone-safe de la librería, nunca un string sin zona armado a mano. */
export function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "mes") {
    const [yearStr, monthStr] = key.split("-");
    return monthLabelFormatter.format(new CalendarDate(Number(yearStr), Number(monthStr), 1).toDate(CLINIC_TZ));
  }
  return dayLabelFormatter.format(parseDate(key).toDate(CLINIC_TZ));
}

/** Agrupa filas que ya traen `day` por bucket, preservando las filas originales
 * para que cada consumidor (KPIs, desglose por estado, desglose por tipo) sume lo que necesite. */
export function groupByBucket<T extends { day: string }>(
  rows: T[],
  granularity: Granularity,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = bucketKey(row.day, granularity);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

/** Últimas `count` claves de bucket terminando en `asOf` (inclusive), en orden
 * cronológico — incluye buckets sin datos para que el período completo se vea,
 * no solo los que tuvieron citas. `asOf` se pasa explícito (nunca `today()`
 * adentro) para que esto sea una función pura y testeable. */
export function trailingBucketKeys(asOf: CalendarDate, granularity: Granularity, count: number): string[] {
  const keys: string[] = [];
  let cursor = granularity === "mes" ? startOfMonth(asOf) : weekStart(asOf);
  for (let i = 0; i < count; i++) {
    keys.unshift(bucketKey(cursor.toString(), granularity));
    cursor = granularity === "mes" ? cursor.subtract({ months: 1 }) : cursor.subtract({ weeks: 1 });
  }
  return keys;
}
