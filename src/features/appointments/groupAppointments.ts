import type { AppointmentWithDetails } from "./queries";

export interface PatientAppointmentGroup {
  patient: AppointmentWithDetails["patient"];
  proximas: AppointmentWithDetails[];
  pasadas: AppointmentWithDetails[];
}

const UPCOMING_STATUSES = new Set(["scheduled", "confirmed"]);

/**
 * Agrupa por paciente; dentro de cada paciente separa próximas (futuras y
 * con estado activo) de pasadas (todo lo demás: ya pasó, o cancelada /
 * reprogramada / completada / no_show sin importar la fecha).
 */
export function groupAppointmentsByPatient(
  appointments: AppointmentWithDetails[],
  now: Date = new Date(),
): PatientAppointmentGroup[] {
  const groups = new Map<string, PatientAppointmentGroup>();

  for (const appt of appointments) {
    let group = groups.get(appt.patient.id);
    if (!group) {
      group = { patient: appt.patient, proximas: [], pasadas: [] };
      groups.set(appt.patient.id, group);
    }
    const isUpcoming = UPCOMING_STATUSES.has(appt.status) && new Date(appt.starts_at) >= now;
    (isUpcoming ? group.proximas : group.pasadas).push(appt);
  }

  for (const group of groups.values()) {
    group.proximas.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    group.pasadas.sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  }

  return [...groups.values()].sort((a, b) => a.patient.full_name.localeCompare(b.patient.full_name));
}
