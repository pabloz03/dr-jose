import { describe, expect, it } from "vitest";
import { groupAppointmentsByPatient } from "@/features/appointments/groupAppointments";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

function makeAppt(overrides: Partial<AppointmentWithDetails>): AppointmentWithDetails {
  return {
    id: overrides.id ?? "a1",
    clinic_id: "clinic1",
    doctor_id: "doctor1",
    patient_id: overrides.patient?.id ?? "p1",
    type_id: "type1",
    starts_at: "2026-06-01T15:00:00.000Z",
    ends_at: "2026-06-01T15:30:00.000Z",
    status: "scheduled",
    source: "patient",
    created_by: null,
    rescheduled_from: null,
    cancel_reason: null,
    confirmed_at: null,
    cancelled_at: null,
    reminder_sent_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    patient: { id: "p1", full_name: "Ana", is_self: true },
    type: { id: "type1", name: "Control", duration_min: 20 },
    clinic: { id: "clinic1", name: "Clínica", address: null, maps_url: null, phone: null, whatsapp: null, timezone: "America/Guatemala" },
    ...overrides,
  };
}

const NOW = new Date("2026-05-01T00:00:00.000Z");

describe("groupAppointmentsByPatient", () => {
  it("separa próximas (futuras + activas) de pasadas", () => {
    const future = makeAppt({ id: "future", starts_at: "2026-06-01T15:00:00.000Z", status: "scheduled" });
    const past = makeAppt({ id: "past", starts_at: "2026-01-01T15:00:00.000Z", status: "completed" });
    const groups = groupAppointmentsByPatient([future, past], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.proximas.map((a) => a.id)).toEqual(["future"]);
    expect(groups[0]!.pasadas.map((a) => a.id)).toEqual(["past"]);
  });

  it("una cita futura pero cancelada va a pasadas, no a próximas", () => {
    const cancelledFuture = makeAppt({ id: "c1", starts_at: "2026-06-01T15:00:00.000Z", status: "cancelled" });
    const groups = groupAppointmentsByPatient([cancelledFuture], NOW);
    expect(groups[0]!.proximas).toHaveLength(0);
    expect(groups[0]!.pasadas.map((a) => a.id)).toEqual(["c1"]);
  });

  it("agrupa por paciente y ordena los grupos por nombre", () => {
    const zoe = makeAppt({ id: "z1", patient: { id: "pz", full_name: "Zoe", is_self: false } });
    const ana = makeAppt({ id: "a1", patient: { id: "pa", full_name: "Ana", is_self: true } });
    const groups = groupAppointmentsByPatient([zoe, ana], NOW);
    expect(groups.map((g) => g.patient.full_name)).toEqual(["Ana", "Zoe"]);
  });

  it("ordena próximas ascendente y pasadas descendente", () => {
    const soon = makeAppt({ id: "soon", starts_at: "2026-06-01T15:00:00.000Z" });
    const later = makeAppt({ id: "later", starts_at: "2026-07-01T15:00:00.000Z" });
    const groups = groupAppointmentsByPatient([later, soon], NOW);
    expect(groups[0]!.proximas.map((a) => a.id)).toEqual(["soon", "later"]);
  });
});
