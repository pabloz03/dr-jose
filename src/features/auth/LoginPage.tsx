import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { loginSchema, type LoginValues } from "./schemas";

/**
 * Esta es la pantalla de aterrizaje sin sesión (E8-S2, LCP ≤ 2.5s) —
 * sin `motion/react` a propósito, igual que antes del cambio de
 * magic-link a contraseña (esa librería pesaba ~40KB gzip solo para
 * una transición de 2 pantallas que ya no existen, pero el mismo
 * presupuesto de LCP sigue aplicando a esta pantalla única).
 */
function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

/** Fade-in de solo-CSS al montar; `motion-safe:` ya respeta reduced motion sin JS extra. */
function useFadeIn() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return `motion-safe:transition-opacity motion-safe:duration-200 ${visible ? "opacity-100" : "opacity-0"}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const prefillEmail = (location.state as { prefillEmail?: string } | null)?.prefillEmail;
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const fadeClass = useFadeIn();
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { reset } = form;

  useEffect(() => {
    if (prefillEmail) reset({ email: prefillEmail, password: "" });
  }, [prefillEmail, reset]);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.status === 429 ? es.auth.errorLimite : es.auth.errorCredenciales);
      return;
    }
    setAnnounce(es.auth.sesionIniciada);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-4 py-8">
      <div className={fadeClass}>
        <img
          src="/images/clinica-atencion.jpg"
          alt={es.auth.fotoAlt}
          width={390}
          height={220}
          className="h-[180px] w-full rounded-[var(--r-lg)] border border-line object-cover"
        />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display mt-6 flex items-center gap-2 text-2xl text-ink outline-none"
        >
          <LogIn className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
          {es.auth.tituloIngreso}
        </h1>
        <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Field
            label={es.auth.emailLabel}
            description={es.auth.emailAyuda}
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
          <PasswordField
            label={es.auth.passwordLabel}
            isRequired
            autoComplete="current-password"
            isInvalid={!!form.formState.errors.password}
            errorMessage={form.formState.errors.password?.message}
            inputProps={form.register("password")}
          />
          {formError ? (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" variant="primary" size="lg" className="w-full" isPending={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? es.auth.ingresando : es.auth.ingresar}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/recuperar" className="inline-flex min-h-tap items-center text-accent underline">
            {es.auth.enlaceOlvideContrasena}
          </Link>
          <Link to="/crear-cuenta" state={{ prefillEmail }} className="inline-flex min-h-tap items-center text-accent underline">
            {es.auth.enlaceCrearCuenta}
          </Link>
          <Link to="/reservar-invitado" className="inline-flex min-h-tap items-center text-accent underline">
            {es.reservaInvitado.enlaceIngresar}
          </Link>
        </div>
      </div>
      <LiveRegion message={announce} />
    </main>
  );
}
