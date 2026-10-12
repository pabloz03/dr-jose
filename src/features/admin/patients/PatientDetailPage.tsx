import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Cake, Calendar, Mail, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { formatClinicDateTime } from "@/lib/tz";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { usePatient, usePatientAppointments } from "./queries";
import { AppointmentStatusBadge } from "@/features/appointments/AppointmentStatusBadge";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const patientQuery = usePatient(id);
  const appointmentsQuery = usePatientAppointments(id);
  const patient = patientQuery.data;

  // El <h1> real solo existe una vez que `patient` llega (antes se
  // muestra SkeletonCard, sin heading) — depender de `patient`, no de
  // `[]`, para que el foco sí llegue ahí tras la carga asíncrona.
  useEffect(() => {
    if (patient) headingRef.current?.focus();
  }, [patient]);

  const appointments = appointmentsQuery.data ?? [];
  const isLoading = patientQuery.isLoading || appointmentsQuery.isLoading;
  const isError = patientQuery.isError || appointmentsQuery.isError;

  function retry() {
    patientQuery.refetch();
    appointmentsQuery.refetch();
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <SkeletonCard />
      </AdminLayout>
    );
  }

  if (isError || !patient) {
    return (
      <AdminLayout>
        <ErrorState onRetry={retry} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>{es.admin.pacienteDetalle.eyebrow}</Eyebrow>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
          >
            <UserRound aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
            {patient.full_name}
          </h1>
        </div>
        {!patient.guardian_user_id ? <Badge tone="neutral" icon="●">{es.admin.pacientes.invitado}</Badge> : null}
      </div>

      <Card className="mt-6">
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Mail aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              {es.admin.pacienteDetalle.correoLabel}
            </dt>
            <dd className="font-medium text-ink">{patient.contact_email ?? es.admin.pacienteDetalle.sinCorreo}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-muted">
              <Cake aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              {es.admin.pacienteDetalle.fechaNacimientoLabel}
            </dt>
            <dd className="font-medium text-ink">
              {patient.birth_date
                ? formatClinicDateTime(`${patient.birth_date}T12:00:00Z`, "d 'de' MMMM 'de' yyyy")
                : es.admin.pacienteDetalle.sinFechaNacimiento}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">
          {es.admin.pacienteDetalle.pacienteDesde(formatClinicDateTime(patient.created_at, "d 'de' MMMM 'de' yyyy"))}
        </p>
      </Card>

      <section className="mt-8">
        <h2 className="font-display flex items-center gap-2 text-lg text-ink">
          <Calendar aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={2.25} />
          {es.admin.pacienteDetalle.citasTitulo}
        </h2>
        {appointments.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Calendar aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
              title={es.admin.pacienteDetalle.sinCitas}
            />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {appointments.map((a) => (
              <li key={a.id}>
                <Card onPress={() => navigate(`/admin/citas/${a.id}`)}>
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <span className="font-medium text-ink">{formatClinicDateTime(a.starts_at, "d 'de' MMMM, h:mm a")}</span>
                      <span className="block text-sm text-muted">
                        {a.type.name} — {a.clinic.name}
                      </span>
                    </span>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate("/admin/pacientes")}
        className="mt-6 inline-flex min-h-tap items-center gap-1 self-start text-sm text-accent underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
        {es.admin.pacienteDetalle.volver}
      </button>
    </AdminLayout>
  );
}
