import { useNavigate } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { formatClinicDateTime } from "@/lib/tz";
import { Card } from "@/components/ui/Card";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

export function AdminAppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();

  return (
    <Card onPress={() => navigate(`/admin/citas/${appointment.id}`)} className="min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-ink">
            <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2.25} />
            <span className="shrink-0">{formatClinicDateTime(appointment.starts_at, "h:mm a")}</span>
            <span aria-hidden="true" className="shrink-0 text-muted">
              —
            </span>
            <span className="min-w-0 truncate" title={appointment.patient.full_name}>
              {appointment.patient.full_name}
            </span>
          </span>
          <span
            className="block truncate text-sm text-muted"
            title={`${appointment.type.name} — ${appointment.clinic.name}`}
          >
            {appointment.type.name} — {appointment.clinic.name}
          </span>
        </span>
        <span className="shrink-0">
          <AppointmentStatusBadge status={appointment.status} />
        </span>
      </div>
    </Card>
  );
}
