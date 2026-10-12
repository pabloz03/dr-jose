import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarPlus,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong } from "@/lib/tz";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LiveRegion } from "@/components/ui/LiveRegion";
import {
  useAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
  TooLateError,
  SlotUnavailableError,
} from "./queries";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { RescheduleSheet } from "./RescheduleSheet";
import { CancelDialog } from "./CancelDialog";
import type { SlotRow } from "@/features/booking/queries";

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`;
}

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const [tooLate, setTooLate] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const appointmentQuery = useAppointment(id);
  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const appointment = appointmentQuery.data;

  async function onConfirm() {
    if (!appointment) return;
    try {
      await confirmAppointment.mutateAsync(appointment.id);
      setAnnounce(es.citas.confirmadaOk);
    } catch {
      setAnnounce(es.citas.errorGenerico);
    }
  }

  async function onReschedule(slot: SlotRow) {
    if (!appointment) return;
    setIsRescheduling(false);
    try {
      await rescheduleAppointment.mutateAsync({ id: appointment.id, newStart: slot.slot_start });
      setAnnounce(es.citas.reprogramarOk);
      setTooLate(false);
    } catch (error) {
      if (error instanceof TooLateError) setTooLate(true);
      else if (error instanceof SlotUnavailableError) setAnnounce(es.reserva.errorSlotTomado);
      else setAnnounce(es.citas.errorGenerico);
    }
  }

  async function onCancel(reason: string) {
    if (!appointment) return;
    try {
      await cancelAppointment.mutateAsync({ id: appointment.id, reason: reason || undefined });
      setIsCancelling(false);
      setAnnounce(es.citas.canceladaOk);
      setTooLate(false);
    } catch (error) {
      if (error instanceof TooLateError) {
        setIsCancelling(false);
        setTooLate(true);
      } else {
        setAnnounce(es.citas.errorGenerico);
      }
    }
  }

  if (appointmentQuery.isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <SkeletonCard />
      </main>
    );
  }

  if (appointmentQuery.isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ErrorState onRetry={() => appointmentQuery.refetch()} />
        <Button variant="secondary" className="mt-3" onPress={() => navigate("/citas")}>
          {es.citas.volver}
        </Button>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger" role="alert">
          {es.citas.errorGenerico}
        </p>
        <Button variant="secondary" className="mt-3" onPress={() => navigate("/citas")}>
          {es.citas.volver}
        </Button>
      </main>
    );
  }

  const isFuture = new Date(appointment.starts_at) > new Date();
  const canAct = isFuture && (appointment.status === "scheduled" || appointment.status === "confirmed");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>{es.citas.titulo}</Eyebrow>
          <h1 ref={headingRef} tabIndex={-1} className="font-display mt-1 text-3xl text-ink outline-none">
            {es.citas.detalleTitulo}
          </h1>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <Card>
        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <User className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Paciente
            </dt>
            <dd className="font-medium text-ink">{appointment.patient.full_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Stethoscope className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Tipo
            </dt>
            <dd className="font-medium text-ink">{appointment.type.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Fecha
            </dt>
            <dd className="font-medium text-ink">{formatClinicDateLong(appointment.starts_at)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Building2 className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Clínica
            </dt>
            <dd className="font-medium text-ink">{appointment.clinic.name}</dd>
          </div>
        </dl>
      </Card>

      {tooLate ? (
        <div className="rounded-md border border-warning bg-surface p-4">
          <p className="flex items-center gap-2 font-medium text-ink">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" strokeWidth={2.25} aria-hidden="true" />
            {es.citas.errorTooLateTitulo}
          </p>
          <p className="mt-1 text-sm text-muted">{es.citas.errorTooLateDescripcion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {appointment.clinic.phone ? (
              <Button variant="secondary" onPress={() => window.open(phoneHref(appointment.clinic.phone!), "_self")}>
                <Phone className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                {es.citas.llamar}
              </Button>
            ) : null}
            {appointment.clinic.whatsapp ? (
              <Button
                variant="secondary"
                onPress={() => window.open(whatsappHref(appointment.clinic.whatsapp!), "_blank", "noopener")}
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                {es.citas.escribirWhatsapp}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {appointment.status === "scheduled" ? (
          <Button variant="primary" onPress={onConfirm} isPending={confirmAppointment.isPending}>
            <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            {confirmAppointment.isPending ? es.citas.confirmando : es.citas.confirmarCita}
          </Button>
        ) : null}
        {canAct ? (
          <>
            <Button variant="secondary" onPress={() => setIsRescheduling(true)}>
              <RotateCcw className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {es.citas.reprogramarCita}
            </Button>
            <Button variant="danger" onPress={() => setIsCancelling(true)}>
              <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {es.citas.cancelarCita}
            </Button>
          </>
        ) : null}
        <Button
          variant="secondary"
          onPress={() =>
            downloadIcs(
              "cita.ics",
              buildIcs({
                uid: appointment.id,
                title: `${appointment.type.name} — ${appointment.clinic.name}`,
                location: appointment.clinic.address ?? undefined,
                startsAt: appointment.starts_at,
                endsAt: appointment.ends_at,
              }),
            )
          }
        >
          <CalendarPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {es.citas.agregarCalendario}
        </Button>
        {appointment.clinic.maps_url ? (
          <Button variant="secondary" onPress={() => window.open(appointment.clinic.maps_url!, "_blank", "noopener")}>
            <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            {es.citas.comoLlegar}
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate("/citas")}
        className="inline-flex min-h-tap items-center gap-1.5 self-start text-sm text-accent underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {es.citas.volver}
      </button>

      {canAct ? (
        <RescheduleSheet
          isOpen={isRescheduling}
          onOpenChange={setIsRescheduling}
          clinicId={appointment.clinic_id}
          doctorId={appointment.doctor_id}
          typeId={appointment.type_id}
          onSelect={onReschedule}
        />
      ) : null}

      {canAct ? (
        <CancelDialog
          isOpen={isCancelling}
          onOpenChange={setIsCancelling}
          isPending={cancelAppointment.isPending}
          onConfirm={onCancel}
        />
      ) : null}

      <LiveRegion message={announce} assertive />
    </main>
  );
}
