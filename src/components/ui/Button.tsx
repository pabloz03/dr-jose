import type { ReactNode } from "react";
import { Button as RACButton, type ButtonProps as RACButtonProps } from "react-aria-components/Button";

type Variant = "primary" | "secondary" | "danger" | "quiet" | "hero";

export interface ButtonProps extends RACButtonProps {
  variant?: Variant;
  children: ReactNode;
}

// Pill shape (--r-pill) para CTAs, hover lift + whileTap scale .97 (solo
// transform/opacity — regla dura #11, respeta reduced-motion vía
// MotionConfig global aunque esto sea CSS puro, no motion/react: es un
// desplazamiento de 2px, no una animación, así que no aplica esa regla).
const base =
  "inline-flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-[var(--r-pill)] px-5 text-[15px] font-semibold " +
  "transition-[background-color,color,transform,box-shadow] duration-150 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 " +
  "data-[focus-visible]:outline-focus data-[hovered]:-translate-y-0.5 data-[pressed]:translate-y-0 data-[pressed]:scale-[0.97] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:translate-y-0 data-[disabled]:data-[hovered]:translate-y-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-[var(--shadow-1)] data-[hovered]:bg-accent-hover data-[hovered]:shadow-[var(--shadow-2)]",
  secondary: "bg-transparent text-accent border border-border-ui data-[hovered]:bg-surface",
  danger: "bg-danger text-on-accent shadow-[var(--shadow-1)] data-[hovered]:opacity-90 data-[hovered]:shadow-[var(--shadow-2)]",
  quiet: "bg-transparent text-ink data-[hovered]:bg-surface data-[hovered]:translate-y-0",
  // Para usarse sobre el bloque hero (fondo oscuro fijo, ver tokens.css
  // --hero-*) — bg-accent normal no garantiza contraste ahí porque ese
  // token sí cambia con el tema.
  hero: "bg-[var(--hero-accent)] text-[var(--hero-accent-ink)] shadow-[var(--shadow-1)] data-[hovered]:opacity-90 data-[hovered]:shadow-[var(--shadow-2)]",
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
