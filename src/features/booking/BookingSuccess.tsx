import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { es } from "@/i18n/es";
import { formatClinicDateLong } from "@/lib/tz";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { Button } from "@/components/ui/Button";
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
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.reserva.exitoTitulo}
      </h1>
      <p className="mt-1 text-muted">{es.reserva.exitoDescripcion}</p>
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
          <dt className="text-muted">Fecha</dt>
          <dd className="font-medium text-ink">{formatClinicDateLong(appointment.starts_at)}</dd>
        </div>
      </dl>
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
          {es.reserva.agregarCalendario}
        </Button>
        {clinic.maps_url ? (
          <Button variant="secondary" onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}>
            {es.reserva.comoLlegar}
          </Button>
        ) : null}
        {/* /citas llega en E3; por ahora el comprobante regresa a inicio. */}
        <Button variant="primary" onPress={() => navigate("/")}>
          {es.reserva.verMisCitas}
        </Button>
      </div>
      <LiveRegion message={announce} assertive />
    </div>
  );
}
