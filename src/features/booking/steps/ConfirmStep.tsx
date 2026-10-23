import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Building2, Info, Pencil, Stethoscope } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { formatClinicDateLong, formatClinicDateTime } from "@/lib/tz";
import { Card } from "@/components/ui/Card";
import { StepFooter } from "../StepFooter";
import type { SlotRow } from "../queries";
import type { Tables } from "@/lib/database.types";

export function ConfirmStep({
  dir,
  patient,
  type,
  doctor,
  clinic,
  slot,
  minCancelHours,
  maxBookingDays,
  isPending,
  isError,
  onConfirm,
  onEditDateTime,
  onEditPatient,
}: {
  dir: 1 | -1;
  patient: Tables<"patients">;
  type: Tables<"appointment_types">;
  doctor?: { full_name: string };
  clinic: Tables<"clinics">;
  slot: SlotRow;
  minCancelHours: number;
  maxBookingDays: number;
  isPending: boolean;
  isError: boolean;
  onConfirm: () => void;
  onEditDateTime?: () => void;
  onEditPatient?: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const month = formatClinicDateTime(slot.slot_start, "MMM").replace(".", "").toUpperCase();
  const day = formatClinicDateTime(slot.slot_start, "d");

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" className="flex flex-1 flex-col">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
        {es.reserva.confirmarTitulo}
      </h2>

      <Card className="mt-6">
        <div className="flex items-start gap-3">
          <span className="flex w-12 shrink-0 flex-col items-center justify-center rounded-[var(--r-sm)] bg-accent-2 py-1.5 text-on-accent-2">
            <span className="text-[10px] font-semibold leading-none">{month}</span>
            <span className="font-display text-lg leading-tight">{day}</span>
          </span>
          <span className="flex-1">
            <span className="block font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</span>
          </span>
          {onEditDateTime ? (
            <button
              type="button"
              onClick={onEditDateTime}
              aria-label={es.common.editar}
              className="flex min-h-tap min-w-tap shrink-0 items-center justify-center text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
          <div className="flex items-start gap-2">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
            <span>
              <span className="block font-medium text-ink">{type.name}</span>
              <span className="block text-sm text-muted">
                {doctor ? `${doctor.full_name} · ` : ""}
                {es.reserva.tipoDuracion(type.duration_min)}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
            <span>
              <span className="block font-medium text-ink">{clinic.name}</span>
              {clinic.address ? <span className="block text-sm text-muted">{clinic.address}</span> : null}
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{es.reserva.resumen.paciente}</p>
        {onEditPatient ? (
          <button
            type="button"
            onClick={onEditPatient}
            className="min-h-tap text-sm text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {es.common.editar}
          </button>
        ) : null}
      </div>
      <p className="mt-1 font-medium text-ink">{patient.full_name}</p>

      <ul className="mt-4 flex flex-col gap-1.5 text-sm text-muted">
        <li className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.reglasAnticipacion(minCancelHours)}
        </li>
        <li className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.reglasVentana(maxBookingDays)}
        </li>
      </ul>
      {isError ? (
        <p className="mt-3 text-danger" role="alert">
          {es.reserva.errorGenerico}
        </p>
      ) : null}

      <StepFooter
        label={isPending ? es.reserva.confirmando : es.reserva.confirmarBoton}
        onPress={onConfirm}
        isPending={isPending}
      />
    </motion.div>
  );
}
