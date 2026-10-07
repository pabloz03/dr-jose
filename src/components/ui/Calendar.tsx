import {
  Calendar as RACCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarCell as RACCalendarCell,
  CalendarHeading,
  Button as RACCalendarButton,
  type CalendarProps as RACCalendarProps,
  type DateValue,
} from "react-aria-components/Calendar";
import type { CalendarDate } from "@internationalized/date";

export interface CalendarProps<T extends DateValue> extends RACCalendarProps<T> {
  "aria-label": string;
  /** Punto de densidad bajo el número de día (p. ej. "tiene citas"). */
  hasIndicator?: (date: CalendarDate) => boolean;
}

/**
 * Navegación con flechas/Home/End/PgUp/PgDn viene incluida en
 * useCalendarGrid de RAC, no hay que reimplementarla. Los días sin
 * disponibilidad se marcan con tachado (data-unavailable), no solo color
 * — regla dura #10.
 */
export function Calendar<T extends DateValue>({ hasIndicator, ...props }: CalendarProps<T>) {
  return (
    <RACCalendar {...props} className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <RACCalendarButton
          slot="previous"
          className="flex h-tap w-tap items-center justify-center rounded-sm text-ink data-[hovered]:bg-line data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus"
        >
          ‹<span className="sr-only">Mes anterior</span>
        </RACCalendarButton>
        <CalendarHeading className="text-base font-semibold text-ink" />
        <RACCalendarButton
          slot="next"
          className="flex h-tap w-tap items-center justify-center rounded-sm text-ink data-[hovered]:bg-line data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus"
        >
          ›<span className="sr-only">Mes siguiente</span>
        </RACCalendarButton>
      </header>
      <CalendarGrid className="border-collapse">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="pb-2 text-xs font-medium text-muted">{day}</CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => <CalendarCell date={date} showIndicator={hasIndicator?.(date) ?? false} />}
        </CalendarGridBody>
      </CalendarGrid>
    </RACCalendar>
  );
}

function CalendarCell({ date, showIndicator }: { date: CalendarDate; showIndicator: boolean }) {
  return (
    <RACCalendarCell
      date={date}
      className="relative flex h-tap w-tap flex-col items-center justify-center rounded-full text-sm text-ink outline-none data-[outside-month]:text-muted/50 data-[hovered]:bg-line data-[pressed]:scale-95 data-[selected]:bg-accent data-[selected]:text-on-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[disabled]:opacity-40 data-[unavailable]:text-muted data-[unavailable]:line-through"
    >
      {({ formattedDate }) => (
        <>
          {formattedDate}
          {showIndicator ? (
            <span aria-hidden="true" className="absolute bottom-1 h-1 w-1 rounded-full bg-current" />
          ) : null}
        </>
      )}
    </RACCalendarCell>
  );
}
