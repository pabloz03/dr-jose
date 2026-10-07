import { useNavigate } from "react-router-dom";
import { formatClinicDateTime } from "@/lib/tz";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import type { AppointmentWithDetails } from "@/features/appointments/queries";

export function AdminAppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/admin/citas/${appointment.id}`)}
      className="flex min-h-tap w-full items-center justify-between gap-3 rounded-md border border-line bg-surface p-3 text-left hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span>
        <span className="block font-medium text-ink">
          {formatClinicDateTime(appointment.starts_at, "h:mm a")} — {appointment.patient.full_name}
        </span>
        <span className="block text-sm text-muted">{appointment.type.name}</span>
      </span>
      <AppointmentStatusBadge status={appointment.status} />
    </button>
  );
}
