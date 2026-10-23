import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, type LucideIcon } from "lucide-react";
import { es } from "@/i18n/es";
import { supabase } from "@/lib/supabase";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Header de pantalla admin — eyebrow + título + salir, igual que ya
 * hace cada pantalla paciente (`<Eyebrow>`+`<h1>`, ver HomePage.tsx)
 * pero con el icono de cerrar sesión que pide el Figma admin en vez
 * del botón de "Administración" del lado paciente. `backTo` agrega
 * el enlace "← [sección]" debajo del título para pantallas de
 * detalle (Detalle de paciente/cita) — las pantallas de creación
 * (Agregar clínica, Nueva cita) NO usan este header, reusan
 * `WizardHeader` de booking directamente.
 */
export function AdminScreenHeader({
  icon: Icon,
  title,
  backTo,
  onBack,
  backLabel,
  focusOnMount = true,
}: {
  icon: LucideIcon;
  title: string;
  /** Enlace fijo (ej. "/admin/pacientes") cuando el origen siempre es el mismo. */
  backTo?: string;
  /** Callback (ej. `() => navigate(-1)`) cuando el origen varía según de dónde venga el usuario — tiene prioridad sobre `backTo` si se pasan ambos. */
  onBack?: () => void;
  backLabel?: string;
  focusOnMount?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Eyebrow>{es.app.name}</Eyebrow>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          aria-label={es.home.cerrarSesion}
          className="flex min-h-tap min-w-tap shrink-0 items-center justify-center rounded-[var(--r-pill)] text-accent transition-colors duration-150 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none">
        <Icon aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {title}
      </h1>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex min-h-tap items-center gap-1 text-sm text-accent underline-offset-2 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {backLabel}
        </button>
      ) : backTo ? (
        <Link to={backTo} className="mt-2 inline-flex min-h-tap items-center gap-1 text-sm text-accent underline-offset-2 hover:underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          {backLabel}
        </Link>
      ) : null}
    </div>
  );
}
