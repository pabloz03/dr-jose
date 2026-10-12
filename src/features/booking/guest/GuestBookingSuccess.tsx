import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2, CalendarPlus, MapPin } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong } from "@/lib/tz";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import type { SlotRow } from "@/features/booking/queries";
import type { GuestClinic, GuestType } from "./queries";

export function GuestBookingSuccess({
  appointmentId,
  fullName,
  contactEmail,
  type,
  clinic,
  slot,
}: {
  appointmentId: string;
  fullName: string;
  contactEmail: string;
  type: GuestType;
  clinic: GuestClinic;
  slot: SlotRow;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const [announce] = useState(es.reservaInvitado.exitoTitulo);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <CalendarCheck2 className="h-6 w-6 text-success" strokeWidth={2.25} aria-hidden="true" />
        {es.reservaInvitado.exitoTitulo}
      </h1>
      <p className="mt-1 text-muted">{es.reservaInvitado.exitoDescripcion(contactEmail)}</p>
      <Card className="mt-4">
        <dl className="flex flex-col gap-1">
          <div className="flex justify-between">
            <dt className="text-muted">{es.reserva.resumen.paciente}</dt>
            <dd className="font-medium text-ink">{fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{es.reserva.resumen.tipo}</dt>
            <dd className="font-medium text-ink">{type.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{es.reserva.resumen.fecha}</dt>
            <dd className="font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</dd>
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
                uid: appointmentId,
                title: `${type.name} — ${clinic.name}`,
                location: clinic.address ?? undefined,
                startsAt: slot.slot_start,
                endsAt: slot.slot_end,
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
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-base text-ink">{es.reservaInvitado.crearCuentaTitulo}</h2>
        <p className="mt-1 text-sm text-muted">{es.reservaInvitado.crearCuentaDescripcion}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onPress={() =>
              navigate("/crear-cuenta", { state: { prefillEmail: contactEmail, prefillFullName: fullName } })
            }
          >
            {es.reservaInvitado.crearCuentaBoton}
          </Button>
          <Button variant="quiet" onPress={() => navigate("/ingresar", { state: { prefillEmail: contactEmail } })}>
            {es.reservaInvitado.volverAIngresar}
          </Button>
        </div>
      </Card>

      <LiveRegion message={announce} assertive />
    </div>
  );
}
