import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CalendarOff,
  CalendarPlus,
  CalendarRange,
  ChevronRight,
  Clock,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { es } from "@/i18n/es";
import { supabase } from "@/lib/supabase";
import { Sheet } from "@/components/ui/Sheet";

const primaryLinks = [
  { to: "/admin", label: es.admin.nav.hoy, end: true, icon: CalendarPlus },
  { to: "/admin/calendario", label: es.admin.nav.calendario, icon: CalendarRange },
  { to: "/admin/pacientes", label: es.admin.nav.pacientes, icon: Users },
];

const moreLinks = [
  { to: "/admin/horarios", label: es.admin.nav.horarios, icon: Clock },
  { to: "/admin/bloqueos", label: es.admin.nav.bloqueos, icon: CalendarOff },
  { to: "/admin/metricas", label: es.admin.nav.metricas, icon: BarChart3 },
  { to: "/admin/clinicas", label: es.admin.nav.clinicas, icon: Stethoscope },
  { to: "/admin/ajustes", label: es.admin.nav.ajustes, icon: Settings },
];

/**
 * Nav inferior del panel admin, mobile-first — 4 accesos de uso
 * diario (Hoy/Calendario/Pacientes/Más) en vez de amontonar las 8
 * secciones; "Más" abre una hoja con el resto + cerrar sesión. Mismo
 * lenguaje plano que `PatientBottomNav.tsx` (sin glass, borde
 * superior 1px) — primitivo hermano, no el mismo componente, porque
 * el admin siempre tiene el ítem "Más" y el paciente no.
 */
export function AdminBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <section className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <nav aria-label={es.admin.nav.navPrincipal} className="mx-auto flex max-w-2xl justify-around px-2 py-1.5">
          {primaryLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {({ isActive }) => (
                <span
                  className={`flex min-h-tap min-w-tap flex-col items-center justify-center gap-0.5 rounded-[var(--r-sm)] px-3 py-1 text-xs transition-colors duration-150 ${
                    isActive ? "font-semibold text-accent" : "font-medium text-muted hover:text-ink"
                  }`}
                >
                  <link.icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                  {link.label}
                </span>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-haspopup="dialog"
            className="flex min-h-tap min-w-tap flex-col items-center justify-center gap-0.5 rounded-[var(--r-sm)] px-3 py-1 text-xs font-medium text-muted transition-colors duration-150 hover:text-ink"
          >
            <Menu aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2} />
            {es.admin.nav.mas}
          </button>
        </nav>
      </section>

      <Sheet title={es.admin.nav.mas} isOpen={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <p className="text-sm text-muted">{es.admin.nav.administracionClinica}</p>
        <nav aria-label={es.admin.nav.mas} className="mt-3 flex flex-col divide-y divide-line">
          {moreLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMoreOpen(false)}
              className="flex min-h-tap items-center gap-3 py-3 text-ink"
            >
              <link.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} />
              <span className="flex-1 font-medium">{link.label}</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2.25} />
            </NavLink>
          ))}
          <button
            type="button"
            onClick={async () => {
              setIsMoreOpen(false);
              await supabase.auth.signOut();
            }}
            className="flex min-h-tap items-center gap-3 py-3 text-left text-danger"
          >
            <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.25} />
            <span className="flex-1 font-medium">{es.home.cerrarSesion}</span>
          </button>
        </nav>
      </Sheet>
    </>
  );
}
