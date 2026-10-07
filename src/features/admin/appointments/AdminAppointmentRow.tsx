import { useNavigate } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { formatClinicDateTime } from "@/lib/tz";
import { Card } from "@/components/ui/Card";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

export function AdminAppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <Card onPress={() => navigate(`/admin/citas/${appointment.id}`)}>
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
            {formatClinicDateTime(appointment.starts_at, "h:mm a")}
            <span aria-hidden="true" className="text-muted">
              —
            </span>
            {appointment.patient.full_name}
          </span>
          <span className="block text-sm text-muted">{appointment.type.name}</span>
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
    </Card>
  );
}
