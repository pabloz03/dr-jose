import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, CheckCircle2, SearchX, Stethoscope, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminLayout } from "../AdminLayout";
import { useAdminClinicSelection } from "../useAdminClinicSelection";
import { useDoctor, useAppointmentTypes, type SlotRow } from "@/features/booking/queries";
import { DateTimeStep } from "@/features/booking/steps/DateTimeStep";
import { formatClinicDateLong } from "@/lib/tz";
import { usePatientSearch, useCreateGuestPatient, useBookAppointmentStaff } from "./queries";
import type { Tables } from "@/lib/database.types";

export function ManualBookingPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const [announce, setAnnounce] = useState("");

  const { selectedClinic } = useAdminClinicSelection();
  const doctorQuery = useDoctor(selectedClinic?.id);
  const typesQuery = useAppointmentTypes();

  const [query, setQuery] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [patient, setPatient] = useState<Tables<"patients"> | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [created, setCreated] = useState<Tables<"appointments"> | null>(null);

  const searchQuery = usePatientSearch(query);
  const createGuest = useCreateGuestPatient();
  const bookStaff = useBookAppointmentStaff();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function onCreateGuest() {
    if (!newName.trim()) return;
    const p = await createGuest.mutateAsync({ full_name: newName.trim(), contact_email: newEmail.trim() || undefined });
    setPatient(p);
  }

  async function onConfirm() {
    if (!patient || !typeId || !selectedClinic || !doctorQuery.data || !slot) return;
    try {
      const appointment = await bookStaff.mutateAsync({
        patientId: patient.id,
        typeId,
        clinicId: selectedClinic.id,
        doctorId: doctorQuery.data.id,
        start: slot.slot_start,
      });
      setCreated(appointment);
      setAnnounce(es.admin.citaManual.creadaOk);
    } catch {
      setAnnounce(es.citas.errorGenerico);
    }
  }

  if (created) {
    return (
      <AdminLayout>
        <Eyebrow>{es.admin.citaManual.eyebrow}</Eyebrow>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
        >
          <CheckCircle2 aria-hidden="true" className="h-7 w-7 text-success" strokeWidth={2.25} />
          {es.admin.citaManual.creadaOk}
        </h1>
        <p className="mt-3 text-ink">
          {patient?.full_name} — {formatClinicDateLong(created.starts_at)}
        </p>
        <Button variant="primary" className="mt-6" onPress={() => navigate("/admin")}>
          {es.admin.nav.hoy}
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Eyebrow>{es.admin.citaManual.eyebrow}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
      >
        <CalendarPlus aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {es.admin.citaManual.titulo}
      </h1>

      {!patient ? (
        <div className="mt-6 flex flex-col gap-4">
          <Field
            label={es.admin.citaManual.buscarPacienteLabel}
            inputProps={{
              placeholder: es.admin.citaManual.buscarPacientePlaceholder,
              value: query,
              onChange: (e) => setQuery(e.target.value),
            }}
          />
          {searchQuery.data && searchQuery.data.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {searchQuery.data.map((p) => (
                <li key={p.id}>
                  <Card onPress={() => setPatient(p)} className="flex items-center gap-2">
                    <UserRound aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
                    {p.full_name}
                  </Card>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 && searchQuery.data ? (
            <EmptyState
              icon={<SearchX aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
              title={es.admin.pacientes.sinResultados}
            />
          ) : null}

          <Checkbox isSelected={isNewPatient} onChange={setIsNewPatient}>
            {es.admin.citaManual.pacienteNuevo}
          </Checkbox>
          {isNewPatient ? (
            <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
              <Field
                label={es.admin.citaManual.nombreNuevoLabel}
                isRequired
                inputProps={{ value: newName, onChange: (e) => setNewName(e.target.value) }}
              />
              <Field
                label={es.admin.citaManual.correoNuevoLabel}
                inputProps={{ type: "email", value: newEmail, onChange: (e) => setNewEmail(e.target.value) }}
              />
              <Button
                variant="primary"
                onPress={onCreateGuest}
                isDisabled={!newName.trim()}
                isPending={createGuest.isPending}
                className="self-start"
              >
                {es.admin.citaManual.continuar}
              </Button>
            </div>
          ) : null}
        </div>
      ) : !typeId ? (
        <div className="mt-6">
          <p className="text-ink">
            {es.admin.citaManual.buscarPacienteLabel}: <strong>{patient.full_name}</strong>
          </p>
          <h2 className="font-display mt-5 flex items-center gap-1.5 text-lg text-ink">
            <Stethoscope aria-hidden="true" className="h-4 w-4 text-accent" strokeWidth={2.25} />
            {es.admin.citaManual.tipoLabel}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(typesQuery.data ?? []).map((t) => (
              <li key={t.id}>
                <Card onPress={() => setTypeId(t.id)}>
                  {t.name} <span className="text-sm text-muted">({t.duration_min} min)</span>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : !slot ? (
        selectedClinic && doctorQuery.data ? (
          <div className="mt-6">
            <DateTimeStep
              dir={1}
              clinicId={selectedClinic.id}
              doctorId={doctorQuery.data.id}
              typeId={typeId}
              ignoreLeadTime
              onSelect={setSlot}
            />
          </div>
        ) : (
          <div className="mt-6">
            <SkeletonCard />
          </div>
        )
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <Card>
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt className="text-muted">Paciente</dt>
                <dd className="font-medium text-ink">{patient.full_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Fecha</dt>
                <dd className="font-medium text-ink">{formatClinicDateLong(slot.slot_start)}</dd>
              </div>
            </dl>
          </Card>
          <Button variant="primary" onPress={onConfirm} isPending={bookStaff.isPending} className="self-start">
            {bookStaff.isPending ? es.admin.citaManual.creando : es.admin.citaManual.crear}
          </Button>
        </div>
      )}

      <LiveRegion message={announce} assertive />
    </AdminLayout>
  );
}
