import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { today, type CalendarDate } from "@internationalized/date";
import {
  AlertCircle,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  MapPin,
  User,
} from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ, formatClinicDateTime } from "@/lib/tz";
import { Calendar } from "@/components/ui/Calendar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { cardEnter } from "@/lib/motion";
import { groupSlotsByDate } from "@/features/booking/groupSlotsByDate";
import type { SlotRow } from "@/features/booking/queries";
import { usePeekToken, useTokenSlots, useExecuteToken, type TokenAppointment } from "./queries";

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">{children}</main>;
}

function AppointmentSummary({ appointment }: { appointment: TokenAppointment }) {
  return (
    <Card className="mt-6">
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        {appointment.clinic.name}
      </p>
      <p className="mt-2 flex items-center gap-1.5 font-medium text-ink">
        <User className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        {appointment.patient.full_name}
      </p>
      <p className="mt-1 text-sm text-ink">{appointment.type.name}</p>
      <p className="mt-2 text-lg font-semibold text-ink">
        {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
      </p>
      {appointment.clinic.address ? <p className="mt-1 text-sm text-muted">{appointment.clinic.address}</p> : null}
    </Card>
  );
}

function InvalidState() {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const navigate = useNavigate();
  return (
    <Shell>
      <motion.div initial="hidden" animate="visible" variants={cardEnter}>
        <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
          <AlertCircle className="h-6 w-6 shrink-0 text-warning" strokeWidth={2.25} aria-hidden="true" />
          {es.accion.invalidoTitulo}
        </h1>
        <p className="mt-3 text-muted">{es.accion.invalidoDescripcion}</p>
        <Button variant="primary" className="mt-8 self-start" onPress={() => navigate("/ingresar")}>
          {es.accion.irALaApp}
        </Button>
      </motion.div>
    </Shell>
  );
}

function ResultState({ purpose }: { purpose: "confirm" | "cancel" | "reschedule" }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const navigate = useNavigate();
  const message =
    purpose === "confirm" ? es.accion.confirmarOk : purpose === "cancel" ? es.accion.cancelarOk : es.accion.reprogramarOk;
  const Icon = purpose === "cancel" ? CalendarX2 : purpose === "reschedule" ? CalendarClock : CalendarCheck2;
  return (
    <Shell>
      <motion.div initial="hidden" animate="visible" variants={cardEnter}>
        <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
          <Icon className="h-6 w-6 shrink-0 text-success" strokeWidth={2.25} aria-hidden="true" />
          {message}
        </h1>
        <Button variant="primary" className="mt-8 self-start" onPress={() => navigate("/ingresar")}>
          {es.accion.verDetalle}
        </Button>
        <LiveRegion message={message} />
      </motion.div>
    </Shell>
  );
}

function ConfirmView({ token, appointment }: { token: string; appointment: TokenAppointment }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const execute = useExecuteToken();

  async function onConfirm() {
    setError(null);
    const result = await execute.mutateAsync({ token });
    if (!result.ok) {
      setError(es.accion.errorGenerico);
      return;
    }
    setDone(true);
  }

  if (done) return <ResultState purpose="confirm" />;

  return (
    <Shell>
      <motion.div initial="hidden" animate="visible" variants={cardEnter}>
        <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
          <CalendarCheck2 className="h-6 w-6 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
          {es.accion.confirmarTitulo}
        </h1>
        <AppointmentSummary appointment={appointment} />
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button variant="primary" className="mt-8" isPending={execute.isPending} onPress={onConfirm}>
          {es.accion.confirmarBoton}
        </Button>
      </motion.div>
    </Shell>
  );
}

function CancelView({ token, appointment }: { token: string; appointment: TokenAppointment }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const execute = useExecuteToken();

  async function onCancel() {
    setError(null);
    const result = await execute.mutateAsync({ token });
    if (!result.ok) {
      setError(result.error?.includes("too_late") ? es.accion.errorTooLate : es.accion.errorGenerico);
      return;
    }
    setDone(true);
  }

  if (done) return <ResultState purpose="cancel" />;

  return (
    <Shell>
      <motion.div initial="hidden" animate="visible" variants={cardEnter}>
        <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
          <CalendarX2 className="h-6 w-6 shrink-0 text-danger" strokeWidth={2.25} aria-hidden="true" />
          {es.accion.cancelarTitulo}
        </h1>
        <AppointmentSummary appointment={appointment} />
        <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={2.25} aria-hidden="true" />
          {es.accion.cancelarAyuda}
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button variant="danger" className="mt-8" isPending={execute.isPending} onPress={onCancel}>
          {es.accion.cancelarBoton}
        </Button>
      </motion.div>
    </Shell>
  );
}

function RescheduleView({ token, appointment }: { token: string; appointment: TokenAppointment }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const slotsQuery = useTokenSlots(token, true);
  const execute = useExecuteToken();

  const minDate = today(CLINIC_TZ);
  const maxDate = minDate.add({ days: 30 });
  const slotsByDate = useMemo(() => groupSlotsByDate(slotsQuery.data?.slots ?? []), [slotsQuery.data]);
  const selectedDaySlots = selectedDate ? (slotsByDate.get(selectedDate.toString()) ?? []) : [];

  async function onPick(slot: SlotRow) {
    setError(null);
    const result = await execute.mutateAsync({ token, new_start: slot.slot_start });
    if (!result.ok) {
      setError(result.error?.includes("too_late") ? es.accion.errorTooLate : es.accion.errorGenerico);
      return;
    }
    setDone(true);
  }

  if (done) return <ResultState purpose="reschedule" />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-10">
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-3xl text-ink outline-none">
        <CalendarClock className="h-6 w-6 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.accion.reprogramarTitulo}
      </h1>
      <AppointmentSummary appointment={appointment} />
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {slotsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-10">
          <Calendar
            aria-label={es.accion.reprogramarTitulo}
            minValue={minDate}
            maxValue={maxDate}
            value={selectedDate}
            onChange={setSelectedDate}
            isDateUnavailable={(date) => !slotsByDate.has(date.toString())}
          />
          <div className="flex-1">
            {!selectedDate ? (
              <p className="mt-2 text-muted">{es.reserva.fechaEligaDia}</p>
            ) : selectedDaySlots.length === 0 ? (
              <p className="mt-2 text-muted">{es.reserva.fechaSinCupo}</p>
            ) : (
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {selectedDaySlots.map((slot) => (
                  <li key={slot.slot_start}>
                    <button
                      type="button"
                      disabled={execute.isPending}
                      onClick={() => onPick(slot)}
                      className="min-h-tap w-full rounded-sm border border-line bg-surface px-2 py-2 text-sm text-ink shadow-[var(--shadow-1)] transition-shadow duration-150 hover:bg-line hover:shadow-[var(--shadow-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
                    >
                      {formatClinicDateTime(slot.slot_start, "h:mm a")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export function TokenActionPage() {
  const { token } = useParams<{ token: string }>();
  const peek = usePeekToken(token ?? "");

  if (!token || peek.isLoading) {
    return (
      <Shell>
        <p className="text-muted" role="status">
          {es.accion.cargandoTitulo}
        </p>
      </Shell>
    );
  }

  if (!peek.data?.ok || !peek.data.appointment || !peek.data.purpose) {
    return <InvalidState />;
  }

  const { purpose, appointment } = peek.data;
  if (purpose === "confirm") return <ConfirmView token={token} appointment={appointment} />;
  if (purpose === "cancel") return <CancelView token={token} appointment={appointment} />;
  return <RescheduleView token={token} appointment={appointment} />;
}
