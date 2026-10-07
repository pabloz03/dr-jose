import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { today, type CalendarDate } from "@internationalized/date";
import { Clock } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { CLINIC_TZ, formatClinicDateTime } from "@/lib/tz";
import { Calendar } from "@/components/ui/Calendar";
import { useAvailableSlots, useClinicSettings, type SlotRow } from "../queries";
import { groupSlotsByDate } from "../groupSlotsByDate";

export function DateTimeStep({
  dir,
  clinicId,
  doctorId,
  typeId,
  onSelect,
  ignoreLeadTime,
}: {
  dir: 1 | -1;
  clinicId: string;
  doctorId: string;
  typeId: string;
  onSelect: (slot: SlotRow) => void;
  /** Staff saltándose min_lead_hours para citas manuales (E6-S4). */
  ignoreLeadTime?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const settingsQuery = useClinicSettings(clinicId);
  const maxBookingDays = settingsQuery.data?.max_booking_days ?? 90;
  const minDate = today(CLINIC_TZ);
  const maxDate = minDate.add({ days: maxBookingDays });

  const slotsQuery = useAvailableSlots({
    clinicId,
    doctorId,
    typeId,
    from: minDate.toString(),
    to: maxDate.toString(),
    ignoreLeadTime,
  });

  const slotsByDate = useMemo(() => groupSlotsByDate(slotsQuery.data ?? []), [slotsQuery.data]);

  const selectedDaySlots = selectedDate ? (slotsByDate.get(selectedDate.toString()) ?? []) : [];

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reserva.fechaTitulo}
      </h2>
      <p className="mt-1 text-sm text-muted">{es.reserva.fechaZona}</p>

      {slotsQuery.isLoading ? (
        <p className="mt-4 text-muted" role="status">
          {es.common.cargando}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Calendar
            aria-label={es.reserva.fechaTitulo}
            minValue={minDate}
            maxValue={maxDate}
            value={selectedDate}
            onChange={setSelectedDate}
            isDateUnavailable={(date) => !slotsByDate.has(date.toString())}
          />

          <div className="flex-1">
            <h3 className="flex items-center gap-1.5 font-medium text-ink">
              <Clock className="h-4 w-4 text-muted" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.horariosTitulo}
            </h3>
            {!selectedDate ? (
              <p className="mt-2 text-muted">{es.reserva.fechaEligaDia}</p>
            ) : selectedDaySlots.length === 0 ? (
              <p className="mt-2 text-muted">{es.reserva.fechaSinCupo}</p>
            ) : (
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {selectedDaySlots.map((slot) => (
                  <li key={slot.slot_start}>
                    <button
                      type="button"
                      onClick={() => onSelect(slot)}
                      className="min-h-tap w-full rounded-sm border border-line bg-surface px-2 py-2 text-sm text-ink shadow-[var(--shadow-1)] transition-shadow duration-150 hover:bg-line hover:shadow-[var(--shadow-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {formatClinicDateTime(slot.slot_start, "h:mm a")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
