// deno-lint-ignore-file no-explicit-any
import { newToken } from "./tokens.ts";
import { renderBooked, renderCancelled, renderRescheduled, renderTimeOffNotice } from "./email.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_FROM = Deno.env.get("MAIL_FROM");

export type NotifyKind = "booked" | "cancelled" | "rescheduled" | "time_off_notice";

const APPOINTMENT_SELECT =
  "id,status,starts_at,patient:patient_id(full_name,guardian_user_id,contact_email),type:type_id(name),clinic:clinic_id(name,address,maps_url,whatsapp,timezone)";

async function fetchAppointment(sb: any, id: string) {
  const { data } = await sb.from("appointments").select(APPOINTMENT_SELECT).eq("id", id).maybeSingle();
  return data;
}

export async function resolveRecipient(sb: any, patient: { guardian_user_id: string | null; contact_email: string | null }) {
  if (patient.guardian_user_id) {
    const { data } = await sb.auth.admin.getUserById(patient.guardian_user_id);
    if (data?.user?.email) return data.user.email as string;
  }
  return patient.contact_email ?? null;
}

export async function mintLink(sb: any, appointmentId: string, purpose: "confirm" | "cancel" | "reschedule", expiresAt: string) {
  const { token, hash } = await newToken();
  await sb.from("appointment_tokens").insert({ appointment_id: appointmentId, purpose, token_hash: hash, expires_at: expiresAt });
  return `${APP_URL}/a/${token}`;
}

async function logAndSend(
  sb: any,
  params: { appointment_id: string; kind: NotifyKind; to: string | null; subject?: string; html?: string; text?: string },
) {
  const { appointment_id, kind, to } = params;
  if (!to) {
    await sb
      .from("notification_log")
      .insert({ appointment_id, kind, to_email: "sin_correo", status: "failed", error: "patient_without_email" });
    return { ok: false, reason: "patient_without_email" };
  }
  if (!RESEND_API_KEY) {
    await sb
      .from("notification_log")
      .insert({ appointment_id, kind, to_email: to, status: "failed", error: "RESEND_API_KEY no configurado" });
    return { ok: false, reason: "email_not_configured" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to, subject: params.subject, html: params.html, text: params.text }),
  });
  const body = await r.json().catch(() => ({}));
  await sb.from("notification_log").insert({
    appointment_id,
    kind,
    to_email: to,
    provider_id: body.id ?? null,
    status: r.ok ? "sent" : "failed",
    error: r.ok ? null : JSON.stringify(body),
  });
  return { ok: r.ok };
}

/** Punto único de envío transaccional, usado por send-transactional (POST desde la app) y por appointment-action (tras una acción vía token). Nunca se llama desde un GET. */
export async function notifyByKind(sb: any, kind: NotifyKind, appointmentId: string) {
  const appt = await fetchAppointment(sb, appointmentId);
  if (!appt) return { ok: false, reason: "appointment_not_found" };
  const to = await resolveRecipient(sb, appt.patient);
  const expires = appt.starts_at as string;

  if (kind === "cancelled") {
    const { subject, html, text } = renderCancelled({ appt });
    return logAndSend(sb, { appointment_id: appointmentId, kind, to, subject, html, text });
  }

  if (kind === "booked" || kind === "rescheduled") {
    const [cancel, reschedule] = await Promise.all([
      mintLink(sb, appointmentId, "cancel", expires),
      mintLink(sb, appointmentId, "reschedule", expires),
    ]);
    const { subject, html, text } =
      kind === "booked" ? renderBooked({ appt, links: { cancel, reschedule } }) : renderRescheduled({ appt, links: { cancel, reschedule } });
    return logAndSend(sb, { appointment_id: appointmentId, kind, to, subject, html, text });
  }

  if (kind === "time_off_notice") {
    const reschedule = await mintLink(sb, appointmentId, "reschedule", expires);
    const { subject, html, text } = renderTimeOffNotice({ appt, links: { reschedule } });
    return logAndSend(sb, { appointment_id: appointmentId, kind, to, subject, html, text });
  }

  return { ok: false, reason: "unknown_kind" };
}
