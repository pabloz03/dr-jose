import { NavLink } from "react-router-dom";
import { CalendarCheck, HelpCircle, Home, User } from "lucide-react";
import { es } from "@/i18n/es";

const links = [
  { to: "/", label: es.home.navInicio, icon: Home, end: true },
  { to: "/citas", label: es.citas.titulo, icon: CalendarCheck, end: false },
  { to: "/perfil", label: es.perfil.titulo, icon: User, end: false },
  { to: "/ayuda", label: es.ayuda.titulo, icon: HelpCircle, end: false },
];

/**
 * Nav inferior persistente para que las opciones principales del
 * paciente siempre estén visibles, sin depender de un enlace dentro de
 * cada pantalla (heurística "reconocer en vez de recordar"). Plano
 * (rediseño "Savia"): superficie sólida + borde superior 1px, sin
 * glass — el punto focal de transparencia de la app queda reservado al
 * sheet/modal que se abra encima, nunca aquí.
 */
export function PatientBottomNav() {
  return (
    <section className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <nav aria-label={es.home.navPrincipal} className="mx-auto flex max-w-2xl justify-around px-2 py-1.5">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {({ isActive }) => (
              <span
                className={`flex min-h-tap min-w-tap flex-col items-center justify-center gap-0.5 rounded-[var(--r-sm)] px-3 py-1 text-xs transition-colors duration-150 ${
                  isActive ? "font-semibold text-accent" : "font-medium text-muted hover:text-ink"
                }`}
              >
                <link.icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
                {/* Marca no cromática del tab activo (regla dura #10: estado
                    nunca solo por color) — un punto que aparece/desaparece,
                    no solo cambia de tono, para quien no distingue el verde
                    de acento del gris de --muted (contraste de luminancia
                    casi idéntico entre ambos). */}
                <span
                  aria-hidden="true"
                  className={`h-1 w-1 rounded-[var(--r-pill)] ${isActive ? "bg-accent" : "bg-transparent"}`}
                />
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </section>
  );
}
