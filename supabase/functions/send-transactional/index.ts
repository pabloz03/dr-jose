// E4-S4: comprobantes de reserva/cancelación/reprogramación y aviso de
// bloqueo. Invocado por la app (POST desde el botón que ya ejecutó la
// mutación — regla 4 de CLAUDE.md: "Acciones de email = POST desde
// botón"), nunca desde un GET. Requiere JWT válido (verify_jwt en el
// despliegue), pero eso solo prueba que ALGÚN usuario autenticado llama
// — no que sea dueño de appointment_id. Antes de notificar (que ya
// corre con service_role y por lo tanto bypassa RLS) se verifica la
// propiedad reconsultando la cita con el JWT del propio llamador: si
// RLS no deja verla (no es su paciente ni es staff), no se notifica.
// Hallazgo real de seguridad (db-reviewer, severidad alta) corregido
// antes de considerar E8-S3 cerrado.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { notifyByKind, type NotifyKind } from "../_shared/notify.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const sbService = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KINDS: NotifyKind[] = ["booked", "cancelled", "rescheduled", "time_off_notice"];
// Sin APP_URL no hay forma correcta de restringir el origen — mejor
// fallar cerrado ("null" no coincide con ningún Origin real) que abrir
// a "*" por accidente si falta el secreto en el despliegue.
const APP_URL = Deno.env.get("APP_URL") ?? "null";
const cors = {
  "Access-Control-Allow-Origin": APP_URL,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: cors });

  let body: { kind?: string; appointment_id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400, headers: cors });
  }

  const { kind, appointment_id } = body;
  if (!kind || !appointment_id || !KINDS.includes(kind as NotifyKind)) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400, headers: cors });
  }

  // Cliente con el JWT del llamador (no service_role): RLS decide si
  // puede ver esta cita (dueño vía guardian_user_id o is_staff()). Si no
  // puede, ni confirmamos ni negamos que exista — mismo "forbidden"
  // genérico que una cita inexistente, para no filtrar nada por timing.
  const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: visible } = await sbUser.from("appointments").select("id").eq("id", appointment_id).maybeSingle();
  if (!visible) return Response.json({ ok: false, error: "forbidden" }, { status: 403, headers: cors });

  const result = await notifyByKind(sbService, kind as NotifyKind, appointment_id);
  return Response.json(result, { headers: cors });
});
