import type { ReactNode } from "react";
import {
  CheckboxField,
  CheckboxButton,
  type CheckboxFieldProps,
} from "react-aria-components/Checkbox";

export interface CheckboxProps extends CheckboxFieldProps {
  children?: ReactNode;
  errorMessage?: string;
}

export function Checkbox({ children, errorMessage, ...props }: CheckboxProps) {
  return (
    <CheckboxField {...props} className="flex items-start gap-2.5">
      <CheckboxButton className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border-ui bg-surface data-[selected]:border-accent data-[selected]:bg-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus">
        {({ isSelected }) =>
          isSelected ? (
            <svg viewBox="0 0 18 18" aria-hidden="true" className="h-3.5 w-3.5 stroke-on-accent stroke-[2.5]" fill="none">
              <polyline points="2 9 7 14 16 4" />
            </svg>
          ) : null
        }
      </CheckboxButton>
      <span className="text-sm text-ink">{children}</span>
      {errorMessage ? <span className="text-sm text-danger">{errorMessage}</span> : null}
    </CheckboxField>
  );
}
