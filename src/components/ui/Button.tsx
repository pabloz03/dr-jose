import type { ReactNode } from "react";
import { Button as RACButton, type ButtonProps as RACButtonProps } from "react-aria-components/Button";

type Variant = "primary" | "secondary" | "danger" | "quiet";

export interface ButtonProps extends RACButtonProps {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold " +
  "transition-colors duration-150 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 " +
  "data-[focus-visible]:outline-focus data-[pressed]:scale-[0.98] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent data-[hovered]:bg-accent-hover",
  secondary: "bg-transparent text-accent border border-border-ui data-[hovered]:bg-surface",
  danger: "bg-danger text-on-accent data-[hovered]:opacity-90",
  quiet: "bg-transparent text-ink data-[hovered]:bg-surface",
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={(renderProps) =>
        [base, variants[variant], typeof className === "function" ? className(renderProps) : className]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </RACButton>
  );
}
