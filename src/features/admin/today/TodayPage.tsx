import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarClock, Clock3, Plus, Sparkles, User } from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ, clinicDayBounds, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cardEnter, staggerList } from "@/lib/motion";
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>{es.admin.nav.hoy}</Eyebrow>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
          >
            <CalendarClock aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
            {es.admin.hoy.titulo}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/citas/nueva")}
          className="inline-flex min-h-tap items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {es.admin.citaDetalle.crearManual}
        </button>
      </div>

      {staffQuery.isLoading || appointmentsQuery.isLoading ? (
        <div className="mt-6">
          <SkeletonList count={3} />
        </div>
      ) : staffQuery.isError || appointmentsQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            onRetry={() => {
              if (staffQuery.isError) void staffQuery.refetch();
              if (appointmentsQuery.isError) void appointmentsQuery.refetch();
            }}
          />
        </div>
      ) : appointments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarClock aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
            title={es.admin.hoy.vacio}
          />
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={staggerList}
          className="mt-6 flex flex-col gap-2.5"
        >
          {appointments.map((a) => (
            <motion.li key={a.id} variants={cardEnter}>
              <Card
                onPress={() => navigate(`/admin/citas/${a.id}`)}
                className={a.id === nextId ? "outline outline-2 outline-accent outline-offset-2" : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>
                    {a.id === nextId ? (
                      <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent">
                        <Sparkles aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {es.admin.hoy.siguientePaciente}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5 font-medium text-ink">
                      <Clock3 aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
                      {formatClinicDateTime(a.starts_at, "h:mm a")}
                      <span aria-hidden="true" className="text-muted">
                        —
                      </span>
                      <User aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
                      {a.patient.full_name}
                    </span>
                    <span className="block text-sm text-muted">{a.type.name}</span>
                  </span>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </AdminLayout>
  );
}
