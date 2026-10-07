import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "motion/react";
import { es } from "@/i18n/es";
import { stepVariants } from "@/lib/motion";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { guestDatosSchema, type GuestDatosValues } from "./schemas";

export function DatosStep({
  dir,
  defaultValues,
  onContinue,
}: {
  dir: 1 | -1;
  defaultValues: GuestDatosValues;
  onContinue: (values: GuestDatosValues) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { register, handleSubmit, formState } = useForm<GuestDatosValues>({
    resolver: zodResolver(guestDatosSchema),
    defaultValues,
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <motion.div custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink outline-none">
        {es.reservaInvitado.datosTitulo}
      </h2>
      <p className="mt-1 text-sm text-muted">{es.reservaInvitado.datosDescripcion}</p>

      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onContinue)} noValidate>
        <Field
          label={es.reservaInvitado.nombreLabel}
          isRequired
          isInvalid={!!formState.errors.full_name}
          errorMessage={formState.errors.full_name?.message}
          inputProps={{ autoComplete: "name", ...register("full_name") }}
        />
        <Field
          label={es.reservaInvitado.correoLabel}
          description={es.reservaInvitado.correoAyuda}
          isRequired
          isInvalid={!!formState.errors.contact_email}
          errorMessage={formState.errors.contact_email?.message}
          inputProps={{ type: "email", autoComplete: "email", ...register("contact_email") }}
        />
        {/* Honeypot: oculto fuera del viewport, nunca display:none (lo
            haría trivialmente detectable para un bot) y sin tabIndex
            para que una persona navegando por teclado nunca caiga en él. */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">No llenar</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        <Button type="submit" variant="primary" className="self-start">
          {es.reservaInvitado.continuar}
        </Button>
      </form>
    </motion.div>
  );
}
