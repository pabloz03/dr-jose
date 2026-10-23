import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { today, type CalendarDate } from "@internationalized/date";
import { Check, Clock } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { CLINIC_TZ, formatClinicDateTime, formatClinicDateLong } from "@/lib/tz";
import { Calendar } from "@/components/ui/Calendar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { StepFooter } from "@/features/booking/StepFooter";
import { groupSlotsByDate } from "@/features/booking/groupSlotsByDate";
import { useGuestSlots, type GuestSettings } from "./queries";
import type { SlotRow } from "@/features/booking/queries";

/**
 * Equivalente a DateTimeStep (src/features/booking/steps/DateTimeStep.tsx)
 * usando useGuestSlots (vía Edge Function guest-booking) en vez de
 * useAvailableSlots/useClinicSettings directos — mismo motivo que
 * GuestTypeStep: esas tablas/RPC no son legibles por un anon sin pasar
 * por la función con service role.
 */
export function GuestDateTimeStep({
  dir,
  clinicId,
  doctorId,
  typeId,
  settings,
  onSelect,
}: {
  dir: 1 | -1;
  clinicId: string;
  doctorId: string;
  typeId: string;
  settings: GuestSettings;
  onSelect: (slot: SlotRow) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const minDate = today(CLINIC_TZ);
  const maxDate = minDate.add({ days: settings.max_booking_days });

  const slotsQuery = useGuestSlots({
    clinicId,
    doctorId,
    typeId,
    from: minDate.toString(),
    to: maxDate.toString(),
  });

  const slotsByDate = useMemo(() => groupSlotsByDate(slotsQuery.data?.slots ?? []), [slotsQuery.data]);
  const selectedDaySlots = selectedDate ? (slotsByDate.get(selectedDate.toString()) ?? []) : [];

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" className="flex flex-1 flex-col">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reserva.fechaTitulo}
      </h2>
      <p className="mt-1 text-sm text-muted">{es.reserva.fechaZona}</p>

      {slotsQuery.isLoading ? (
        <div className="mt-4">
          <SkeletonCard />
        </div>
      ) : slotsQuery.isError ? (
        <div className="mt-4">
          <ErrorState onRetry={() => slotsQuery.refetch()} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:gap-8">
          <Calendar
            aria-label={es.reserva.fechaTitulo}
            minValue={minDate}
            maxValue={maxDate}
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
            }}
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
                {selectedDaySlots.map((slot) => {
                  const isSelected = selectedSlot?.slot_start === slot.slot_start;
                  return (
                    <li key={slot.slot_start}>
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        aria-pressed={isSelected}
                        className={`flex min-h-tap w-full items-center justify-center gap-1 rounded-sm border px-2 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                          isSelected
                            ? "border-accent bg-accent text-on-accent"
                            : "border-line bg-surface text-ink hover:border-accent hover:bg-accent-2"
                        }`}
                      >
                        {formatClinicDateTime(slot.slot_start, "h:mm a")}
                        {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <StepFooter
        label={es.reservaInvitado.fechaBoton}
        caption={selectedSlot ? `${formatClinicDateLong(selectedSlot.slot_start)} · ${formatClinicDateTime(selectedSlot.slot_start, "h:mm a")}` : undefined}
        isDisabled={!selectedSlot}
        onPress={() => selectedSlot && onSelect(selectedSlot)}
      />
    </motion.div>
  );
}
