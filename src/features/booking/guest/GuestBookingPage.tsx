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
import { GuestTypeStep } from "./GuestTypeStep";
import { GuestDateTimeStep } from "./GuestDateTimeStep";
import { GuestConfirmStep } from "./GuestConfirmStep";
import { GuestBookingSuccess } from "./GuestBookingSuccess";
import { useGuestOptions, useGuestBook, GuestBookingError } from "./queries";

type StepIndex = 0 | 1 | 2 | 3;

export function GuestBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [datos, setDatos] = useState<GuestDatosValues | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const optionsQuery = useGuestOptions();
  const bookGuest = useGuestBook();

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
        goTo(2);
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

  if (!optionsQuery.data.ok || !clinic || !doctor) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger" role="alert">
          {es.reservaInvitado.errorGenerico}
        </p>
      </main>
    );
  }

  if (appointmentId && datos && type) {
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
      <StepProgress current={step} steps={es.reservaInvitado.pasos} label={es.reservaInvitado.titulo} />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {step === 0 && (
          <DatosStep
            key="datos"
            dir={dir}
            defaultValues={datos ?? { full_name: "", contact_email: "", website: "" }}
            onContinue={(values) => {
              setDatos(values);
              goTo(1);
            }}
          />
        )}
        {step === 1 && (
          <GuestTypeStep
            key="type"
            dir={dir}
            types={optionsQuery.data.types ?? []}
            isLoading={false}
            onSelect={(id) => {
              setTypeId(id);
              goTo(2);
            }}
          />
        )}
        {step === 2 && typeId && (
          <GuestDateTimeStep
            key="datetime"
            dir={dir}
            clinicId={clinic.id}
            doctorId={doctor.id}
            typeId={typeId}
            settings={settings}
            onSelect={(s) => {
              setSlot(s);
              goTo(3);
            }}
          />
        )}
        {step === 3 && datos && type && slot && (
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
