import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

export interface BadgeProps {
  tone?: Tone;
  icon: ReactNode;
  children: ReactNode;
  /** Para usarse dentro del bloque hero (fondo oscuro fijo, ver tokens.css --hero-*). */
  onDark?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "text-ink",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

// --hero-* son invariantes de tema (ver tokens.css) — por eso esta
// variante no puede reusar `tones` (esas sí cambian con el tema) ni
// `border-line bg-surface` (pensados para fondo claro/oscuro normal,
// no para el fondo oscuro fijo del bloque hero).
const heroTones: Record<Tone, string> = {
  neutral: "text-[var(--hero-ink)]",
  success: "text-[var(--hero-success)]",
  warning: "text-[var(--hero-warning)]",
  danger: "text-[var(--hero-danger)]",
};

/**
 * Estado de cita u otra entidad: SIEMPRE texto + icono (regla dura #10),
 * nunca solo color — por eso `icon` es obligatorio, no opcional. El fondo
 * es siempre `surface` + borde `line` (ya verificados ≥4.5:1 en
 * src/test/contrast.test.ts); solo el texto/icono cambia de color. Un
 * fondo teñido por opacidad (p. ej. `bg-success/15`) se descartó porque
 * su contraste depende del fondo real detrás y axe lo marcó serio.
 */
export function Badge({ tone = "neutral", icon, children, onDark = false }: BadgeProps) {
  // onDark omite el fondo/borde de pastilla a propósito: un fondo
  // teñido por opacidad sobre --hero-bg tiene el mismo problema de
  // contraste no verificable que ya se descartó arriba para el caso
  // normal, y agregar un token de superficie sólida solo para esto es
  // más complejidad de la que pide un detalle cosmético. Icono + texto
  // en el tono correcto ya cumplen la regla dura #10 por sí solos.
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium ${
        onDark ? heroTones[tone] : `border border-line bg-surface ${tones[tone]}`
      }`}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {children}
    </span>
  );
}
