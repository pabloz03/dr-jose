// E4-S4: comprobantes de reserva/cancelación/reprogramación y aviso de
// bloqueo. Invocado por la app (POST desde el botón que ya ejecutó la
// mutación — regla 4 de CLAUDE.md: "Acciones de email = POST desde
// botón"), nunca desde un GET. Requiere JWT válido (verify_jwt en el
// despliegue) para que solo la app autenticada lo dispare, no cualquiera
// en internet.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { notifyByKind, type NotifyKind } from "../_shared/notify.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KINDS: NotifyKind[] = ["booked", "cancelled", "rescheduled", "time_off_notice"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  let body: { kind?: string; appointment_id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { kind, appointment_id } = body;
  if (!kind || !appointment_id || !KINDS.includes(kind as NotifyKind)) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = await notifyByKind(sb, kind as NotifyKind, appointment_id);
  return Response.json(result);
});
