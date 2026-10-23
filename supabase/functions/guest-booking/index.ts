// E9: reservar sin sesión ni código OTP. Mismo esqueleto que
// appointment-action (desplegada con verify_jwt=false, CORS atado a
// APP_URL, siempre {ok, error?} con status 200 salvo método no
// permitido) porque el problema es idéntico: un visitante sin JWT
// necesita leer datos hoy restringidos a `authenticated` (clinics,
// clinic_staff, appointment_types, clinic_settings — ver
// 0002_rls.sql) y escribir una cita nueva. En vez de abrir esas
// tablas a `anon`, esta función hace todo con el service role y
// decide ella misma qué expone.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { notifyByKind } from "../_shared/notify.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_URL = Deno.env.get("APP_URL") ?? "null";

// Además del dominio real (APP_URL), se refleja el origen cuando es un
// deploy de Vercel de este mismo proyecto (preview o el alias de
// producción) — para poder probar la rama UI2 ahí mientras no se
// publica a APP_URL. Nunca se refleja ningún otro origen.
function isAllowedVercelPreview(origin: string): boolean {
  return origin.endsWith(".vercel.app") && origin.includes("dr-jose");
}

function corsFor(origin: string | null) {
  const allowOrigin = origin && (origin === APP_URL || isAllowedVercelPreview(origin)) ? origin : APP_URL;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function getOptions(clinicId?: string) {
  const { data: activeClinics } = await sb
    .from("clinics")
    .select("id,name,address,maps_url,timezone")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (!activeClinics || activeClinics.length === 0) return { ok: false, error: "no_clinic" };

  // Con una sola clínica activa se autoselecciona (mismo comportamiento
  // que cuando solo existía una). Con más de una, si todavía no llega
  // clinic_id, se devuelve la lista para que el cliente muestre un paso
  // de selección antes de resolver doctor/tipos/settings.
  let clinic;
  if (activeClinics.length === 1) {
    clinic = activeClinics[0];
  } else if (clinicId) {
    clinic = activeClinics.find((c) => c.id === clinicId);
    if (!clinic) return { ok: false, error: "no_clinic" };
  } else {
    return { ok: true, clinics: activeClinics };
  }

  const [{ data: staffRows }, { data: settings }, { data: types }] = await Promise.all([
    sb.from("clinic_staff").select("staff:staff_id(id, full_name, role)").eq("clinic_id", clinic.id),
    sb.from("clinic_settings").select("min_cancel_hours,max_booking_days").eq("clinic_id", clinic.id).maybeSingle(),
    sb.from("appointment_types").select("id,name,duration_min").eq("is_active", true).eq("bookable_online", true).order("sort", { ascending: true }),
  ]);
  // deno-lint-ignore no-explicit-any
  const doctor = (staffRows ?? []).map((r: any) => r.staff).find((s: any) => s?.role === "doctor");
  if (!doctor) return { ok: false, error: "no_doctor" };

  return {
    ok: true,
    clinic,
    doctor: { id: doctor.id, full_name: doctor.full_name },
    types: types ?? [],
    settings: settings ?? { min_cancel_hours: 24, max_booking_days: 90 },
  };
}

async function getSlots(clinicId: string, doctorId: string, typeId: string, from: string, to: string) {
  const { data, error } = await sb.rpc("get_available_slots", {
    p_clinic: clinicId,
    p_doctor: doctorId,
    p_type: typeId,
    p_from: from,
    p_to: to,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, slots: data };
}

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405, headers: cors });

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { headers: cors });
  }

  const mode = body?.mode;

  if (mode === "options") {
    return Response.json(await getOptions(body?.clinic_id), { headers: cors });
  }

  if (mode === "slots") {
    const { clinic_id, doctor_id, type_id, from, to } = body;
    if (!clinic_id || !doctor_id || !type_id || !from || !to) {
      return Response.json({ ok: false, error: "bad_request" }, { headers: cors });
    }
    return Response.json(await getSlots(clinic_id, doctor_id, type_id, from, to), { headers: cors });
  }

  if (mode === "book") {
    const { full_name, contact_email, type_id, clinic_id, doctor_id, start, website } = body;
    // Honeypot: un campo oculto que ningún usuario real llena. Si llega
    // con contenido, es un bot — se responde éxito falso sin tocar la
    // base, para no delatar el mecanismo con un error distinto.
    if (website) return Response.json({ ok: true, appointment_id: "ok" }, { headers: cors });

    if (
      typeof full_name !== "string" || full_name.trim().length < 2 ||
      typeof contact_email !== "string" || !EMAIL_RE.test(contact_email.trim()) ||
      !type_id || !clinic_id || !doctor_id || !start
    ) {
      return Response.json({ ok: false, error: "invalid_input" }, { headers: cors });
    }

    const { data, error } = await sb.rpc("guest_book_appointment", {
      p_full_name: full_name,
      p_contact_email: contact_email,
      p_type: type_id,
      p_clinic: clinic_id,
      p_doctor: doctor_id,
      p_start: start,
    });
    if (error) {
      const known = ["invalid_input", "rate_limited", "slot_unavailable"];
      const reason = known.find((k) => error.message.includes(k)) ?? "error_generico";
      return Response.json({ ok: false, error: reason }, { headers: cors });
    }

    await notifyByKind(sb, "booked", data.id);
    return Response.json({ ok: true, appointment_id: data.id }, { headers: cors });
  }

  return Response.json({ ok: false, error: "bad_mode" }, { headers: cors });
});
