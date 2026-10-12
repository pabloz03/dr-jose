// deno-lint-ignore-file no-explicit-any
// Plantillas de correo: HTML + texto plano, botones ≥ 44 px, contraste
// verificado contra los tokens de la app (mismo verde/tinta que
// styles/tokens.css), lang="es", trato "usted" (regla 9 de CLAUDE.md).

const INK = "#0E1B20";
const MUTED = "#4A5A62";
const BG = "#F5F7F8";
const ACCENT = "#0A6F6A";
const ON_ACCENT = "#FFFFFF";

function fmt(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short", timeZone: tz }).format(
    new Date(iso),
  );
}

function btn(href: string, label: string, primary = false): string {
  const style = primary
    ? `background:${ACCENT};color:${ON_ACCENT};`
    : `background:#FFFFFF;color:${ACCENT};border:2px solid ${ACCENT};line-height:44px;`;
  return `<a href="${href}" style="display:inline-block;min-height:48px;line-height:48px;padding:0 22px;margin:6px 6px 6px 0;border-radius:12px;font:600 16px/48px Arial,sans-serif;text-decoration:none;${style}">${label}</a>`;
}

/** Botón "Cómo llegar" cuando la clínica tiene maps_url — mismo botón secundario que ya usa la app (AppointmentDetailPage, BookingSuccess). */
function mapsBtn(appt: any): string {
  return appt.clinic.maps_url ? btn(appt.clinic.maps_url, "Cómo llegar") : "";
}

function whatsappNote(appt: any): string {
  return appt.clinic.whatsapp
    ? `Si no puede usar los botones, escríbanos por WhatsApp: ${appt.clinic.whatsapp}.`
    : "Si no puede usar los botones, comuníquese con la clínica.";
}

