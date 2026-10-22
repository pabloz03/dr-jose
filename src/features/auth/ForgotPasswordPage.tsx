import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { forgotPasswordSchema, type ForgotPasswordValues } from "./schemas";

export function ForgotPasswordPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [sent, setSent] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => {
    headingRef.current?.focus();
  }, [sent]);

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/recuperar/confirmar`,
    });
    // Nunca ramificar sobre si la cuenta existe (fuga por enumeración)
    // — el único caso que se muestra distinto es un límite de tasa,
    // que no revela nada sobre esa cuenta en particular.
    if (error && error.status === 429) {
      setFormError(es.auth.errorLimite);
      return;
    }
    setSent(true);
    setAnnounce(es.auth.recuperarRevise);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
        <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
          <MailCheck className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
          {es.auth.tituloRecuperar}
        </h1>
        <p className="mt-2 text-muted">{es.auth.recuperarRevise}</p>
        <Link to="/ingresar" className="mt-4 inline-flex min-h-tap items-center text-sm text-accent underline">
          {es.auth.enlaceYaTengoCuenta}
        </Link>
        <LiveRegion message={announce} assertive />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-2xl font-semibold text-ink outline-none">
        <KeyRound className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.auth.tituloRecuperar}
      </h1>
      <p className="mt-1 text-muted">{es.auth.recuperarDescripcion}</p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.auth.emailLabel}
          isRequired
          isInvalid={!!form.formState.errors.email}
          errorMessage={form.formState.errors.email?.message}
          inputProps={{
            type: "email",
            autoComplete: "email",
            placeholder: es.auth.emailPlaceholder,
            ...form.register("email"),
          }}
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" variant="primary" size="lg" className="w-full" isPending={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? es.auth.enviandoEnlace : es.auth.botonRecuperar}
        </Button>
      </form>
      <Link to="/ingresar" className="mt-4 inline-flex min-h-tap items-center text-sm text-accent underline">
        {es.auth.enlaceYaTengoCuenta}
      </Link>
    </main>
  );
}
