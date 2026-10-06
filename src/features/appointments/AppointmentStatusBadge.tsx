import { Badge } from "@/components/ui/Badge";
import { es } from "@/i18n/es";
import type { Database } from "@/lib/database.types";

type Status = Database["public"]["Enums"]["appointment_status"];

const TONE: Record<Status, "neutral" | "success" | "warning" | "danger"> = {
  scheduled: "warning",
  confirmed: "success",
  cancelled: "danger",
  rescheduled: "neutral",
  completed: "neutral",
  no_show: "danger",
};

const ICON: Record<Status, string> = {
  scheduled: "●",
  confirmed: "✓",
  cancelled: "✕",
  rescheduled: "↻",
  completed: "✓",
  no_show: "✕",
};

export function AppointmentStatusBadge({ status }: { status: Status }) {
  return (
    <Badge tone={TONE[status]} icon={ICON[status]}>
      {es.citas.estado[status]}
    </Badge>
  );
}
