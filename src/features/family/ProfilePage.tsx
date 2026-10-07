import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ShieldCheck, User, Users } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { formatClinicDateTime } from "@/lib/tz";
import { useProfile, useSaveProfile } from "./queries";
import { profileFormSchema, type ProfileFormValues } from "./schemas";
import { PatientList } from "./PatientList";
import { ClaimGuestPatientsBanner } from "./ClaimGuestPatientsBanner";

export function ProfilePage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const profileQuery = useProfile();
  const saveProfile = useSaveProfile();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const { control, register, handleSubmit, reset, formState } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { full_name: "", phone: "", consent: false },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        full_name: profileQuery.data.full_name ?? "",
        phone: profileQuery.data.phone ?? "",
        consent: !!profileQuery.data.privacy_consent_at,
      });
    }
  }, [profileQuery.data, reset]);

  async function onSubmit(values: ProfileFormValues) {
    const existingConsentAt = profileQuery.data?.privacy_consent_at ?? null;
    await saveProfile.mutateAsync({
      full_name: values.full_name,
      phone: values.phone || null,
      privacy_consent_at: existingConsentAt ?? new Date().toISOString(),
    });
    setAnnounce(es.perfil.guardadoOk);
  }

  const consentAt = profileQuery.data?.privacy_consent_at;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <User className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.perfil.titulo}
      </h1>

      <ClaimGuestPatientsBanner />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-ink">{es.perfil.datosTitulo}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field
            label={es.perfil.nombreLabel}
            isRequired
            isInvalid={!!formState.errors.full_name}
            errorMessage={formState.errors.full_name?.message}
            inputProps={register("full_name")}
          />
          <Field
            label={es.perfil.telefonoLabel}
            description={es.perfil.telefonoAyuda}
            inputProps={{ type: "tel", autoComplete: "tel", ...register("phone") }}
          />

          <Card>
            <h3 className="flex items-center gap-1.5 font-medium text-ink">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
              {es.perfil.consentimientoTitulo}
            </h3>
            <p className="mt-1 text-sm text-muted">{es.perfil.consentimientoTexto}</p>
            <div className="mt-3">
              <Controller
                control={control}
                name="consent"
                render={({ field }) => (
                  <Checkbox
                    isSelected={field.value}
                    onChange={field.onChange}
                    errorMessage={formState.errors.consent?.message}
                  >
                    {es.perfil.consentimientoCheckbox}
                  </Checkbox>
                )}
              />
              {consentAt ? (
                <p className="mt-2 text-sm text-muted">{es.perfil.aceptadoEl(formatClinicDateTime(consentAt, "d/MM/yyyy HH:mm"))}</p>
              ) : null}
            </div>
          </Card>

          <Button type="submit" variant="primary" isPending={formState.isSubmitting} className="self-start">
            {es.common.guardar}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="font-display flex items-center gap-2 text-lg text-ink">
          <Users className="h-5 w-5 text-accent" strokeWidth={2.25} aria-hidden="true" />
          {es.familia.tituloSeccion}
        </h2>
        <p className="text-sm text-muted">{es.familia.descripcion}</p>
        <PatientList />
      </section>

      <LiveRegion message={announce} />
    </main>
  );
}
