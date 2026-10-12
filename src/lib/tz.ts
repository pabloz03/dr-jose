import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { es as esLocale } from "date-fns/locale";

/**
 * Única fuente de verdad para zona horaria en el cliente. Guatemala es
 * UTC-6 fijo, sin horario de verano — no existe "corrección DST" correcta
 * aquí porque nunca cambia, pero toda fecha/hora que el usuario ve o
 * ingresa debe pasar por estas funciones, nunca por `new Date(string)`
 * directo ni por `.getHours()`/`.toISOString().slice()` sobre un valor UTC.
 */
export const CLINIC_TZ = "America/Guatemala";

/** UTC (timestamptz de Postgres) -> Date con los campos en hora local de la clínica. */
export function toClinicTime(utc: Date | string): Date {
  return toZonedTime(utc, CLINIC_TZ);
}

/** Campos de hora local de la clínica (p. ej. de un date picker) -> instante UTC real. */
export function fromClinicTime(local: Date | string): Date {
  return fromZonedTime(local, CLINIC_TZ);
}

/** Formatea un instante UTC directamente en hora local de la clínica, sin paso intermedio. */
export function formatClinicDateTime(utc: Date | string, pattern: string): string {
  return formatInTimeZone(utc, CLINIC_TZ, pattern, { locale: esLocale });
}

export function formatClinicDateLong(utc: Date | string): string {
  const iso = typeof utc === "string" ? utc : utc.toISOString();
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short", timeZone: CLINIC_TZ }).format(
    new Date(iso),
  );
}

/**
 * Límites UTC [00:00, 24:00) de un día calendario de la clínica, dado
 * "yyyy-MM-dd". Para filtrar citas "de hoy"/"de esta semana" sin asumir
 * que el día local coincide con el día UTC (nunca lo asume — ver nota
 * arriba sobre toISOString().slice()).
 */
export function clinicDayBounds(isoDate: string): { from: string; to: string } {
  const from = fromClinicTime(`${isoDate}T00:00:00`);
  // Guatemala es UTC-6 fijo todo el año (sin DST): 24h siempre son 24h,
  // sumar milisegundos es seguro acá — no lo sería en una zona con DST.
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}
