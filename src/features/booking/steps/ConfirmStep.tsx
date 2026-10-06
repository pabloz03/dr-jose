import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { formatClinicDateLong } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import type { SlotRow } from "../queries";
import type { Tables } from "@/lib/database.types";

export function ConfirmStep({
  dir,
  patient,
  type,
  clinic,
  slot,
  minCancelHours,
  maxBookingDays,
  isPending,
  isError,
  onConfirm,
}: {
  dir: 1 | -1;
  patient: Tables<"patients">;
  type: Tables<"appointment_types">;
  clinic: Tables<"clinics">;
  slot: SlotRow;
  minCancelHours: number;
  maxBookingDays: number;
  isPending: boolean;
  isError: boolean;
  onConfirm: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
        {es.reserva.confirmarTitulo}
      </h2>
      <dl className="mt-4 flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
        <div className="flex justify-between">
          <dt className="text-muted">Paciente</dt>
          <dd className="font-medium text-ink">{patient.full_name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Tipo</dt>
          <dd className="font-medium text-ink">{type.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Clínica</dt>
          <dd className="font-medium text-ink">{clinic.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Fecha</dt>
          <dd className="font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</dd>
        </div>
      </dl>
      <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
        <li>{es.reserva.reglasAnticipacion(minCancelHours)}</li>
        <li>{es.reserva.reglasVentana(maxBookingDays)}</li>
      </ul>
      {isError ? (
        <p className="mt-3 text-danger" role="alert">
          {es.reserva.errorGenerico}
        </p>
      ) : null}
      <Button variant="primary" className="mt-4" onPress={onConfirm} isPending={isPending}>
        {isPending ? es.reserva.confirmando : es.reserva.confirmarBoton}
      </Button>
    </motion.div>
  );
}
