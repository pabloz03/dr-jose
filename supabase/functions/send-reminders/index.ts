// E4-S1: recordatorio 24h, invocado por pg_cron cada 15 min (0004_cron.sql)
// con el secreto en el header x-cron-secret. Idempotente porque
// due_reminders() solo devuelve citas con reminder_sent_at is null, y
// aquí marcamos reminder_sent_at tras el envío exitoso — una cita sin
// email registrado queda en notification_log como 'failed' sin romper
// el resto del lote (continue, no throw).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { mintLink, resolveRecipient } from "../_shared/notify.ts";
import { renderReminder } from "../_shared/email.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MAIL_FROM = Deno.env.get("MAIL_FROM");

const APPOINTMENT_SELECT =
  "id,status,starts_at,patient:patient_id(full_name,guardian_user_id,contact_email),type:type_id(name),clinic:clinic_id(name,address,maps_url,whatsapp,timezone)";

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: due, error } = await sb.rpc("due_reminders");
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  let failed = 0;

  for (const { appointment_id } of due ?? []) {
    const { data: appt } = await sb.from("appointments").select(APPOINTMENT_SELECT).eq("id", appointment_id).maybeSingle();
    if (!appt) continue;

    const to = await resolveRecipient(sb, appt.patient);
    if (!to) {
      await sb.from("notification_log").insert({
        appointment_id,
        kind: "reminder_24h",
        to_email: "sin_correo",
        status: "failed",
        error: "patient_without_email",
      });
      failed++;
      continue;
    }

    const confirmed = appt.status === "confirmed";
    const expires = appt.starts_at as string;
    const [reschedule, cancel, confirm] = await Promise.all([
      mintLink(sb, appointment_id, "reschedule", expires),
      mintLink(sb, appointment_id, "cancel", expires),
      confirmed ? Promise.resolve(undefined) : mintLink(sb, appointment_id, "confirm", expires),
    ]);
    const { subject, html, text } = renderReminder({ appt, links: { confirm, reschedule, cancel } });

    if (!RESEND_API_KEY) {
      await sb.from("notification_log").insert({
        appointment_id,
        kind: "reminder_24h",
        to_email: to,
        status: "failed",
        error: "RESEND_API_KEY no configurado",
      });
      failed++;
      continue;
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, html, text }),
    });
    const body = await r.json().catch(() => ({}));
    await sb.from("notification_log").insert({
      appointment_id,
      kind: "reminder_24h",
      to_email: to,
      provider_id: body.id ?? null,
      status: r.ok ? "sent" : "failed",
      error: r.ok ? null : JSON.stringify(body),
    });
    if (r.ok) {
      await sb.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appointment_id);
      sent++;
    } else {
      failed++;
    }
  }

  return Response.json({ sent, failed, total: (due ?? []).length });
});
