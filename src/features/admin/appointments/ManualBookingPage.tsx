import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, SearchX, Stethoscope, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminLayout } from "../AdminLayout";
import { useResolvedAdminClinic } from "../AdminClinicContext";
import { useDoctor, useAppointmentTypes, type SlotRow } from "@/features/booking/queries";
import { DateTimeStep } from "@/features/booking/steps/DateTimeStep";
import { StepProgress } from "@/features/booking/StepProgress";
import { WizardHeader } from "@/features/booking/WizardHeader";
import { StepFooter } from "@/features/booking/StepFooter";
import { formatClinicDateLong } from "@/lib/tz";
import { usePatientSearch, useCreateGuestPatient, useBookAppointmentStaff } from "./queries";
import type { Tables } from "@/lib/database.types";

type Step = 0 | 1 | 2 | 3;

export function ManualBookingPage() {
  const navigate = useNavigate();
  const [announce, setAnnounce] = useState("");
  const [step, setStep] = useState<Step>(0);

  const { clinics, selectedId, setSelectedId, selectedClinic } = useResolvedAdminClinic();
  const doctorQuery = useDoctor(selectedClinic?.id);
  const typesQuery = useAppointmentTypes();

  const [patientMode, setPatientMode] = useState<"existente" | "nuevo">("existente");
  const [query, setQuery] = useState("");
  const [selectedExisting, setSelectedExisting] = useState<Tables<"patients"> | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [patient, setPatient] = useState<Tables<"patients"> | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [created, setCreated] = useState<Tables<"appointments"> | null>(null);

  const searchQuery = usePatientSearch(query);
  const createGuest = useCreateGuestPatient();
  const bookStaff = useBookAppointmentStaff();
  const selectedType = (typesQuery.data ?? []).find((t) => t.id === selectedTypeId) ?? null;
  const type = (typesQuery.data ?? []).find((t) => t.id === typeId) ?? null;

  async function onContinuePatient() {
    if (patientMode === "existente") {
      if (!selectedExisting) return;
      setPatient(selectedExisting);
      setStep(1);
      return;
    }
    if (!newName.trim()) return;
    try {
      const p = await createGuest.mutateAsync({ full_name: newName.trim(), contact_email: newEmail.trim() || undefined });
      setPatient(p);
      setStep(1);
    } catch {
      setAnnounce(es.citas.errorGenerico);
    }
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

  function onBack() {
    if (step === 0) navigate("/admin");
    else setStep((step - 1) as Step);
  }

  if (created) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-accent">
            <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h1 className="font-display mt-4 text-2xl text-ink">{es.admin.citaManual.creadaOk}</h1>
          <p className="mt-1 text-muted">
            {patient?.full_name} — {formatClinicDateLong(created.starts_at)}
          </p>
          <Button variant="primary" size="lg" className="mt-6 w-full" onPress={() => navigate("/admin")}>
            {es.admin.nav.hoy}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <WizardHeader
        title={es.admin.citaManual.titulo}
        onBack={onBack}
        onClose={() => navigate("/admin")}
        backLabel={es.reserva.atras}
        closeLabel={es.admin.citaManual.cerrarAria}
      />
      <StepProgress current={step} steps={es.admin.citaManual.pasos} label={es.admin.citaManual.titulo} />

      {step === 0 ? (
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="font-display text-2xl text-ink">{es.admin.citaManual.pacienteTitulo}</h2>

          {clinics.length > 1 ? (
            <div role="group" aria-label={es.admin.citaManual.elegirClinica} className="flex flex-wrap gap-2">
              {clinics.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                  className={`min-h-tap rounded-sm border px-3 py-1.5 text-sm ${c.id === selectedId ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}

          <SegmentedControl
            aria-label={es.admin.citaManual.pacienteTitulo}
            value={patientMode}
            onChange={(v) => {
              setPatientMode(v);
              setSelectedExisting(null);
            }}
            options={[
              { value: "existente", label: es.admin.citaManual.pacienteExistente },
              { value: "nuevo", label: es.admin.citaManual.pacienteNuevoTab },
            ]}
          />

          {patientMode === "existente" ? (
            <>
              <Field
                label={es.admin.citaManual.buscarPacienteLabel}
                inputProps={{
                  placeholder: es.admin.citaManual.buscarPacientePlaceholder,
                  value: query,
                  onChange: (e) => {
                    setQuery(e.target.value);
                    setSelectedExisting(null);
                  },
                }}
              />
              {query.trim().length >= 2 && searchQuery.isError ? (
                <ErrorState onRetry={() => searchQuery.refetch()} />
              ) : searchQuery.data && searchQuery.data.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {searchQuery.data.map((p) => (
                    <li key={p.id}>
                      <Card
                        selected={selectedExisting?.id === p.id}
                        onPress={() => setSelectedExisting(p)}
                        className="flex items-center gap-2"
                      >
                        <UserRound aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
                        {p.full_name}
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : query.trim().length >= 2 && searchQuery.data ? (
                <EmptyState icon={<SearchX aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />} title={es.admin.pacientes.sinResultados} />
              ) : null}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Field
                label={es.admin.citaManual.nombreNuevoLabel}
                isRequired
                inputProps={{ value: newName, onChange: (e) => setNewName(e.target.value) }}
              />
              <Field
                label={es.admin.citaManual.correoNuevoLabel}
                inputProps={{ type: "email", value: newEmail, onChange: (e) => setNewEmail(e.target.value) }}
              />
            </div>
          )}

          <StepFooter
            label={es.admin.citaManual.continuar}
            caption={patientMode === "existente" ? selectedExisting?.full_name : newName.trim() || undefined}
            isDisabled={patientMode === "existente" ? !selectedExisting : !newName.trim()}
            isPending={createGuest.isPending}
            onPress={onContinuePatient}
          />
        </div>
      ) : step === 1 ? (
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="font-display text-2xl text-ink">{es.admin.citaManual.tipoLabel}</h2>
          {typesQuery.isError ? (
            <ErrorState onRetry={() => typesQuery.refetch()} />
          ) : (
            <ul className="flex flex-col gap-2">
              {(typesQuery.data ?? []).map((t) => (
                <li key={t.id}>
                  <Card selected={selectedTypeId === t.id} onPress={() => setSelectedTypeId(t.id)} className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-on-accent-2">
                        <Stethoscope aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <span className="font-medium text-ink">{t.name}</span>
                    </span>
                    <span className="text-sm text-muted">{es.reserva.tipoDuracion(t.duration_min)}</span>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <StepFooter
            label={es.admin.citaManual.tipoBoton}
            caption={selectedType?.name}
            isDisabled={!selectedTypeId}
            onPress={() => {
              if (selectedTypeId) {
                setTypeId(selectedTypeId);
                setStep(2);
              }
            }}
          />
        </div>
      ) : step === 2 ? (
        selectedClinic && doctorQuery.isError ? (
          <ErrorState onRetry={() => doctorQuery.refetch()} />
        ) : selectedClinic && doctorQuery.data && typeId ? (
          <DateTimeStep
            dir={1}
            clinicId={selectedClinic.id}
            doctorId={doctorQuery.data.id}
            typeId={typeId}
            ignoreLeadTime
            confirmLabel={es.admin.citaManual.fechaBoton}
            onSelect={(s) => {
              setSlot(s);
              setStep(3);
            }}
          />
        ) : (
          <SkeletonCard />
        )
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="font-display text-2xl text-ink">{es.admin.citaManual.revisarTitulo}</h2>
          <Card>
            <dl className="flex flex-col gap-1">
              <div className="flex justify-between">
                <dt className="text-muted">{es.reserva.resumen.paciente}</dt>
                <dd className="font-medium text-ink">{patient?.full_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{es.reserva.resumen.tipo}</dt>
                <dd className="font-medium text-ink">{type?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{es.reserva.resumen.fecha}</dt>
                <dd className="font-medium text-ink">{slot ? formatClinicDateLong(slot.slot_start) : ""}</dd>
              </div>
            </dl>
          </Card>
          <StepFooter
            label={bookStaff.isPending ? es.admin.citaManual.creando : es.admin.citaManual.crear}
            isPending={bookStaff.isPending}
            onPress={onConfirm}
          />
        </div>
      )}

      <LiveRegion message={announce} assertive />
    </AdminLayout>
  );
}
