import type { ReactNode } from "react";
import { Input as RACInput, type InputProps as RACInputProps } from "react-aria-components/TextField";

export interface InputProps extends RACInputProps {
  /** Icono decorativo a la izquierda (sobre, candado, usuario…) — lenguaje visual "Savia". */
  icon?: ReactNode;
}

const fieldClasses =
  "min-h-tap w-full rounded-sm border border-border-ui bg-surface text-[16px] text-ink outline-none transition-colors duration-150 placeholder:text-muted hover:border-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[invalid]:border-danger data-[disabled]:opacity-50 data-[disabled]:hover:border-border-ui";

export function Input({ icon, ...props }: InputProps) {
  if (icon) {
    return (
      <div className="relative flex items-center">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 text-muted">
          {icon}
        </span>
        <RACInput {...props} className={`${fieldClasses} pl-10 pr-3`} />
      </div>
    );
  }
  return <RACInput {...props} className={`${fieldClasses} px-3`} />;
}
