import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarPlus,
  Clock,
  HelpCircle,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { useMyStaff } from "@/features/auth/useMyStaff";
import { useAppointments, type AppointmentWithDetails } from "@/features/appointments/queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GlassSurface } from "@/components/ui/GlassSurface";

const UPCOMING_STATUSES = new Set(["scheduled", "confirmed"]);

function findNextAppointment(appointments: AppointmentWithDetails[]): AppointmentWithDetails | null {
  const now = new Date();
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.has(a.status) && new Date(a.starts_at) >= now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcoming[0] ?? null;
}

function NextAppointmentCard({ appointment }: { appointment: AppointmentWithDetails }) {
  const navigate = useNavigate();
  return (
    <GlassSurface as="section" className="flex flex-col gap-4 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-lg text-ink">
          <CalendarCheck className="h-5 w-5 text-accent" strokeWidth={2.25} aria-hidden="true" />
          {es.home.proximaCitaTitulo}
        </h2>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="font-medium text-ink">
          {appointment.type.name} — {appointment.patient.full_name}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {formatClinicDateTime(appointment.starts_at, "EEEE d 'de' MMMM, h:mm a")}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {appointment.clinic.name}
        </p>
      </div>
      <Button variant="primary" className="self-start" onPress={() => navigate(`/citas/${appointment.id}`)}>
        {es.citas.verDetalle}
      </Button>
    </GlassSurface>
  );
}

function EmptyNextAppointment() {
  const navigate = useNavigate();
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 className="font-display flex items-center gap-2 text-lg text-ink">
        <CalendarCheck className="h-5 w-5 text-muted" strokeWidth={2.25} aria-hidden="true" />
        {es.home.sinProximaCitaTitulo}
      </h2>
      <p className="text-muted">{es.home.sinProximaCitaDescripcion}</p>
      <Button variant="primary" onPress={() => navigate("/citas/nueva")}>
        <CalendarPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        {es.citas.reservarCta}
      </Button>
    </Card>
  );
}

function NavTile({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  description: string;
}) {
  const navigate = useNavigate();
  return (
    <Card onPress={() => navigate(to)} className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-sm text-muted">{description}</span>
      </span>
    </Card>
  );
}

export function HomePage() {
  const staffQuery = useMyStaff();
  const appointmentsQuery = useAppointments();
  const isStaff = !!staffQuery.data;

  const nextAppointment = useMemo(
    () => findNextAppointment(appointmentsQuery.data ?? []),
    [appointmentsQuery.data],
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl text-ink">{es.app.name}</h1>
        <p className="mt-1 text-muted">{es.home.subtitulo}</p>
      </header>

      {appointmentsQuery.isLoading ? (
        <Card>
          <p className="text-muted" role="status">
            {es.common.cargando}
          </p>
        </Card>
      ) : nextAppointment ? (
        <NextAppointmentCard appointment={nextAppointment} />
      ) : (
        <EmptyNextAppointment />
      )}

      <nav aria-label={es.app.name} className="flex flex-col gap-3">
        <NavTile
          to="/citas/nueva"
          icon={<CalendarPlus className="h-5 w-5" strokeWidth={2.25} />}
          label={es.citas.reservarCta}
          description={es.home.navReservarDescripcion}
        />
        <NavTile
          to="/citas"
          icon={<CalendarCheck className="h-5 w-5" strokeWidth={2.25} />}
          label={es.citas.titulo}
          description={es.home.navMisCitasDescripcion}
        />
        <NavTile
          to="/perfil"
          icon={<User className="h-5 w-5" strokeWidth={2.25} />}
          label={es.perfil.titulo}
          description={es.home.navPerfilDescripcion}
        />
        <NavTile
          to="/ayuda"
          icon={<HelpCircle className="h-5 w-5" strokeWidth={2.25} />}
          label={es.ayuda.titulo}
          description={es.home.navAyudaDescripcion}
        />
        {isStaff ? (
          <NavTile
            to="/admin"
            icon={<ShieldCheck className="h-5 w-5" strokeWidth={2.25} />}
            label={es.home.administracion}
            description={es.home.administracionDescripcion}
          />
        ) : null}
      </nav>

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
