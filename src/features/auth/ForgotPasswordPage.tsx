import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, KeyRound, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { forgotPasswordSchema, type ForgotPasswordValues } from "./schemas";

function CloseToLogin() {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-accent">{es.app.name}</p>
      <Link
        to="/ingresar"
        aria-label={es.auth.cerrarAria}
        className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-[var(--r-pill)] text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <X className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ForgotPasswordPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [sent, setSent] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => {
    headingRef.current?.focus();
  }, [sent]);

  async function sendResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar/confirmar`,
    });
    // Nunca ramificar sobre si la cuenta existe (fuga por enumeración)
    // — el único caso que se muestra distinto es un límite de tasa,
    // que no revela nada sobre esa cuenta en particular.
    return error && error.status === 429 ? "rate_limited" : null;
  }

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    const errorCode = await sendResetEmail(values.email);
    if (errorCode === "rate_limited") {
      setFormError(es.auth.errorLimite);
      return;
    }
    setSent(true);
    setAnnounce(es.auth.recuperarRevise);
  }

  async function onResend() {
    setIsResending(true);
    setFormError(null);
    const errorCode = await sendResetEmail(form.getValues("email"));
    setIsResending(false);
    if (errorCode === "rate_limited") {
      setFormError(es.auth.errorLimite);
      return;
    }
    setAnnounce(es.auth.reenviarOk);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pt-6">
        <CloseToLogin />
        <div className="mt-6 flex flex-1 flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[var(--r-pill)] bg-accent-2 text-accent">
            <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="font-display mt-4 text-2xl text-ink outline-none">
            {es.auth.tituloRecuperar}
          </h1>
          <p className="mt-2 text-muted">{es.auth.recuperarRevise}</p>
          {formError ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="sticky bottom-0 mt-auto flex w-full flex-col items-center gap-2 border-t border-line bg-bg pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <Button variant="secondary" size="lg" className="w-full" onPress={onResend} isPending={isResending}>
              {es.auth.reenviarEnlace}
            </Button>
            <Link to="/ingresar" className="min-h-tap text-sm text-accent underline-offset-2 hover:underline">
              {es.auth.enlaceYaTengoCuenta}
            </Link>
          </div>
        </div>
        <LiveRegion message={announce} assertive />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 pt-6">
      <CloseToLogin />
      <h1 ref={headingRef} tabIndex={-1} className="font-display mt-4 flex items-center gap-2 text-2xl text-ink outline-none">
        <KeyRound className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.auth.tituloRecuperar}
      </h1>
      <p className="mt-1 text-muted">{es.auth.recuperarDescripcion}</p>
      <form className="mt-6 flex flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.auth.emailLabel}
          isRequired
          isInvalid={!!form.formState.errors.email}
          errorMessage={form.formState.errors.email?.message}
          inputProps={{
            icon: <Mail className="h-4 w-4" strokeWidth={2.25} />,
            type: "email",
            autoComplete: "email",
            placeholder: es.auth.emailPlaceholder,
            ...form.register("email"),
          }}
        />
        {formError ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="sticky bottom-0 mt-auto flex flex-col items-center gap-2 border-t border-line bg-bg pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <Button type="submit" variant="primary" size="lg" className="w-full" isPending={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? es.auth.enviandoEnlace : es.auth.botonRecuperar}
          </Button>
          <Link to="/ingresar" className="min-h-tap text-sm text-accent underline-offset-2 hover:underline">
            {es.auth.enlaceYaTengoCuenta}
          </Link>
        </div>
      </form>
    </main>
  );
}
