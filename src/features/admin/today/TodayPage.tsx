import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { es } from "@/i18n/es";
import { CLINIC_TZ, clinicDayBounds, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { useAdminAppointmentsRange } from "../appointments/queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import { AdminLayout } from "../AdminLayout";

function todayLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }).format(new Date());
}

export function TodayPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const staffQuery = useMyStaff();
  const { from, to } = clinicDayBounds(todayLocalDate());
  const appointmentsQuery = useAdminAppointmentsRange(staffQuery.data?.id, from, to);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const appointments = appointmentsQuery.data ?? [];
  const now = new Date();
  const nextId = appointments.find(
    (a) => (a.status === "scheduled" || a.status === "confirmed") && new Date(a.starts_at) >= now,
  )?.id;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          {es.admin.hoy.titulo}
        </h1>
        <button
          type="button"
          onClick={() => navigate("/admin/citas/nueva")}
          className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          {es.admin.citaDetalle.crearManual}
        </button>
      </div>

      {staffQuery.isLoading || appointmentsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : appointments.length === 0 ? (
        <p className="mt-4 text-muted">{es.admin.hoy.vacio}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {appointments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => navigate(`/admin/citas/${a.id}`)}
                className={`flex min-h-tap w-full items-center justify-between gap-3 rounded-md border p-3 text-left hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${a.id === nextId ? "border-accent bg-surface" : "border-line bg-surface"}`}
              >
                <span>
                  {a.id === nextId ? (
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-accent">
                      {es.admin.hoy.siguientePaciente}
                    </span>
                  ) : null}
                  <span className="block font-medium text-ink">
                    {formatClinicDateTime(a.starts_at, "h:mm a")} — {a.patient.full_name}
                  </span>
                  <span className="block text-sm text-muted">{a.type.name}</span>
                </span>
                <AppointmentStatusBadge status={a.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
