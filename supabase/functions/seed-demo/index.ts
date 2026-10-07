// Herramienta de un solo uso para crear las cuentas demo (paciente +
// doctor) que pidió el usuario para probar la app ya desplegada. No es
// parte del backlog del handoff — se agrega, se usa una vez y se
// neutraliza (no hay forma de borrar una Edge Function vía MCP, así
// que después de usarla se reemplaza su contenido por un stub inerte).
// Gateada por el mismo CRON_SECRET que ya existe, para no introducir
// un secreto nuevo solo para esto.
//
// Los user_id de abajo ya existen (confirmados por SQL directo) — un
// intento anterior de esta misma función dejó creados ambos usuarios
// limpios en auth.users. admin.listUsers() no los encontraba de forma
// confiable para hacer "crear solo si no existe" (SDK/entorno de Edge
// Function, no reproducido localmente), así que se referencian
// directamente por id en vez de buscarlos cada vez.
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const DOCTOR_STAFF_ID = "6c7ac772-fc6c-4b47-bbee-6d95ca1c704e";
const DOCTOR_USER_ID = "e17eec4f-0a0e-414b-8a0e-4a3542195cfa";
const PATIENT_USER_ID = "e04f5cf7-114d-40bc-b965-a5a0400f93cb";
const CLINIC_ID = "00000000-0000-0000-0000-000000000001";
const DOCTOR_ID_FOR_SLOTS = DOCTOR_STAFF_ID;
const TYPE_ID = "6cfd0882-c754-4b4b-8e50-bf594eeebcd7"; // Control, 20 min

const DOCTOR_EMAIL = "doctor.demo@example.com";
const PATIENT_EMAIL = "paciente.demo@example.com";

async function otpFor(email: string) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "https://dr-jose-tan.vercel.app/" },
  });
  if (error) throw error;
  return { otp: data.properties.email_otp as string, link: data.properties.action_link as string };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  await sb.from("staff").update({ user_id: DOCTOR_USER_ID, full_name: "Dr. Demo" }).eq("id", DOCTOR_STAFF_ID);
  const doctorAuth = await otpFor(DOCTOR_EMAIL);

  const { data: existingPatientRow } = await sb
    .from("patients")
    .select("id")
    .eq("guardian_user_id", PATIENT_USER_ID)
    .eq("is_self", true)
    .maybeSingle();
  const patientId =
    existingPatientRow?.id ??
    (
      await sb
        .from("patients")
        .insert({ guardian_user_id: PATIENT_USER_ID, full_name: "Paciente Demo", is_self: true })
        .select("id")
        .single()
    ).data!.id;
  await sb
    .from("profiles")
    .upsert({ user_id: PATIENT_USER_ID, full_name: "Paciente Demo", privacy_consent_at: new Date().toISOString() });
  const patientAuth = await otpFor(PATIENT_EMAIL);

  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: slots } = await sb.rpc("get_available_slots", {
    p_clinic: CLINIC_ID,
    p_doctor: DOCTOR_ID_FOR_SLOTS,
    p_type: TYPE_ID,
    p_from: from,
    p_to: to,
  });
  const { count: existingApptCount } = await sb
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("status", ["scheduled", "confirmed"]);
  let appointmentCreated = (existingApptCount ?? 0) > 0;
  if (!appointmentCreated && slots && slots.length > 0) {
    const slot = slots[0];
    const { error: apptError } = await sb.from("appointments").insert({
      clinic_id: CLINIC_ID,
      doctor_id: DOCTOR_ID_FOR_SLOTS,
      patient_id: patientId,
      type_id: TYPE_ID,
      starts_at: slot.slot_start,
      ends_at: slot.slot_end,
      status: "scheduled",
      source: "patient",
      created_by: PATIENT_USER_ID,
    });
    appointmentCreated = !apptError;
  }

  return Response.json({
    doctor: { email: DOCTOR_EMAIL, ...doctorAuth },
    patient: { email: PATIENT_EMAIL, ...patientAuth },
    appointmentCreated,
  });
});
