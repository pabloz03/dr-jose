import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

export interface BadgeProps {
  tone?: Tone;
  icon: ReactNode;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  neutral: "text-ink",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Estado de cita u otra entidad: SIEMPRE texto + icono (regla dura #10),
 * nunca solo color — por eso `icon` es obligatorio, no opcional. El fondo
 * es siempre `surface` + borde `line` (ya verificados ≥4.5:1 en
 * src/test/contrast.test.ts); solo el texto/icono cambia de color. Un
 * fondo teñido por opacidad (p. ej. `bg-success/15`) se descartó porque
 * su contraste depende del fondo real detrás y axe lo marcó serio.
 */
export function Badge({ tone = "neutral", icon, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1 text-sm font-medium ${tones[tone]}`}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {children}
    </span>
  );
}
