import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarCheck, HelpCircle, Home, User } from "lucide-react";
import { es } from "@/i18n/es";
import { GlassSurface } from "@/components/ui/GlassSurface";

const links = [
  { to: "/", label: es.home.navInicio, icon: Home, end: true },
  { to: "/citas", label: es.citas.titulo, icon: CalendarCheck, end: false },
  { to: "/perfil", label: es.perfil.titulo, icon: User, end: false },
  { to: "/ayuda", label: es.ayuda.titulo, icon: HelpCircle, end: false },
];

/**
 * Nav inferior persistente para que las opciones principales del
 * paciente siempre estén visibles, sin depender de un enlace dentro de
 * cada pantalla (heurística "reconocer en vez de recordar"). Glass es
 * uno de los usos explícitamente permitidos por la regla dura #12 ("nav
 * inferior") — hoy la tarjeta de "próxima cita" de Home ya no es glass
 * (usa el bloque --hero-* sólido), así que en la práctica este nav es
 * la única capa glass visible en Home; el límite de 2 capas sigue
 * aplicando si algún sheet/modal se abre encima.
 */
export function PatientBottomNav() {
  return (
    <GlassSurface
      as="section"
      className="fixed inset-x-4 bottom-0 z-20 rounded-t-[var(--r-lg)] rounded-b-none border-b-0 pb-[env(safe-area-inset-bottom)]"
    >
      <nav aria-label={es.home.navPrincipal} className="mx-auto flex max-w-2xl justify-around px-2 py-1.5">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="relative">
            {({ isActive }) => (
              <span
                className={`relative z-10 flex min-h-tap min-w-tap flex-col items-center justify-center gap-0.5 rounded-[var(--r-pill)] px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  isActive ? "text-on-accent" : "text-muted hover:text-ink"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="patient-nav-pill"
                    className="absolute inset-0 -z-10 rounded-[var(--r-pill)] bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <link.icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                {link.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </GlassSurface>
  );
}
