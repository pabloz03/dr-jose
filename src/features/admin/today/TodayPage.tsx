import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarClock, Clock3, Plus, Sparkles, User } from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ, clinicDayBounds, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cardEnter, staggerList } from "@/lib/motion";
import { useAdminAppointmentsRange } from "../appointments/queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { AdminClinicSelector } from "../AdminClinicSelector";
import { useAdminClinic } from "../AdminClinicContext";

function todayLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }).format(new Date());
}

export function TodayPage() {
  const navigate = useNavigate();
  const staffQuery = useMyStaff();
  const { selectedId } = useAdminClinic();
  const { from, to } = clinicDayBounds(todayLocalDate());
  const appointmentsQuery = useAdminAppointmentsRange(staffQuery.data?.id, from, to, selectedId);

  const appointments = appointmentsQuery.data ?? [];
  const now = new Date();
  const nextId = appointments.find(
    (a) => (a.status === "scheduled" || a.status === "confirmed") && new Date(a.starts_at) >= now,
  )?.id;

  return (
    <AdminLayout>
      <AdminScreenHeader icon={CalendarClock} title={es.admin.hoy.titulo} />
      <AdminClinicSelector />

      <p className="font-display text-lg text-ink">{formatClinicDateTime(`${todayLocalDate()}T12:00:00`, "EEEE d 'de' MMMM")}</p>

      <Button variant="primary" size="lg" className="w-full lg:w-auto" onPress={() => navigate("/admin/citas/nueva")}>
        <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.admin.citaDetalle.crearManual}
      </Button>

      {staffQuery.isLoading || appointmentsQuery.isLoading ? (
        <SkeletonList count={3} />
      ) : staffQuery.isError || appointmentsQuery.isError ? (
        <ErrorState
          onRetry={() => {
            if (staffQuery.isError) void staffQuery.refetch();
            if (appointmentsQuery.isError) void appointmentsQuery.refetch();
          }}
        />
      ) : appointments.length === 0 ? (
        <EmptyState icon={<CalendarClock aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />} title={es.admin.hoy.vacio} />
      ) : (
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
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
                    <span className="block text-sm text-muted">
                      {a.type.name} — {a.clinic.name}
                    </span>
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
