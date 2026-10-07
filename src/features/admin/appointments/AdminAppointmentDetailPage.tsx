import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Check, CheckCircle2, ClipboardList, Repeat, User, XCircle } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AdminLayout } from "../AdminLayout";
import { useMarkAttendance } from "./queries";
import {
  useAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
  TooLateError,
  SlotUnavailableError,
} from "@/features/appointments/queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import { RescheduleSheet } from "@/features/appointments/RescheduleSheet";
import { CancelDialog } from "@/features/appointments/CancelDialog";
import type { SlotRow } from "@/features/booking/queries";

export function AdminAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const appointmentQuery = useAppointment(id);
  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const markAttendance = useMarkAttendance();

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
    } catch (error) {
      setAnnounce(error instanceof SlotUnavailableError ? es.reserva.errorSlotTomado : es.citas.errorGenerico);
    }
  }

  async function onCancel(reason: string) {
    if (!appointment) return;
    try {
      await cancelAppointment.mutateAsync({ id: appointment.id, reason: reason || undefined });
      setIsCancelling(false);
      setAnnounce(es.citas.canceladaOk);
    } catch (error) {
      // Staff nunca choca con too_late (la RPC la exime para is_staff()),
      // pero se maneja por completitud si algún día cambia esa regla.
      setAnnounce(error instanceof TooLateError ? es.citas.errorTooLateTitulo : es.citas.errorGenerico);
    }
  }

  async function onMarkAttendance(status: "completed" | "no_show") {
    if (!appointment) return;
    try {
      await markAttendance.mutateAsync({ id: appointment.id, status });
      setAnnounce(es.admin.citaDetalle.marcarOk);
    } catch {
      setAnnounce(es.admin.citaDetalle.soloPasadas);
    }
  }

  if (appointmentQuery.isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      </AdminLayout>
    );
  }

  if (!appointment) {
    return (
      <AdminLayout>
        <p className="text-danger" role="alert">
          {es.citas.errorGenerico}
        </p>
      </AdminLayout>
    );
  }

  const isPast = new Date(appointment.starts_at) <= new Date();
  const isActive = appointment.status === "scheduled" || appointment.status === "confirmed";

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>{es.admin.citaDetalle.eyebrow}</Eyebrow>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
          >
            <ClipboardList aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
            {es.admin.citaDetalle.titulo}
          </h1>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <Card className="mt-6">
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-muted">
              <User aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              Paciente
            </dt>
            <dd className="font-medium text-ink">{appointment.patient.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-muted">
              <ClipboardList aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              Tipo
            </dt>
            <dd className="font-medium text-ink">{appointment.type.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              Fecha
            </dt>
            <dd className="font-medium text-ink">{formatClinicDateLong(appointment.starts_at)}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        {appointment.status === "scheduled" ? (
          <Button variant="primary" onPress={onConfirm} isPending={confirmAppointment.isPending}>
            <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            {es.citas.confirmarCita}
          </Button>
        ) : null}
        {isActive ? (
          <>
            <Button variant="secondary" onPress={() => setIsRescheduling(true)}>
              <Repeat aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.citas.reprogramarCita}
            </Button>
            <Button variant="danger" onPress={() => setIsCancelling(true)}>
              <XCircle aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.citas.cancelarCita}
            </Button>
          </>
        ) : null}
        {isActive && isPast ? (
          <>
            <Button variant="secondary" onPress={() => onMarkAttendance("completed")} isPending={markAttendance.isPending}>
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.admin.citaDetalle.marcarCompletada}
            </Button>
            <Button variant="danger" onPress={() => onMarkAttendance("no_show")} isPending={markAttendance.isPending}>
              <XCircle aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.admin.citaDetalle.marcarNoShow}
            </Button>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-6 inline-flex items-center gap-1 self-start text-sm text-accent underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.citas.volver}
      </button>

      {isActive ? (
        <RescheduleSheet
          isOpen={isRescheduling}
          onOpenChange={setIsRescheduling}
          clinicId={appointment.clinic_id}
          doctorId={appointment.doctor_id}
          typeId={appointment.type_id}
          onSelect={onReschedule}
        />
      ) : null}
      {isActive ? (
        <CancelDialog
          isOpen={isCancelling}
          onOpenChange={setIsCancelling}
          isPending={cancelAppointment.isPending}
          onConfirm={onCancel}
        />
      ) : null}

      <LiveRegion message={announce} assertive />
    </AdminLayout>
  );
}
