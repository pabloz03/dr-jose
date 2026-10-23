import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, MapPin } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateLong, formatClinicDateTime } from "@/lib/tz";
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
  const [announce] = useState(es.reserva.exitoTitulo);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;
  const reference = `CITA ${appointmentId.slice(0, 8).toUpperCase()}`;

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
        <span className="font-mono-nums text-xs text-muted">{reference}</span>
        <p className="mt-2 font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</p>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm">
          <p className="text-ink">{type.name}</p>
          <p className="text-muted">{clinic.name}{clinic.address ? ` · ${clinic.address}` : ""}</p>
        </div>
      </Card>

      <p className="mt-3 w-full text-left text-sm text-muted">{es.reservaInvitado.exitoDescripcion(contactEmail)}</p>

      {clinic.maps_url ? (
        <Button variant="quiet" className="mt-3 self-center" onPress={() => window.open(clinic.maps_url!, "_blank", "noopener")}>
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
            `${formatClinicDateTime(slot.slot_start, "yyyy-MM-dd")}.ics`,
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
        {es.reserva.agregarCalendario}
      </Button>

      <Card className="mt-6 w-full text-left">
        <h2 className="font-display text-base text-ink">{es.reservaInvitado.crearCuentaTitulo}</h2>
        <p className="mt-1 text-sm text-muted">{es.reservaInvitado.crearCuentaDescripcion}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onPress={() =>
              navigate("/crear-cuenta", { state: { prefillEmail: contactEmail, prefillFullName: fullName } })
            }
          >
            {es.reservaInvitado.crearCuentaBoton}
          </Button>
          <Button
            variant="quiet"
            className="self-center"
            onPress={() => navigate("/ingresar", { state: { prefillEmail: contactEmail } })}
          >
            {es.reservaInvitado.volverAIngresar}
          </Button>
        </div>
      </Card>

      <LiveRegion message={announce} assertive />
    </div>
  );
}
