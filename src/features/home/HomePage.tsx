import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, MapPin, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { useProfile } from "@/features/family/queries";
import { useAppointments, type AppointmentWithDetails } from "@/features/appointments/queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

const UPCOMING_STATUSES = new Set(["scheduled", "confirmed"]);

function findNextAppointment(appointments: AppointmentWithDetails[]): AppointmentWithDetails | null {
  const now = new Date();
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.has(a.status) && new Date(a.starts_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcoming[0] ?? null;
}

/**
 * Punto focal de Inicio: foto + insignia superpuesta, con el contenido
 * debajo en la misma tarjeta — mismo tratamiento tenga o no una
 * próxima cita (solo cambia el titular/CTA). Reemplaza el bloque
 * sólido "--hero-*" de la fase 1 del rediseño, que no tenía
 * equivalente en el Figma de referencia.
 */
function HeroCard({ appointment }: { appointment: AppointmentWithDetails | null }) {
  const navigate = useNavigate();
  return (
    <section className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-surface">
      <div className="relative">
        <img src="/images/clinica-atencion.jpg" alt={es.auth.fotoAlt} className="h-40 w-full object-cover" />
        <span className="absolute bottom-3 left-3 rounded-[var(--r-pill)] bg-accent-2 px-3 py-1 text-xs font-semibold tracking-wide text-on-accent-2 uppercase">
          {es.home.insignia}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {appointment ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl text-ink">{appointment.type.name}</p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <div className="flex flex-col gap-1.5 text-sm text-muted">
              <p className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                {appointment.clinic.name}
              </p>
            </div>
            <Button variant="primary" size="lg" className="w-full" onPress={() => navigate(`/citas/${appointment.id}`)}>
              {es.citas.verDetalle}
            </Button>
          </>
        ) : (
          <>
            <p className="font-display text-xl text-ink">{es.home.heroTitulo}</p>
            <p className="text-sm text-muted">{es.home.heroDescripcion}</p>
            <Button variant="primary" size="lg" className="w-full" onPress={() => navigate("/citas/nueva")}>
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              {es.citas.reservarCta}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function AyudaCard() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/ayuda")}
      className="flex w-full items-center gap-3 rounded-[var(--r-lg)] bg-accent-3 p-4 text-left text-on-accent-3 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span className="flex flex-col">
        <span className="font-medium">{es.home.ayudaCardTitulo}</span>
        <span className="text-sm opacity-80">{es.home.ayudaCardDescripcion}</span>
      </span>
    </button>
  );
}

function AdminAccessCard() {
  const navigate = useNavigate();
  return (
    <Card onPress={() => navigate("/admin")} className="flex items-start gap-3">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
      <span className="flex flex-col">
        <span className="font-medium text-ink">{es.home.administracion}</span>
        <span className="text-sm text-muted">{es.home.administracionDescripcion}</span>
      </span>
    </Card>
  );
}

export function HomePage() {
  const staffQuery = useMyStaff();
  const profileQuery = useProfile();
  const appointmentsQuery = useAppointments();
  const isStaff = !!staffQuery.data;
  const firstName = profileQuery.data?.full_name?.trim().split(/\s+/)[0];

  const nextAppointment = useMemo(
    () => findNextAppointment(appointmentsQuery.data ?? []),
    [appointmentsQuery.data],
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 py-8">
      <header>
        <Eyebrow>{es.app.name}</Eyebrow>
        <h1 className="font-display mt-1 text-3xl text-ink">{firstName ? es.home.saludo(firstName) : es.home.saludoGenerico}</h1>
        <p className="mt-1 text-muted">{es.home.subtitulo}</p>
      </header>

      {appointmentsQuery.isLoading ? (
        <SkeletonCard />
      ) : appointmentsQuery.isError ? (
        <ErrorState onRetry={() => appointmentsQuery.refetch()} />
      ) : (
        <HeroCard appointment={nextAppointment} />
      )}

      <AyudaCard />

      {isStaff ? <AdminAccessCard /> : null}

      <Button
        variant="secondary"
        className="self-start"
        onPress={async () => {
          await supabase.auth.signOut();
        }}
      >
        <LogOut className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {es.home.cerrarSesion}
      </Button>
    </main>
  );
}
