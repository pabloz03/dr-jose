import type { ReactNode } from "react";
import { Button as RACButton, type ButtonProps as RACButtonProps } from "react-aria-components/Button";

type Variant = "primary" | "secondary" | "danger" | "quiet" | "hero";
// "md" = pill compacta (admin, acciones secundarias, botones densos).
// "lg" = CTA "Savia" del lado paciente: rect redondeado 16px, 54px de
// alto, sin sombra (ver tokens.css --r-md, plan de rediseño rama UI2).
// Default "md" para que ningún call site existente (sobre todo admin,
// fuera de alcance del rediseño) cambie de forma sin pedirlo.
type Size = "md" | "lg";

export interface ButtonProps extends RACButtonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

// hover lift + whileTap scale .97 (solo transform/opacity — regla dura
// #11, respeta reduced-motion vía MotionConfig global aunque esto sea
// CSS puro, no motion/react: es un desplazamiento de 2px, no una
// animación, así que no aplica esa regla).
const base =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-[background-color,color,transform,border-color] duration-150 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 " +
  "data-[focus-visible]:outline-focus data-[hovered]:-translate-y-0.5 data-[pressed]:translate-y-0 data-[pressed]:scale-[0.97] " +
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:translate-y-0 data-[disabled]:data-[hovered]:translate-y-0";

const sizes: Record<Size, string> = {
  md: "min-h-tap min-w-tap rounded-[var(--r-pill)] px-5 text-[15px]",
  lg: "min-h-[54px] min-w-tap rounded-[var(--r-md)] px-6 text-base",
};

// Sin sombra (diseño plano "Savia" — borde/contraste de fondo en vez de
// elevación, ver tokens.css). `secondary` usa borde 1.5px para leer bien
// sin sombra que lo separe del fondo.
const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent data-[hovered]:bg-accent-hover",
  secondary: "bg-transparent text-accent border-[1.5px] border-border-ui data-[hovered]:bg-surface data-[hovered]:border-accent",
  danger: "bg-danger text-on-accent data-[hovered]:opacity-90",
  quiet: "bg-transparent text-ink data-[hovered]:bg-surface data-[hovered]:translate-y-0",
  // Para usarse sobre el bloque hero (fondo oscuro fijo, ver tokens.css
  // --hero-*) — bg-accent normal no garantiza contraste ahí porque ese
  // token sí cambia con el tema.
  hero: "bg-[var(--hero-accent)] text-[var(--hero-accent-ink)] data-[hovered]:opacity-90",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={(renderProps) =>
        [base, sizes[size], variants[variant], typeof className === "function" ? className(renderProps) : className]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </RACButton>
  );
}
