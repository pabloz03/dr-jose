import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { es } from "@/i18n/es";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { StepProgress } from "@/features/booking/StepProgress";
import type { SlotRow } from "@/features/booking/queries";
import type { GuestDatosValues } from "./schemas";
import { DatosStep } from "./DatosStep";
import { GuestClinicStep } from "./GuestClinicStep";
import { GuestTypeStep } from "./GuestTypeStep";
import { GuestDateTimeStep } from "./GuestDateTimeStep";
import { GuestConfirmStep } from "./GuestConfirmStep";
import { GuestBookingSuccess } from "./GuestBookingSuccess";
import { useGuestOptions, useGuestBook, GuestBookingError, type GuestClinic } from "./queries";

type StepIndex = 0 | 1 | 2 | 3 | 4;

export function GuestBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [chosenClinicId, setChosenClinicId] = useState<string | null>(null);
  const [datos, setDatos] = useState<GuestDatosValues | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const optionsQuery = useGuestOptions(chosenClinicId ?? undefined);
  const bookGuest = useGuestBook();
  // El edge function devuelve `clinics` (sin doctor/tipos/settings
  // todavía) cuando hay más de una clínica activa y no se ha elegido
  // ninguna — mismo patrón que BookingPage.tsx (sesión con cuenta).
  // OJO: esto se fija UNA SOLA VEZ con la primera respuesta resuelta,
  // no se recalcula en cada render — si dependiera de `chosenClinicId`
  // directamente, el mapeo de índices de paso cambiaría de golpe apenas
  // se elige una clínica (STEP_DATOS pasa de 1 a 0) mientras `step`
  // (estado de React) sigue en el valor anterior, saltándose el paso
  // "Sus datos" en silencio. BookingPage.tsx (con sesión) no tiene este
  // riesgo porque ahí `needsClinicChoice` depende de `clinics.length`,
  // un valor que no cambia al elegir una clínica.
  // Se fija una sola vez, con el patrón oficial de React para "derivar
  // estado de datos que llegan async sin un efecto" (set-state
  // condicional directo en el render, no dentro de un efecto — React
  // descarta ese render a medio hacer y vuelve a renderizar antes de
  // confirmar, así que nunca es visible). La lista de clínicas solo
  // viene en la respuesta "sin elegir todavía"; se guarda aparte para
  // que "Atrás" pueda volver a mostrar las opciones sin quedarse con
  // una lista vacía una vez elegida una.
  const [hasClinicStep, setHasClinicStep] = useState<boolean | null>(null);
  const [cachedClinics, setCachedClinics] = useState<GuestClinic[]>([]);
  if (hasClinicStep === null && optionsQuery.data?.ok) {
    setHasClinicStep(!!optionsQuery.data.clinics);
    if (optionsQuery.data.clinics) setCachedClinics(optionsQuery.data.clinics);
  }
  const needsClinicChoice = hasClinicStep === true;

  const STEP_CLINIC = 0;
  const STEP_DATOS = (needsClinicChoice ? 1 : 0) as StepIndex;
  const STEP_TYPE = (needsClinicChoice ? 2 : 1) as StepIndex;
  const STEP_DATETIME = (needsClinicChoice ? 3 : 2) as StepIndex;
  const STEP_CONFIRM = (needsClinicChoice ? 4 : 3) as StepIndex;
  const pasos = needsClinicChoice
    ? [es.reservaInvitado.pasoClinica, ...es.reservaInvitado.pasos]
    : es.reservaInvitado.pasos;

  function goTo(next: StepIndex) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  async function onConfirm() {
    if (!datos || !type || !clinic || !doctor || !slot) return;
    try {
      const result = await bookGuest.mutateAsync({
        fullName: datos.full_name,
        contactEmail: datos.contact_email,
        typeId: type.id,
        clinicId: clinic.id,
        doctorId: doctor.id,
        start: slot.slot_start,
        website: datos.website,
      });
      setAppointmentId(result.appointment_id ?? null);
    } catch (error) {
      // slot_unavailable es la única causa por la que ya no tiene
      // sentido quedarse en Confirmar — el horario elegido ya no existe,
      // hay que volver a elegir uno. Los demás errores (rate_limited,
      // invalid_input, genérico) se muestran en el propio paso de
      // Confirmar (ver GuestConfirmStep), sin navegar.
      if (error instanceof GuestBookingError && error.code === "slot_unavailable") {
        setAnnounce(es.reservaInvitado.errorSlotTomado);
        goTo(STEP_DATETIME);
      }
    }
  }

  const clinic = optionsQuery.data?.clinic ?? null;
  const doctor = optionsQuery.data?.doctor ?? null;
  const type = (optionsQuery.data?.types ?? []).find((t) => t.id === typeId) ?? null;
  const settings = optionsQuery.data?.settings ?? { min_cancel_hours: 24, max_booking_days: 90 };

  if (optionsQuery.isLoading || !optionsQuery.data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-6 w-40" />
      </main>
    );
  }

  if (!optionsQuery.data.ok || (!needsClinicChoice && (!clinic || !doctor))) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger" role="alert">
          {es.reservaInvitado.errorGenerico}
        </p>
      </main>
    );
  }

  if (appointmentId && datos && type && clinic) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <GuestBookingSuccess
          appointmentId={appointmentId}
          fullName={datos.full_name}
          contactEmail={datos.contact_email}
          type={type}
          clinic={clinic}
          slot={slot!}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-2xl text-ink">{es.reservaInvitado.titulo}</h1>
      <StepProgress current={step} steps={pasos} label={es.reservaInvitado.titulo} />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {step === STEP_CLINIC && needsClinicChoice && (
          <GuestClinicStep
            key="clinic"
            dir={dir}
            clinics={cachedClinics}
            onSelect={(id) => {
              setChosenClinicId(id);
              goTo(STEP_DATOS);
            }}
          />
        )}
        {step === STEP_DATOS && (
          <DatosStep
            key="datos"
            dir={dir}
            defaultValues={datos ?? { full_name: "", contact_email: "", website: "" }}
            onContinue={(values) => {
              setDatos(values);
              goTo(STEP_TYPE);
            }}
          />
        )}
        {step === STEP_TYPE && (
          <GuestTypeStep
            key="type"
            dir={dir}
            types={optionsQuery.data.types ?? []}
            isLoading={false}
            onSelect={(id) => {
              setTypeId(id);
              goTo(STEP_DATETIME);
            }}
          />
        )}
        {step === STEP_DATETIME && typeId && clinic && doctor && (
          <GuestDateTimeStep
            key="datetime"
            dir={dir}
            clinicId={clinic.id}
            doctorId={doctor.id}
            typeId={typeId}
            settings={settings}
            onSelect={(s) => {
              setSlot(s);
              goTo(STEP_CONFIRM);
            }}
          />
        )}
        {step === STEP_CONFIRM && datos && type && slot && clinic && (
          <GuestConfirmStep
            key="confirm"
            dir={dir}
            fullName={datos.full_name}
            contactEmail={datos.contact_email}
            type={type}
            clinic={clinic}
            slot={slot}
            minCancelHours={settings.min_cancel_hours}
            maxBookingDays={settings.max_booking_days}
            isPending={bookGuest.isPending}
            errorCode={
              bookGuest.error instanceof GuestBookingError
                ? bookGuest.error.code
                : bookGuest.isError
                  ? "error_generico"
                  : null
            }
            onConfirm={onConfirm}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => (step === 0 ? navigate("/ingresar") : goTo((step - 1) as StepIndex))}
        className="inline-flex min-h-tap items-center gap-1.5 self-start text-sm text-accent underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {es.reserva.atras}
      </button>
      <LiveRegion message={announce} assertive />
    </main>
  );
}
