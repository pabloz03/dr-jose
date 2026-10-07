import { Input as RACInput, type InputProps } from "react-aria-components/TextField";

export type { InputProps };

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className="min-h-tap w-full rounded-sm border border-border-ui bg-surface px-3 text-[16px] text-ink outline-none transition-colors duration-150 placeholder:text-muted hover:border-accent data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[invalid]:border-danger data-[disabled]:opacity-50 data-[disabled]:hover:border-border-ui"
    />
  );
}
