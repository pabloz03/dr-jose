import type { ReactNode } from "react";
import { SwitchField, SwitchButton, type SwitchFieldProps } from "react-aria-components/Switch";

export interface SwitchProps extends SwitchFieldProps {
  children?: ReactNode;
}

/**
 * Mismo contrato que Checkbox (isSelected/onChange vía Controller de
 * RHF) para booleanos tipo "Activa"/"Activo" — toggle estilo iOS en
 * vez del cuadrado de Checkbox, para el lenguaje visual "Savia" del
 * panel admin. `role="switch"` + `aria-checked` vienen de
 * react-aria-components, no de clases CSS (confirmar con
 * a11y-auditor que no se confunde con un checkbox).
 */
export function Switch({ children, ...props }: SwitchProps) {
  return (
    <SwitchField {...props} className="flex items-center gap-2.5">
      <SwitchButton className="group flex h-7 w-12 shrink-0 items-center rounded-[var(--r-pill)] border border-border-ui bg-surface p-0.5 transition-colors duration-150 data-[selected]:border-accent data-[selected]:bg-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[disabled]:opacity-50">
        <span className="h-6 w-6 rounded-[var(--r-pill)] bg-border-ui transition-transform duration-150 group-data-[selected]:translate-x-5 group-data-[selected]:bg-on-accent" />
      </SwitchButton>
      {children ? <span className="text-sm text-ink">{children}</span> : null}
    </SwitchField>
  );
}
