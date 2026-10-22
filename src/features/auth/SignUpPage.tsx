import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card } from "@/components/ui/Card";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { signUpSchema, type SignUpValues } from "./schemas";

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const prefill = (location.state as { prefillEmail?: string; prefillFullName?: string } | null) ?? {};
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { control, register, handleSubmit, formState, reset } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "", consent: false },
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (prefill.prefillEmail || prefill.prefillFullName) {
      reset({
        full_name: prefill.prefillFullName ?? "",
        email: prefill.prefillEmail ?? "",
        password: "",
        confirmPassword: "",
        consent: false,
      });
    }
  }, [prefill.prefillEmail, prefill.prefillFullName, reset]);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password });
    if (error) {
      if (error.status === 429) setFormError(es.auth.errorLimite);
      else if (error.code === "user_already_exists") setFormError(es.auth.errorCorreoRegistrado);
      else setFormError(es.auth.errorRegistro);
      return;
    }
    // Algunas configuraciones de GoTrue responden sin error pero sin
    // sesión cuando el correo ya tiene una cuenta confirmada (para no
    // delatar por un canal distinto que ya existe) — sin esto, el alta
    // se vería "exitosa" y luego RequireAuth rebotaría a /ingresar en
    // silencio, el mismo tipo de cuelgue silencioso ya corregido en
    // otras pantallas de la app.
    if (!data.session || !data.user) {
      setFormError(es.auth.errorCorreoRegistrado);
      return;
    }
    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: data.user.id,
      full_name: values.full_name,
      privacy_consent_at: new Date().toISOString(),
    });
    if (profileError) {
      setFormError(es.auth.errorRegistro);
      return;
    }
    setAnnounce(es.auth.sesionIniciada);
    navigate("/perfil", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <UserPlus className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.auth.tituloRegistro}
      </h1>
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.perfil.nombreLabel}
          isRequired
          isInvalid={!!formState.errors.full_name}
          errorMessage={formState.errors.full_name?.message}
          inputProps={{ autoComplete: "name", ...register("full_name") }}
        />
        <Field
          label={es.auth.emailLabel}
          isRequired
          isInvalid={!!formState.errors.email}
          errorMessage={formState.errors.email?.message}
          inputProps={{
            type: "email",
            autoComplete: "email",
            placeholder: es.auth.emailPlaceholder,
            ...register("email"),
          }}
        />
        <PasswordField
          label={es.auth.passwordLabel}
          description={es.auth.passwordAyuda}
          isRequired
          autoComplete="new-password"
          isInvalid={!!formState.errors.password}
          errorMessage={formState.errors.password?.message}
          inputProps={register("password")}
        />
        <PasswordField
          label={es.auth.passwordConfirmarLabel}
          isRequired
          autoComplete="new-password"
          isInvalid={!!formState.errors.confirmPassword}
          errorMessage={formState.errors.confirmPassword?.message}
          inputProps={register("confirmPassword")}
        />

        <Card>
          <p className="text-sm text-muted">{es.perfil.consentimientoTexto}</p>
          <div className="mt-3">
            <Controller
              control={control}
              name="consent"
              render={({ field }) => (
                <Checkbox isSelected={field.value} onChange={field.onChange} errorMessage={formState.errors.consent?.message}>
                  {es.perfil.consentimientoCheckbox}
                </Checkbox>
              )}
            />
          </div>
        </Card>

        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" variant="primary" size="lg" className="w-full" isPending={formState.isSubmitting}>
          {formState.isSubmitting ? es.auth.registrando : es.auth.crearCuenta}
        </Button>
      </form>
      <Link to="/ingresar" state={{ prefillEmail: prefill.prefillEmail }} className="mt-4 inline-flex min-h-tap items-center text-sm text-accent underline">
        {es.auth.enlaceYaTengoCuenta}
      </Link>
      <LiveRegion message={announce} />
    </main>
  );
}
