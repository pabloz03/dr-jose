import { Check, Clock3, RotateCcw, X } from "lucide-react";
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

const ICON: Record<Status, typeof Check> = {
  scheduled: Clock3,
  confirmed: Check,
  cancelled: X,
  rescheduled: RotateCcw,
  completed: Check,
  no_show: X,
};

export function AppointmentStatusBadge({ status }: { status: Status }) {
  const Icon = ICON[status];
  return (
    <Badge tone={TONE[status]} icon={<Icon className="h-3.5 w-3.5" strokeWidth={2.5} />}>
      {es.citas.estado[status]}
    </Badge>
  );
}
