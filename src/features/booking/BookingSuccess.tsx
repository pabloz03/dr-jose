import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, MapPin } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong, formatClinicDateTime } from "@/lib/tz";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import type { Tables } from "@/lib/database.types";

export function BookingSuccess({
  appointment,
  patient,
  type,
  clinic,
}: {
  appointment: Tables<"appointments">;
  patient: Tables<"patients">;
  type: Tables<"appointment_types">;
  clinic: Tables<"clinics">;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const [announce] = useState(es.reserva.exitoTitulo);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const firstName = patient.full_name.trim().split(/\s+/)[0] ?? patient.full_name;
  const reference = `CITA ${appointment.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-accent">
        <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="font-display mt-4 text-2xl text-ink outline-none">
        {es.reserva.exitoTitulo}
      </h1>
      <p className="mt-1 text-muted">{es.reserva.exitoSubtitulo(firstName)}</p>

      <Card className="mt-6 w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono-nums text-xs text-muted">{reference}</span>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <p className="mt-2 font-medium text-ink">{formatClinicDateLong(appointment.starts_at)}</p>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm">
          <p className="text-ink">{type.name}</p>
          <p className="text-muted">{clinic.name}{clinic.address ? ` · ${clinic.address}` : ""}</p>
        </div>
      </Card>

      <div className="mt-4 flex w-full items-start gap-2 rounded-[var(--r-md)] bg-accent-3 p-4 text-left text-sm text-on-accent-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        <span>
          <span className="block font-medium">{es.reserva.recordatorioTitulo}</span>
          {es.reserva.recordatorioTexto}
        </span>
      </div>

      {clinic.maps_url ? (
        <Button
          variant="quiet"
          className="mt-3 self-center"
          onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}
        >
          <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.comoLlegar}
        </Button>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        className="mt-4 w-full"
        onPress={() =>
          downloadIcs(
            `${formatClinicDateTime(appointment.starts_at, "yyyy-MM-dd")}.ics`,
            buildIcs({
              uid: appointment.id,
              title: `${type.name} — ${clinic.name}`,
              location: clinic.address ?? undefined,
              startsAt: appointment.starts_at,
              endsAt: appointment.ends_at,
            }),
          )
        }
      >
        {es.reserva.agregarCalendario}
      </Button>
      <button
        type="button"
        onClick={() => navigate("/citas")}
        className="mt-3 min-h-tap text-sm text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {es.reserva.verMisCitas}
      </button>
      <LiveRegion message={announce} assertive />
    </div>
  );
}
