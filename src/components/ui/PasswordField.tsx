import { useState, type ReactNode } from "react";
import { TextField as RACTextField, Label, Input, Text, FieldError, type InputProps } from "react-aria-components/TextField";
import { Eye, EyeOff } from "lucide-react";
import { es } from "@/i18n/es";
import { Button } from "./Button";

/**
 * No compone con el `children` de Field (ese slot no deja espacio para
 * un botón hermano dentro del input) — repite el wiring de
 * accesibilidad de Field/Input directamente.
 */
export function PasswordField({
  label,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  autoComplete,
  icon,
  inputProps,
}: {
  label: string;
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  autoComplete: "current-password" | "new-password";
  /** Icono decorativo a la izquierda (candado) — lenguaje visual "Savia". */
  icon?: ReactNode;
  inputProps?: InputProps;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <RACTextField isInvalid={isInvalid} isRequired={isRequired} className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <div className="relative flex items-center">
        {icon ? (
          <span aria-hidden="true" className="pointer-events-none absolute left-3 text-muted">
            {icon}
          </span>
        ) : null}
        <Input
          {...inputProps}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`min-h-tap w-full rounded-sm border border-border-ui bg-surface ${icon ? "pl-10" : "px-3"} pr-12 text-[16px] text-ink outline-none transition-colors duration-150 placeholder:text-muted hover:border-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[invalid]:border-danger`}
        />
        <Button
          type="button"
          variant="quiet"
          className="absolute right-1 min-h-tap min-w-tap px-2"
          onPress={() => setVisible((v) => !v)}
          aria-label={visible ? es.auth.ocultarPassword : es.auth.mostrarPassword}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          )}
        </Button>
      </div>
      {description ? (
        <Text slot="description" className="text-sm text-muted">
          {description}
        </Text>
      ) : null}
      <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
    </RACTextField>
  );
}
