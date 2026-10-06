import { Input as RACInput, type InputProps } from "react-aria-components/TextField";

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className="min-h-tap w-full rounded-sm border border-border-ui bg-surface px-3 text-[15px] text-ink outline-none placeholder:text-muted data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-focus data-[invalid]:border-danger data-[disabled]:opacity-50"
    />
  );
}
