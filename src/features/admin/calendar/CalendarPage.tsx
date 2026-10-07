import { useEffect, useMemo, useRef, useState } from "react";
import { today, type CalendarDate } from "@internationalized/date";
import { es } from "@/i18n/es";
import { CLINIC_TZ, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Calendar } from "@/components/ui/Calendar";
import { AdminLayout } from "../AdminLayout";
import { useAdminAppointmentsRange } from "../appointments/queries";
import { AdminAppointmentRow } from "../appointments/AdminAppointmentRow";
import { dayRangeUtc, weekRangeUtc, monthRangeUtc, weekDays } from "./dateRanges";

type View = "dia" | "semana" | "mes";

export function CalendarPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const staffQuery = useMyStaff();
  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.innerWidth >= 768 ? "semana" : "dia"));
  const [selected, setSelected] = useState<CalendarDate>(today(CLINIC_TZ));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const range = useMemo(() => {
    if (view === "dia") return dayRangeUtc(selected);
    if (view === "semana") return weekRangeUtc(selected);
    return monthRangeUtc(selected);
  }, [view, selected]);

  const appointmentsQuery = useAdminAppointmentsRange(staffQuery.data?.id, range.from, range.to);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof appointmentsQuery.data>>();
    for (const a of appointmentsQuery.data ?? []) {
      const key = formatClinicDateTime(a.starts_at, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointmentsQuery.data]);

  return (
    <AdminLayout>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.admin.calendario.titulo}
      </h1>

      <div role="group" aria-label={es.admin.calendario.titulo} className="mt-4 flex gap-2">
        {(["dia", "semana", "mes"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${view === v ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
          >
            {v === "dia" ? es.admin.calendario.vistaDia : v === "semana" ? es.admin.calendario.vistaSemana : es.admin.calendario.vistaMes}
          </button>
        ))}
      </div>

      {appointmentsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : view === "mes" ? (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Calendar
            aria-label={es.admin.calendario.vistaMes}
            value={selected}
            onChange={setSelected}
            hasIndicator={(d) => appointmentsByDate.has(d.toString())}
          />
          <div className="flex-1">
            <h2 className="font-medium text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "d 'de' MMMM")}
            </h2>
            <DayAppointments list={appointmentsByDate.get(selected.toString()) ?? []} />
          </div>
        </div>
      ) : view === "semana" ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-7">
          {weekDays(selected).map((d) => (
            <div key={d.toString()}>
              <h2 className="text-sm font-semibold text-ink">
                {formatClinicDateTime(`${d.toString()}T12:00:00`, "EEE d")}
              </h2>
              <div className="mt-2 flex flex-col gap-1.5">
                <DayAppointments list={appointmentsByDate.get(d.toString()) ?? []} compact />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(selected.subtract({ days: 1 }))}
              className="min-h-tap rounded-sm border border-line px-3 text-sm text-ink"
            >
              {es.admin.calendario.anterior}
            </button>
            <span className="font-medium text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "EEEE d 'de' MMMM")}
            </span>
            <button
              type="button"
              onClick={() => setSelected(selected.add({ days: 1 }))}
              className="min-h-tap rounded-sm border border-line px-3 text-sm text-ink"
            >
              {es.admin.calendario.siguiente}
            </button>
          </div>
          <DayAppointments list={appointmentsByDate.get(selected.toString()) ?? []} />
        </div>
      )}
    </AdminLayout>
  );
}

function DayAppointments({
  list,
  compact,
}: {
  list: ReturnType<typeof useAdminAppointmentsRange>["data"];
  compact?: boolean;
}) {
  const items = list ?? [];
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-muted">{es.admin.calendario.vacio}</p>;
  }
  if (compact) {
    return (
      <>
        {items.map((a) => (
          <AdminAppointmentRow key={a.id} appointment={a} />
        ))}
      </>
    );
  }
  return (
    <ul className="mt-2 flex flex-col gap-2">
      {items.map((a) => (
        <li key={a.id}>
          <AdminAppointmentRow appointment={a} />
        </li>
      ))}
    </ul>
  );
}
