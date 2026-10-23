import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import type { Database } from "@/lib/database.types";

type Status = Database["public"]["Enums"]["appointment_status"];

const ALL_STATUSES: Status[] = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled", "no_show"];

export function StatusBreakdown({ counts }: { counts: Record<Status, number> }) {
  const total = Math.max(1, ALL_STATUSES.reduce((sum, s) => sum + counts[s], 0));

  return (
    <ul className="flex flex-col gap-2.5">
      {ALL_STATUSES.map((status) => {
        const n = counts[status];
        return (
          <li key={status} className="flex items-center gap-3">
            <div className="w-28 shrink-0 lg:w-32">
              <AppointmentStatusBadge status={status} />
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(n / total) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-ink">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
