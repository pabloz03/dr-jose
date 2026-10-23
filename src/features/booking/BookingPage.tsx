import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { es } from "@/i18n/es";
import { usePatients } from "@/features/family/queries";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { StepProgress } from "./StepProgress";
import { WizardHeader } from "./WizardHeader";
import { ClinicStep } from "./steps/ClinicStep";
import { PatientStep } from "./steps/PatientStep";
import { TypeStep } from "./steps/TypeStep";
import { DateTimeStep } from "./steps/DateTimeStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import { BookingSuccess } from "./BookingSuccess";
import {
  useAppointmentTypes,
  useBookAppointment,
  useClinics,
  useClinicSettings,
  useDoctor,
  SlotUnavailableError,
  type SlotRow,
} from "./queries";
import type { Tables } from "@/lib/database.types";

type StepIndex = 0 | 1 | 2 | 3 | 4;

export function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [chosenClinicId, setChosenClinicId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [announce, setAnnounce] = useState("");
  const [booked, setBooked] = useState<Tables<"appointments"> | null>(null);

  const clinicsQuery = useClinics();
  const clinics = clinicsQuery.data ?? [];
  // Con una sola clínica activa se autoselecciona sin mostrar nada —
  // mismo comportamiento que antes de soportar varias. Con más de una,
  // el paso ClinicStep (índice 0) le pide al paciente elegir.
  const needsClinicChoice = clinics.length > 1;
  const selectedClinic = clinics.length === 1 ? clinics[0] : (clinics.find((c) => c.id === chosenClinicId) ?? null);
  const clinicId = selectedClinic?.id;

  const doctorQuery = useDoctor(clinicId);
  const settingsQuery = useClinicSettings(clinicId);
  const patientsQuery = usePatients();
  const typesQuery = useAppointmentTypes();
  const bookAppointment = useBookAppointment();

  // Orden "Savia": clínica (si aplica) → tipo → fecha/hora → paciente →
  // confirmar — igual al Figma de referencia (ahí "datos de contacto"
  // también va justo antes de revisar, no al principio).
  const STEP_CLINIC = 0;
  const STEP_TYPE = (needsClinicChoice ? 1 : 0) as StepIndex;
  const STEP_DATETIME = (needsClinicChoice ? 2 : 1) as StepIndex;
  const STEP_PATIENT = (needsClinicChoice ? 3 : 2) as StepIndex;
  const STEP_CONFIRM = (needsClinicChoice ? 4 : 3) as StepIndex;
  const pasos = needsClinicChoice ? [es.reserva.pasoClinica, ...es.reserva.pasos] : es.reserva.pasos;

  function goTo(next: StepIndex) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function goBack() {
    if (step === 0) navigate("/");
    else goTo((step - 1) as StepIndex);
  }

  async function onConfirm() {
    if (!patient || !type || !selectedClinic || !doctorQuery.data || !slot) return;
    try {
      const appointment = await bookAppointment.mutateAsync({
        patientId: patient.id,
        typeId: type.id,
        clinicId: selectedClinic.id,
        doctorId: doctorQuery.data.id,
        start: slot.slot_start,
      });
      setBooked(appointment);
    } catch (error) {
      if (error instanceof SlotUnavailableError) {
        setAnnounce(es.reserva.errorSlotTomado);
        goTo(STEP_DATETIME);
      }
    }
  }

  const patient = patientsQuery.data?.find((p) => p.id === patientId) ?? null;
  const type = typesQuery.data?.find((t) => t.id === typeId) ?? null;

  if (clinicsQuery.isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-6 w-40" />
      </main>
    );
  }

  if (clinicsQuery.isError || clinics.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ErrorState onRetry={() => clinicsQuery.refetch()} />
      </main>
    );
  }

  if (booked && patient && type && selectedClinic) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BookingSuccess appointment={booked} patient={patient} type={type} clinic={selectedClinic} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pb-0 pt-6">
      <WizardHeader
        title={es.reserva.nuevaCita}
        onBack={goBack}
        onClose={() => navigate("/")}
        backLabel={es.reserva.atras}
        closeLabel={es.reserva.cerrarAria}
      />
      <StepProgress current={step} steps={pasos} />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {step === STEP_CLINIC && needsClinicChoice && (
          <ClinicStep
            key="clinic"
            dir={dir}
            clinics={clinics}
            onSelect={(id) => {
              setChosenClinicId(id);
              goTo(STEP_TYPE);
            }}
          />
        )}
        {step === STEP_TYPE && (
          <TypeStep
            key="type"
            dir={dir}
            onSelect={(id) => {
              setTypeId(id);
              goTo(STEP_DATETIME);
            }}
          />
        )}
        {step === STEP_DATETIME && clinicId && doctorQuery.isError && (
          <ErrorState key="datetime-error" onRetry={() => doctorQuery.refetch()} />
        )}
        {step === STEP_DATETIME && clinicId && doctorQuery.data && typeId && (
          <DateTimeStep
            key="datetime"
            dir={dir}
            clinicId={clinicId}
            doctorId={doctorQuery.data.id}
            typeId={typeId}
            confirmLabel={es.reserva.fechaBoton}
            onSelect={(s) => {
              setSlot(s);
              goTo(STEP_PATIENT);
            }}
          />
        )}
        {step === STEP_PATIENT && (
          <PatientStep
            key="patient"
            dir={dir}
            onSelect={(id) => {
              setPatientId(id);
              goTo(STEP_CONFIRM);
            }}
          />
        )}
        {step === STEP_CONFIRM && patient && type && slot && selectedClinic && (
          <ConfirmStep
            key="confirm"
            dir={dir}
            patient={patient}
            type={type}
            doctor={doctorQuery.data ?? undefined}
            clinic={selectedClinic}
            slot={slot}
            minCancelHours={settingsQuery.data?.min_cancel_hours ?? 24}
            maxBookingDays={settingsQuery.data?.max_booking_days ?? 90}
            isPending={bookAppointment.isPending}
            isError={bookAppointment.isError && !(bookAppointment.error instanceof SlotUnavailableError)}
            onConfirm={onConfirm}
            onEditDateTime={() => goTo(STEP_DATETIME)}
            onEditPatient={() => goTo(STEP_PATIENT)}
          />
        )}
      </AnimatePresence>

      <LiveRegion message={announce} assertive />
    </main>
  );
}
