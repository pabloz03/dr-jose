import { supabase } from "@/lib/supabase";

export type TransactionalKind = "booked" | "cancelled" | "rescheduled" | "time_off_notice";

/**
 * Dispara el correo transaccional sin bloquear la UI de la acción que ya
 * tuvo éxito (reservar/cancelar/reprogramar/bloqueo): si el correo falla
 * — por ejemplo, RESEND_API_KEY todavía no está configurado — la cita ya
 * quedó bien en la base y el paciente puede verla en la app. El fallo
 * del correo se audita del lado de la función (notification_log), no
 * aquí.
 */
export function notifyAppointment(kind: TransactionalKind, appointmentId: string): void {
  void supabase.functions.invoke("send-transactional", { body: { kind, appointment_id: appointmentId } }).catch(() => {});
}
