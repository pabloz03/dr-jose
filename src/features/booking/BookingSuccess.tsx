import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2, CalendarPlus, MapPin } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong } from "@/lib/tz";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
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

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <CalendarCheck2 className="h-6 w-6 text-success" strokeWidth={2.25} aria-hidden="true" />
        {es.reserva.exitoTitulo}
      </h1>
      <p className="mt-1 text-muted">{es.reserva.exitoDescripcion}</p>
      <Card className="mt-4">
        <dl className="flex flex-col gap-1">
          <div className="flex justify-between">
            <dt className="text-muted">Paciente</dt>
            <dd className="font-medium text-ink">{patient.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tipo</dt>
            <dd className="font-medium text-ink">{type.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Fecha</dt>
            <dd className="font-medium text-ink">{formatClinicDateLong(appointment.starts_at)}</dd>
          </div>
        </dl>
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onPress={() =>
            downloadIcs(
              "cita.ics",
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
          <CalendarPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {es.reserva.agregarCalendario}
        </Button>
        {clinic.maps_url ? (
          <Button variant="secondary" onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}>
            <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            {es.reserva.comoLlegar}
          </Button>
        ) : null}
        <Button variant="primary" onPress={() => navigate("/citas")}>
          {es.reserva.verMisCitas}
        </Button>
      </div>
      <LiveRegion message={announce} assertive />
    </div>
  );
}
