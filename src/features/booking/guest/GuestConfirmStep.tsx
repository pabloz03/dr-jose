import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Building2, Calendar, Info, Mail, Stethoscope, User } from "lucide-react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { formatClinicDateLong } from "@/lib/tz";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SlotRow } from "@/features/booking/queries";
import type { GuestClinic, GuestType } from "./queries";

export function GuestConfirmStep({
  dir,
  fullName,
  contactEmail,
  type,
  clinic,
  slot,
  minCancelHours,
  maxBookingDays,
  isPending,
  errorCode,
  onConfirm,
}: {
  dir: 1 | -1;
  fullName: string;
  contactEmail: string;
  type: GuestType;
  clinic: GuestClinic;
  slot: SlotRow;
  minCancelHours: number;
  maxBookingDays: number;
  isPending: boolean;
  errorCode: string | null;
  onConfirm: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const errorMessage =
    errorCode === "slot_unavailable"
      ? es.reservaInvitado.errorSlotTomado
      : errorCode === "rate_limited"
        ? es.reservaInvitado.errorRateLimited
        : errorCode === "invalid_input"
          ? es.reservaInvitado.errorInvalido
          : errorCode
            ? es.reservaInvitado.errorGenerico
            : null;

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reservaInvitado.confirmarTitulo}
      </h2>
      <Card className="mt-4">
        <dl className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <User className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.paciente}
            </dt>
            <dd className="font-medium text-ink">{fullName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Mail className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {es.reserva.resumen.correo}
            </dt>
            <dd className="font-medium text-ink">{contactEmail}</dd>
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
      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
        <li className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {es.reservaInvitado.confirmarDescripcion}
        </li>
        <li className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.reglasAnticipacion(minCancelHours)}
        </li>
        <li className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.reglasVentana(maxBookingDays)}
        </li>
      </ul>
      {errorMessage ? (
        <p className="mt-3 text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <Button variant="primary" size="lg" className="mt-4 w-full" onPress={onConfirm} isPending={isPending}>
        {isPending ? es.reservaInvitado.confirmando : es.reservaInvitado.confirmarBoton}
      </Button>
    </motion.div>
  );
}