function shell({ clinicName, title, bodyHtml, footerNote }: { clinicName: string; title: string; bodyHtml: string; footerNote: string }): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:${BG};padding:24px;font:16px/1.5 Arial,sans-serif;color:${INK}">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px">
<p style="font-size:14px;color:${MUTED};margin:0 0 8px">${clinicName}</p>
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
${bodyHtml}
<p style="font-size:14px;color:${MUTED};margin:20px 0 0">${footerNote}</p>
</div></body></html>`;
}

function textLines(lines: Array<string | false | null | undefined>): string {
  return lines.filter(Boolean).join("\n");
}

export function renderReminder({ appt, links }: { appt: any; links: Partial<Record<"confirm" | "reschedule" | "cancel", string>> }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const confirmed = appt.status === "confirmed";
  const subject = `Mañana tiene cita: ${when}`;
  const bodyHtml = `
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 4px">${appt.type.name}</p>
<p style="margin:0 0 16px;font-size:18px"><strong>${when}</strong></p>
<p style="margin:0 0 16px">${appt.clinic.address ?? ""}</p>
<p style="margin:0 0 8px">${confirmed ? "Su cita ya está confirmada. Si algo cambió, puede reprogramarla o cancelarla:" : "Por favor confirme su asistencia:"}</p>
<div>${links.confirm ? btn(links.confirm, "Confirmar mi cita", true) : ""}${links.reschedule ? btn(links.reschedule, "Cambiar fecha u hora") : ""}${links.cancel ? btn(links.cancel, "Cancelar cita") : ""}${mapsBtn(appt)}</div>`;
  const html = shell({ clinicName: appt.clinic.name, title: "Recordatorio de cita", bodyHtml, footerNote: whatsappNote(appt) });
  const text = textLines([
    appt.clinic.name,
    "Recordatorio de cita",
    `${appt.patient.full_name} — ${appt.type.name}`,
    when,
    appt.clinic.address ?? "",
    links.confirm && `Confirmar: ${links.confirm}`,
    links.reschedule && `Cambiar fecha u hora: ${links.reschedule}`,
    links.cancel && `Cancelar: ${links.cancel}`,
    appt.clinic.maps_url && `Cómo llegar: ${appt.clinic.maps_url}`,
  ]);
  return { subject, html, text };
}

export function renderBooked({ appt, links }: { appt: any; links: { reschedule: string; cancel: string } }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const subject = `Cita reservada: ${when}`;
  const bodyHtml = `
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 4px">${appt.type.name}</p>
<p style="margin:0 0 16px;font-size:18px"><strong>${when}</strong></p>
<p style="margin:0 0 16px">${appt.clinic.address ?? ""}</p>
<p style="margin:0 0 8px">Le enviaremos un recordatorio un día antes. Si necesita cambiar algo:</p>
<div>${btn(links.reschedule, "Cambiar fecha u hora")}${btn(links.cancel, "Cancelar cita")}${mapsBtn(appt)}</div>`;
  const html = shell({ clinicName: appt.clinic.name, title: "Su cita quedó reservada", bodyHtml, footerNote: whatsappNote(appt) });
  const text = textLines([
    appt.clinic.name,
    "Cita reservada",
    `${appt.patient.full_name} — ${appt.type.name}`,
    when,
    appt.clinic.address ?? "",
    `Cambiar fecha u hora: ${links.reschedule}`,
    `Cancelar: ${links.cancel}`,
    appt.clinic.maps_url && `Cómo llegar: ${appt.clinic.maps_url}`,
  ]);
  return { subject, html, text };
}

export function renderCancelled({ appt }: { appt: any }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const subject = `Cita cancelada: ${when}`;
  const bodyHtml = `
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 16px">Su cita del ${when} quedó cancelada.</p>
<p style="margin:0 0 8px">Cuando quiera, puede agendar una nueva desde la aplicación.</p>`;
  const html = shell({ clinicName: appt.clinic.name, title: "Cita cancelada", bodyHtml, footerNote: whatsappNote(appt) });
  const text = textLines([appt.clinic.name, "Cita cancelada", `${appt.patient.full_name} — ${appt.type.name}`, when]);
  return { subject, html, text };
}

export function renderRescheduled({ appt, links }: { appt: any; links: { reschedule: string; cancel: string } }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const subject = `Cita reprogramada: ${when}`;
  const bodyHtml = `
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 4px">${appt.type.name}</p>
<p style="margin:0 0 16px">Su cita quedó reprogramada para:</p>
<p style="margin:0 0 16px;font-size:18px"><strong>${when}</strong></p>
<p style="margin:0 0 8px">Si necesita cambiar algo de nuevo:</p>
<div>${btn(links.reschedule, "Cambiar fecha u hora")}${btn(links.cancel, "Cancelar cita")}${mapsBtn(appt)}</div>`;
  const html = shell({ clinicName: appt.clinic.name, title: "Cita reprogramada", bodyHtml, footerNote: whatsappNote(appt) });
  const text = textLines([
    appt.clinic.name,
    "Cita reprogramada",
    `${appt.patient.full_name} — ${appt.type.name}`,
    when,
    `Cambiar fecha u hora: ${links.reschedule}`,
    `Cancelar: ${links.cancel}`,
    appt.clinic.maps_url && `Cómo llegar: ${appt.clinic.maps_url}`,
  ]);
  return { subject, html, text };
}

export function renderTimeOffNotice({ appt, links }: { appt: any; links: { reschedule: string } }) {
  const when = fmt(appt.starts_at, appt.clinic.timezone);
  const subject = `Necesitamos reprogramar su cita del ${when}`;
  const bodyHtml = `
<p style="margin:0 0 4px"><strong>${appt.patient.full_name}</strong></p>
<p style="margin:0 0 16px">Por un cambio de horario en la clínica, no podremos atender su cita del <strong>${when}</strong>. Disculpe la molestia.</p>
<p style="margin:0 0 8px">Elija una nueva fecha y hora:</p>
<div>${btn(links.reschedule, "Elegir nueva fecha y hora", true)}</div>`;
  const html = shell({ clinicName: appt.clinic.name, title: "Cambio de horario", bodyHtml, footerNote: whatsappNote(appt) });
  const text = textLines([
    appt.clinic.name,
    "Necesitamos reprogramar su cita",
    `${appt.patient.full_name} — ${appt.type.name}`,
    when,
    `Elegir nueva fecha y hora: ${links.reschedule}`,
  ]);
  return { subject, html, text };
}
