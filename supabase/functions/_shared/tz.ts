// Mismo contrato que src/lib/tz.ts (regla dura #3 de CLAUDE.md: "Fechas:
// solo vía lib/tz.ts") pero para el runtime Deno de las Edge Functions,
// que no puede importar directamente el módulo del front-end.
const CLINIC_TZ = "America/Guatemala";
const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }); // en-CA -> YYYY-MM-DD

/** Fecha LOCAL de la clínica (no UTC) de un instante, como "YYYY-MM-DD". */
export function clinicISODate(d: Date = new Date()): string {
  return dateFmt.format(d);
}
