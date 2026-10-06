import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { es } from "@/i18n/es";
import { usePatients } from "@/features/family/queries";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { StepProgress } from "./StepProgress";
import { PatientStep } from "./steps/PatientStep";
import { TypeStep } from "./steps/TypeStep";
import { DateTimeStep } from "./steps/DateTimeStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import { BookingSuccess } from "./BookingSuccess";
import {
  useAppointmentTypes,
  useBookAppointment,
  useClinic,
  useClinicSettings,
  useDoctor,
  SlotUnavailableError,
  type SlotRow,
} from "./queries";
import type { Tables } from "@/lib/database.types";

type StepIndex = 0 | 1 | 2 | 3;

export function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [announce, setAnnounce] = useState("");
  const [booked, setBooked] = useState<Tables<"appointments"> | null>(null);

  const clinicQuery = useClinic();
  const clinicId = clinicQuery.data?.id;
  const doctorQuery = useDoctor(clinicId);
  const settingsQuery = useClinicSettings(clinicId);
  const patientsQuery = usePatients();
  const typesQuery = useAppointmentTypes();
  const bookAppointment = useBookAppointment();

  function goTo(next: StepIndex) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  async function onConfirm() {
    if (!patient || !type || !clinicQuery.data || !doctorQuery.data || !slot) return;
    try {
      const appointment = await bookAppointment.mutateAsync({
        patientId: patient.id,
        typeId: type.id,
        clinicId: clinicQuery.data.id,
        doctorId: doctorQuery.data.id,
        start: slot.slot_start,
      });
      setBooked(appointment);
    } catch (error) {
      if (error instanceof SlotUnavailableError) {
        setAnnounce(es.reserva.errorSlotTomado);
        goTo(2);
      }
    }
  }

  const patient = patientsQuery.data?.find((p) => p.id === patientId) ?? null;
  const type = typesQuery.data?.find((t) => t.id === typeId) ?? null;

  if (clinicQuery.isLoading || !clinicQuery.data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      </main>
    );
  }

  if (booked && patient && type) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BookingSuccess appointment={booked} patient={patient} type={type} clinic={clinicQuery.data} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">{es.reserva.titulo}</h1>
      <StepProgress current={step} />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {step === 0 && (
          <PatientStep
            key="patient"
            dir={dir}
            onSelect={(id) => {
              setPatientId(id);
              goTo(1);
            }}
          />
        )}
        {step === 1 && (
          <TypeStep
            key="type"
            dir={dir}
            onSelect={(id) => {
              setTypeId(id);
              goTo(2);
            }}
          />
        )}
        {step === 2 && clinicId && doctorQuery.data && typeId && (
          <DateTimeStep
            key="datetime"
            dir={dir}
            clinicId={clinicId}
            doctorId={doctorQuery.data.id}
            typeId={typeId}
            onSelect={(s) => {
              setSlot(s);
              goTo(3);
            }}
          />
        )}
        {step === 3 && patient && type && slot && (
          <ConfirmStep
            key="confirm"
            dir={dir}
            patient={patient}
            type={type}
            clinic={clinicQuery.data}
            slot={slot}
            minCancelHours={settingsQuery.data?.min_cancel_hours ?? 24}
            maxBookingDays={settingsQuery.data?.max_booking_days ?? 90}
            isPending={bookAppointment.isPending}
            isError={bookAppointment.isError && !(bookAppointment.error instanceof SlotUnavailableError)}
            onConfirm={onConfirm}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => (step === 0 ? navigate("/") : goTo((step - 1) as StepIndex))}
        className="self-start text-sm text-accent underline"
      >
        {es.reserva.atras}
      </button>

      <LiveRegion message={announce} assertive />
    </main>
  );
}
