import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Building2, Calendar, Info, Stethoscope, User } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { formatClinicDateLong } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
        {es.reserva.confirmarTitulo}
      </h2>
      <Card className="mt-6">
        <dl className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <User className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.paciente}
            </dt>
            <dd className="font-medium text-ink">{patient.full_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Stethoscope className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.tipo}
            </dt>
            <dd className="font-medium text-ink">{type.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Building2 className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.clinica}
            </dt>
            <dd className="font-medium text-ink">{clinic.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.fecha}
            </dt>
            <dd className="font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</dd>
          </div>
        </dl>
      </Card>
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
      <Button variant="primary" className="mt-6" onPress={onConfirm} isPending={isPending}>
        {isPending ? es.reserva.confirmando : es.reserva.confirmarBoton}
      </Button>
    </motion.div>
  );
}
