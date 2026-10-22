import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Clock, LogOut, MapPin, ShieldCheck } from "lucide-react";
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
import { EmptyState } from "@/components/ui/EmptyState";
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
 * Punto focal "hero" (influencia Nike): bloque sólido oscuro fijo —
 * --hero-* no cambia con el tema claro/oscuro (tokens.css), a
 * propósito, para que siga siendo el mismo momento de marca sin
 * importar la preferencia del dispositivo. Único lugar de la app
 * paciente con este tratamiento.
 */
function NextAppointmentCard({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col gap-4 rounded-[var(--r-lg)] bg-[var(--hero-bg)] p-6 text-[var(--hero-ink)] shadow-[var(--shadow-2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow onDark>{es.home.proximaCitaTitulo}</Eyebrow>
          <p className="font-display mt-1 text-xl">
            {appointment.type.name} — {appointment.patient.full_name}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} onDark />
      </div>
      <div className="flex flex-col gap-1.5 text-[var(--hero-ink)]/80">
        <p className="flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
        </p>
        <p className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {appointment.clinic.name}
        </p>
      </div>
      <Button variant="hero" className="self-start" onPress={() => navigate(`/citas/${appointment.id}`)}>
        {es.citas.verDetalle}
      </Button>
    </section>
  );
}

function EmptyNextAppointment() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={<CalendarCheck className="h-8 w-8" strokeWidth={2.25} />}
      title={es.home.sinProximaCitaTitulo}
      description={es.home.sinProximaCitaDescripcion}
      action={{ label: es.citas.reservarCta, onPress: () => navigate("/citas/nueva") }}
    />
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
        <Eyebrow>{es.home.navInicio}</Eyebrow>
        <h1 className="font-display mt-1 text-3xl text-ink">{firstName ? es.home.saludo(firstName) : es.home.saludoGenerico}</h1>
        <p className="mt-1 text-muted">{es.home.subtitulo}</p>
      </header>

      {appointmentsQuery.isLoading ? (
        <SkeletonCard />
      ) : appointmentsQuery.isError ? (
        <ErrorState onRetry={() => appointmentsQuery.refetch()} />
      ) : nextAppointment ? (
        <NextAppointmentCard appointment={nextAppointment} />
      ) : (
        <EmptyNextAppointment />
      )}

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
