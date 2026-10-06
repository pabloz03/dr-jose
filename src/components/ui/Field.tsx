import type { ReactNode } from "react";
import {
  TextField as RACTextField,
  Label,
  Text,
  FieldError,
  type TextFieldProps as RACTextFieldProps,
} from "react-aria-components/TextField";
import { Input } from "./Input";

export interface FieldProps extends RACTextFieldProps {
  label: string;
  description?: string;
  /** Mensaje mostrado por FieldError cuando `isInvalid` es true. */
  errorMessage?: string;
  placeholder?: string;
  children?: ReactNode;
}

/**
 * Field compuesto (Label + Input + descripción + error) para el caso común.
 * Para layouts custom, componer TextField/Label/Input de RAC directamente.
 */
export function Field({ label, description, errorMessage, placeholder, children, ...props }: FieldProps) {
  return (
    <RACTextField {...props} className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-ink">{label}</Label>
      {children ?? <Input placeholder={placeholder} />}
      {description ? <Text slot="description" className="text-sm text-muted">{description}</Text> : null}
      <FieldError className="text-sm text-danger">{errorMessage}</FieldError>
    </RACTextField>
  );
}
