export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** Instante UTC de inicio/fin (ISO o Date) — el .ics se arma en UTC. */
  startsAt: Date | string;
  endsAt: Date | string;
  /** Minutos antes del inicio para la alarma (-24h por defecto, E3-S3). */
  alarmMinutesBefore?: number;
}

function toIcsUtc(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Arma un .ics de un solo evento. Zona horaria siempre UTC (DTSTART/DTEND en Z). */
export function buildIcs(event: IcsEvent): string {
  const alarmMinutes = event.alarmMinutesBefore ?? 24 * 60;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Citas Ortodoncia//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.startsAt)}`,
    `DTEND:${toIcsUtc(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(event.title)}`,
    `TRIGGER:-PT${alarmMinutes}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.join("\r\n");
}

/** Dispara la descarga del .ics en el navegador. */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
