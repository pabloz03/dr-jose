import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import { useAppointments } from "./queries";
import { groupAppointmentsByPatient } from "./groupAppointments";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { AppointmentWithDetails } from "./queries";

function AppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/citas/${appointment.id}`)}
        className="flex min-h-tap w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 text-left hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span>
          <span className="block font-medium text-ink">{appointment.type.name}</span>
          <span className="block text-sm text-muted">
            {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
          </span>
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </button>
    </li>
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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          {es.citas.titulo}
        </h1>
        <Button variant="primary" onPress={() => navigate("/citas/nueva")}>
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
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">{es.citas.sinCitas}</p>
          <Button variant="primary" onPress={() => navigate("/citas/nueva")}>
            {es.citas.reservarCta}
          </Button>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.patient.id} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-ink">{group.patient.full_name}</h2>

            <div>
              <h3 className="text-sm font-medium text-muted">{es.citas.proximas}</h3>
              {group.proximas.length === 0 ? (
                <p className="mt-2 text-sm text-muted">{es.citas.sinCitas}</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {group.proximas.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </ul>
              )}
            </div>

            {group.pasadas.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-muted">{es.citas.pasadas}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {group.pasadas.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
