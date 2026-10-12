import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { resetPasswordSchema, type ResetPasswordValues } from "./schemas";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    // `isLoading` puede quedarse en `false` mientras `session` todavía
    // cambia de null a la sesión real de recuperación (getSession()
    // resuelve antes de que el listener procese el enlace) — sin
    // depender también de `session`, el foco no se mueve al <h1> real
    // cuando eso pasa y la pantalla queda sin anunciar el cambio.
    if (!isLoading) headingRef.current?.focus();
  }, [isLoading, session]);

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(error.status === 429 ? es.auth.errorLimite : es.auth.errorRegistro);
      return;
    }
    setAnnounce(es.auth.resetearOk);
    navigate("/", { replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        {es.common.cargando}
      </div>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
        <h1 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-2xl font-semibold text-ink outline-none">
          <ShieldAlert className="h-6 w-6 text-danger" strokeWidth={2.25} aria-hidden="true" />
          {es.auth.enlaceInvalidoTitulo}
        </h1>
        <p className="mt-2 text-muted">{es.auth.enlaceInvalidoDescripcion}</p>
        <Link to="/recuperar" className="mt-4 inline-flex min-h-tap items-center text-sm text-accent underline">
          {es.auth.pedirEnlaceNuevo}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-2xl font-semibold text-ink outline-none">
        <KeyRound className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.auth.tituloResetear}
      </h1>
      <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <PasswordField
          label={es.auth.passwordNuevaLabel}
          description={es.auth.passwordAyuda}
          isRequired
          autoComplete="new-password"
          isInvalid={!!form.formState.errors.password}
          errorMessage={form.formState.errors.password?.message}
          inputProps={form.register("password")}
        />
        <PasswordField
          label={es.auth.passwordConfirmarLabel}
          isRequired
          autoComplete="new-password"
          isInvalid={!!form.formState.errors.confirmPassword}
          errorMessage={form.formState.errors.confirmPassword?.message}
          inputProps={form.register("confirmPassword")}
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" variant="primary" isPending={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? es.auth.guardandoPassword : es.auth.botonResetear}
        </Button>
      </form>
      <LiveRegion message={announce} assertive />
    </main>
  );
}
