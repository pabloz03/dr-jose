import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarPlus, ChevronRight, Clock } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cardEnter, staggerList } from "@/lib/motion";
import { useAppointments } from "./queries";
import { groupAppointmentsByPatient } from "./groupAppointments";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { AppointmentWithDetails } from "./queries";

function AppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <motion.li variants={cardEnter}>
      <Card onPress={() => navigate(`/citas/${appointment.id}`)} className="flex items-center justify-between gap-3">
        <span>
          <span className="block font-medium text-ink">{appointment.type.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <AppointmentStatusBadge status={appointment.status} />
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" strokeWidth={2.25} aria-hidden="true" />
        </span>
      </Card>
    </motion.li>
  );
}

export function AppointmentsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const appointmentsQuery = useAppointments();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const groups = useMemo(() => groupAppointmentsByPatient(appointmentsQuery.data ?? []), [appointmentsQuery.data]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink outline-none">
          {es.citas.titulo}
        </h1>
        <Button variant="primary" onPress={() => navigate("/citas/nueva")}>
          <CalendarPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {es.citas.reservarCta}
        </Button>
      </div>

      {appointmentsQuery.isLoading ? (
        <p className="text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : appointmentsQuery.isError ? (
        <div className="flex flex-col gap-2">
          <p className="text-danger" role="alert">
            {es.citas.errorGenerico}
          </p>
          <Button variant="secondary" onPress={() => appointmentsQuery.refetch()} className="self-start">
            {es.common.reintentar}
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">{es.citas.sinCitas}</p>
          <Button variant="primary" onPress={() => navigate("/citas/nueva")}>
            <CalendarPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            {es.citas.reservarCta}
          </Button>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.patient.id} className="flex flex-col gap-5">
            <h2 className="font-display text-xl text-ink">{group.patient.full_name}</h2>

            <div>
              <h3 className="text-sm font-medium text-muted">{es.citas.proximas}</h3>
              {group.proximas.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{es.citas.sinCitas}</p>
              ) : (
                <motion.ul
                  className="mt-3 flex flex-col gap-2"
                  variants={staggerList}
                  initial="hidden"
                  animate="visible"
                >
                  {group.proximas.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </motion.ul>
              )}
            </div>

            {group.pasadas.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-muted">{es.citas.pasadas}</h3>
                <motion.ul
                  className="mt-3 flex flex-col gap-2"
                  variants={staggerList}
                  initial="hidden"
                  animate="visible"
                >
                  {group.pasadas.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </motion.ul>
              </div>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
