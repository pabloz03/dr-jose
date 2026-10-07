import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { codeStepSchema, emailStepSchema, type CodeStepValues, type EmailStepValues } from "./schemas";

type Step = "email" | "code";

/**
 * Cada paso maneja su propio foco al montar. Sin `motion/react` acá a
 * propósito: esta es la pantalla de aterrizaje sin sesión (E8-S2, LCP ≤
 * 2.5s) y esa librería pesaba ~40KB gzip solo para una transición de
 * paso de 2 pantallas — el resto de la app (stepper de reserva, etc.)
 * sigue usando Motion normalmente, ahí el costo sí se justifica porque
 * nunca es lo primero que carga un visitante sin sesión.
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

function EmailStep({
  onSubmitted,
  formError,
  setFormError,
}: {
  onSubmitted: (email: string) => void;
  formError: string | null;
  setFormError: (error: string | null) => void;
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const fadeClass = useFadeIn();
  const form = useForm<EmailStepValues>({ resolver: zodResolver(emailStepSchema) });

  async function onSubmit(values: EmailStepValues) {
    setFormError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: values.email });
    if (error) {
      setFormError(error.status === 429 ? es.auth.errorLimite : es.auth.errorEnvio);
      return;
    }
    onSubmitted(values.email);
  }

  return (
    <div className={fadeClass}>
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <Mail className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
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
        {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        <Button type="submit" variant="primary" isPending={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? es.auth.enviandoCodigo : es.auth.enviarCodigo}
        </Button>
      </form>
    </div>
  );
}

function CodeStep({
  email,
  onVerified,
  onChangeEmail,
  formError,
  setFormError,
  setAnnounce,
}: {
  email: string;
  onVerified: () => void;
  onChangeEmail: () => void;
  formError: string | null;
  setFormError: (error: string | null) => void;
  setAnnounce: (message: string) => void;
}) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const fadeClass = useFadeIn();
  const form = useForm<CodeStepValues>({ resolver: zodResolver(codeStepSchema) });

  async function onSubmit(values: CodeStepValues) {
    setFormError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: values.code, type: "email" });
    if (error) {
      setFormError(es.auth.errorCodigo);
      return;
    }
    setAnnounce(es.auth.sesionIniciada);
    onVerified();
  }

  async function onResend() {
    setFormError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setAnnounce(error ? "" : es.auth.codigoEnviado);
    if (error) setFormError(error.status === 429 ? es.auth.errorLimite : es.auth.errorEnvio);
  }

  return (
    <div className={fadeClass}>
      <h1 ref={headingRef} tabIndex={-1} className="font-display flex items-center gap-2 text-2xl text-ink outline-none">
        <KeyRound className="h-6 w-6 text-accent" strokeWidth={2.25} aria-hidden="true" />
        {es.auth.codigoTitulo}
      </h1>
      <p className="mt-1 text-muted">{es.auth.codigoDescripcion(email)}</p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.auth.codigoLabel}
          description={es.auth.codigoAyuda}
          isRequired
          isInvalid={!!form.formState.errors.code}
          errorMessage={form.formState.errors.code?.message}
          inputProps={{
            inputMode: "numeric",
            autoComplete: "one-time-code",
            maxLength: 6,
            ...form.register("code"),
          }}
        />
        {formError ? <p className="text-sm text-danger">{formError}</p> : null}
        <Button type="submit" variant="primary" isPending={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? es.auth.confirmandoCodigo : es.auth.confirmarCodigo}
        </Button>
        <div className="flex justify-between text-sm">
          <Button variant="quiet" onPress={onChangeEmail}>
            {es.auth.cambiarCorreo}
          </Button>
          <Button variant="quiet" onPress={onResend}>
            {es.auth.reenviarCodigo}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [announce, setAnnounce] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-8">
      {step === "email" ? (
        <EmailStep
          key="email"
          formError={formError}
          setFormError={setFormError}
          onSubmitted={(submittedEmail) => {
            setEmail(submittedEmail);
            setStep("code");
            setFormError(null);
            setAnnounce(es.auth.codigoEnviado);
          }}
        />
      ) : (
        <CodeStep
          key="code"
          email={email}
          formError={formError}
          setFormError={setFormError}
          setAnnounce={setAnnounce}
          onChangeEmail={() => {
            setFormError(null);
            setStep("email");
          }}
          onVerified={() => navigate("/", { replace: true })}
        />
      )}
      <LiveRegion message={announce} />
    </main>
  );
}
