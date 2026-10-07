// E4-S3: aterrizaje de /a/:token. Sin sesión de usuario (el token es la
// credencial) — desplegado con verify_jwt=false. "peek" (ver detalle) no
// muta nunca, ni siquiera si un escáner de correo lo pre-carga; solo
// "execute" (disparado por un botón, POST) cambia estado. Para
// reprogramar, "slots" expone get_available_slots sin requerir sesión,
// validado igual por el token.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sha256hex } from "../_shared/tokens.ts";
import { notifyByKind } from "../_shared/notify.ts";
import { clinicISODate } from "../_shared/tz.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// Autorización real acá es por posesión del token, no por origen, pero
// sin APP_URL es mejor fallar cerrado ("null" no coincide con ningún
// Origin real) que abrir a "*" por accidente si falta el secreto.
const APP_URL = Deno.env.get("APP_URL") ?? "null";
const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  // supabase-js agrega apikey/authorization/x-client-info a toda llamada
  // de functions.invoke, aunque la función no requiera JWT — sin esto el
  // preflight del navegador rechaza la petición antes de que llegue acá
  // (encontrado con una prueba real contra Vercel, no solo localmente).
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const TOKEN_SELECT =
  "id,purpose,expires_at,used_at,appointment:appointment_id(id,status,starts_at,doctor_id,clinic_id,type_id,type:type_id(name,duration_min),clinic:clinic_id(name,address,maps_url,timezone),patient:patient_id(full_name))";

async function lookupToken(token: string) {
  const hash = await sha256hex(token);
  const { data } = await sb.from("appointment_tokens").select(TOKEN_SELECT).eq("token_hash", hash).maybeSingle();
  return data;
}

// deno-lint-ignore no-explicit-any
function isExpired(t: any) {
  return !!t.used_at || new Date(t.expires_at) < new Date() || !["scheduled", "confirmed"].includes(t.appointment.status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405, headers: cors });

  // El cuerpo de la respuesta siempre lleva { ok, error? } con status 200
  // — los fallos de negocio (token caducado, too_late, slot_unavailable)
  // no son errores de transporte; dejamos el status HTTP distinto de 200
  // solo para method_not_allowed, que sí es un error de transporte.
  let body: { token?: string; mode?: string; new_start?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { headers: cors });
  }

  const { token, mode, new_start } = body;
  if (!token) return Response.json({ ok: false, error: "bad_request" }, { headers: cors });

  const t = await lookupToken(token);
  if (!t) return Response.json({ ok: false, error: "invalid_or_expired" }, { headers: cors });
  if (isExpired(t)) {
    return Response.json({ ok: false, error: "invalid_or_expired", purpose: t.purpose }, { headers: cors });
  }

  if (!mode || mode === "peek") {
    // Solo lectura — seguro incluso si un escáner de correo pre-carga este enlace.
    return Response.json({ ok: true, purpose: t.purpose, appointment: t.appointment }, { headers: cors });
  }

  if (mode === "slots") {
    if (t.purpose !== "reschedule") {
      return Response.json({ ok: false, error: "wrong_purpose" }, { headers: cors });
    }
    // clinicISODate, no toISOString().slice(0,10): entre las 18:00 y las
    // 23:59 hora de Guatemala (UTC-6), la fecha UTC ya es la de mañana —
    // usar UTC acá excluiría del selector los cupos de esta misma noche.
    const from = clinicISODate();
    // Guatemala es UTC-6 fijo todo el año (sin DST): sumar milisegundos
    // para una ventana de 30 días es seguro acá — no lo sería en una
    // zona con DST.
    const to = clinicISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const { data, error } = await sb.rpc("get_available_slots", {
      p_clinic: t.appointment.clinic_id,
      p_doctor: t.appointment.doctor_id,
      p_type: t.appointment.type_id,
      p_from: from,
      p_to: to,
    });
    if (error) return Response.json({ ok: false, error: error.message }, { headers: cors });
    return Response.json({ ok: true, slots: data }, { headers: cors });
  }

  if (mode === "execute") {
    let result;
    if (t.purpose === "confirm") {
      const { data, error } = await sb.rpc("token_confirm_appointment", { p_id: t.appointment.id });
      if (error) return Response.json({ ok: false, error: error.message }, { headers: cors });
      result = data;
    } else if (t.purpose === "cancel") {
      const { data, error } = await sb.rpc("token_cancel_appointment", {
        p_id: t.appointment.id,
        p_reason: "Cancelada por el paciente (enlace de correo)",
      });
      if (error) return Response.json({ ok: false, error: error.message }, { headers: cors });
      result = data;
      await notifyByKind(sb, "cancelled", t.appointment.id);
    } else if (t.purpose === "reschedule") {
      if (!new_start) return Response.json({ ok: false, error: "missing_new_start" }, { headers: cors });
      const { data, error } = await sb.rpc("token_reschedule_appointment", {
        p_id: t.appointment.id,
        p_new_start: new_start,
      });
      if (error) return Response.json({ ok: false, error: error.message }, { headers: cors });
      result = data;
      await notifyByKind(sb, "rescheduled", result.id);
    } else {
      return Response.json({ ok: false, error: "unknown_purpose" }, { headers: cors });
    }

    await sb.from("appointment_tokens").update({ used_at: new Date().toISOString() }).eq("id", t.id);
    await sb.from("audit_log").insert({ actor_type: "patient", action: `email_${t.purpose}`, entity: "appointment", entity_id: t.appointment.id });
    return Response.json({ ok: true, purpose: t.purpose, appointment: result }, { headers: cors });
  }

  return Response.json({ ok: false, error: "bad_mode" }, { headers: cors });
});
