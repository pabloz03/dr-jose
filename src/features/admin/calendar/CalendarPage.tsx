import { useMemo, useState } from "react";
import { today, type CalendarDate } from "@internationalized/date";
import { CalendarDays, CalendarRange, CalendarX2, ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { es } from "@/i18n/es";
import { CLINIC_TZ, formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { Calendar } from "@/components/ui/Calendar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { AdminClinicSelector } from "../AdminClinicSelector";
import { useAdminClinic } from "../AdminClinicContext";
import { useAdminAppointmentsRange } from "../appointments/queries";
import { AdminAppointmentRow } from "../appointments/AdminAppointmentRow";
import { dayRangeUtc, weekRangeUtc, monthRangeUtc, weekDays, weekStart } from "./dateRanges";

type View = "dia" | "semana" | "mes";

function WeekStrip({
  selected,
  onSelect,
  hasAppointments,
}: {
  selected: CalendarDate;
  onSelect: (date: CalendarDate) => void;
  hasAppointments: (date: CalendarDate) => boolean;
}) {
  const days = weekDays(selected);
  return (
    <div className="rounded-[var(--r-lg)] border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect(selected.subtract({ weeks: 1 }))}
          aria-label={es.admin.calendario.anterior}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-[var(--r-pill)] text-ink hover:bg-accent-2"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <span className="font-display text-sm text-ink">
          {formatClinicDateTime(`${weekStart(selected).toString()}T12:00:00`, "d")}–
          {formatClinicDateTime(`${weekStart(selected).add({ days: 6 }).toString()}T12:00:00`, "d 'de' MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => onSelect(selected.add({ weeks: 1 }))}
          aria-label={es.admin.calendario.siguiente}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-[var(--r-pill)] text-ink hover:bg-accent-2"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
      <div role="group" aria-label={es.admin.calendario.vistaSemana} className="mt-3 flex justify-between gap-1">
        {days.map((d) => {
          const isSelected = d.toString() === selected.toString();
          return (
            <button
              key={d.toString()}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(d)}
              className={`flex min-h-tap flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--r-md)] py-1.5 transition-colors duration-150 ${
                isSelected ? "bg-accent text-on-accent" : "text-ink hover:bg-accent-2"
              }`}
            >
              <span className={`text-xs ${isSelected ? "text-on-accent" : "text-muted"}`}>
                {formatClinicDateTime(`${d.toString()}T12:00:00`, "EEEEE").toUpperCase()}
              </span>
              <span className="font-display text-sm">{formatClinicDateTime(`${d.toString()}T12:00:00`, "d")}</span>
              <span aria-hidden="true" className={`h-1 w-1 rounded-full ${hasAppointments(d) ? (isSelected ? "bg-on-accent" : "bg-accent") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const staffQuery = useMyStaff();
  const { selectedId } = useAdminClinic();
  const [view, setView] = useState<View>("semana");
  const [selected, setSelected] = useState<CalendarDate>(today(CLINIC_TZ));

  const range = useMemo(() => {
    if (view === "dia") return dayRangeUtc(selected);
    if (view === "semana") return weekRangeUtc(selected);
    return monthRangeUtc(selected);
  }, [view, selected]);

  const appointmentsQuery = useAdminAppointmentsRange(staffQuery.data?.id, range.from, range.to, selectedId);

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
    <AdminLayout wide>
      <AdminScreenHeader icon={CalendarRange} title={es.admin.calendario.titulo} />
      <AdminClinicSelector />

      <SegmentedControl
        aria-label={es.admin.calendario.titulo}
        value={view}
        onChange={setView}
        className="max-w-sm"
        options={[
          { value: "dia", label: es.admin.calendario.vistaDia, icon: <CalendarDays aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} /> },
          { value: "semana", label: es.admin.calendario.vistaSemana, icon: <CalendarRange aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} /> },
          { value: "mes", label: es.admin.calendario.vistaMes, icon: <Grid3x3 aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} /> },
        ]}
      />

      {appointmentsQuery.isLoading ? (
        <SkeletonList count={4} />
      ) : view === "mes" ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <Calendar
            aria-label={es.admin.calendario.vistaMes}
            value={selected}
            onChange={setSelected}
            hasIndicator={(d) => appointmentsByDate.has(d.toString())}
          />
          <div className="flex-1">
            <h2 className="font-display text-lg text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "d 'de' MMMM")}
            </h2>
            <DayAppointments
              list={appointmentsByDate.get(selected.toString()) ?? []}
              isError={appointmentsQuery.isError}
              onRetry={() => appointmentsQuery.refetch()}
            />
          </div>
        </div>
      ) : view === "semana" ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="lg:w-80 lg:shrink-0">
            <WeekStrip selected={selected} onSelect={setSelected} hasAppointments={(d) => appointmentsByDate.has(d.toString())} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "EEEE d 'de' MMMM")}
            </h2>
            <DayAppointments
              list={appointmentsByDate.get(selected.toString()) ?? []}
              isError={appointmentsQuery.isError}
              onRetry={() => appointmentsQuery.refetch()}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(selected.subtract({ days: 1 }))}
              className="inline-flex min-h-tap items-center gap-1 rounded-sm border border-line px-3 text-sm text-ink"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
              {es.admin.calendario.anterior}
            </button>
            <span className="font-medium text-ink">
              {formatClinicDateTime(`${selected.toString()}T12:00:00`, "EEEE d 'de' MMMM")}
            </span>
            <button
              type="button"
              onClick={() => setSelected(selected.add({ days: 1 }))}
              className="inline-flex min-h-tap items-center gap-1 rounded-sm border border-line px-3 text-sm text-ink"
            >
              {es.admin.calendario.siguiente}
              <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          <DayAppointments
            list={appointmentsByDate.get(selected.toString()) ?? []}
            isError={appointmentsQuery.isError}
            onRetry={() => appointmentsQuery.refetch()}
          />
        </div>
      )}
    </AdminLayout>
  );
}

function DayAppointments({
  list,
  isError,
  onRetry,
}: {
  list: ReturnType<typeof useAdminAppointmentsRange>["data"];
  isError?: boolean;
  onRetry?: () => void;
}) {
  const items = list ?? [];
  if (isError) {
    return (
      <div className="mt-2">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mt-2">
        <EmptyState icon={<CalendarX2 aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />} title={es.admin.calendario.vacio} />
      </div>
    );
  }
  return (
    <ul className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-2">
      {items.map((a) => (
        <li key={a.id}>
          <AdminAppointmentRow appointment={a} />
        </li>
      ))}
    </ul>
  );
}
