import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, CalendarOff, CalendarPlus, Clock, Settings, Stethoscope, Users } from "lucide-react";
import { es } from "@/i18n/es";
import { GlassSurface } from "@/components/ui/GlassSurface";

const links = [
  { to: "/admin", label: es.admin.nav.hoy, end: true, icon: CalendarPlus },
  { to: "/admin/calendario", label: es.admin.nav.calendario, icon: Calendar },
  { to: "/admin/pacientes", label: es.admin.nav.pacientes, icon: Users },
  { to: "/admin/horarios", label: es.admin.nav.horarios, icon: Clock },
  { to: "/admin/bloqueos", label: es.admin.nav.bloqueos, icon: CalendarOff },
  { to: "/admin/clinicas", label: es.admin.nav.clinicas, icon: Stethoscope },
  { to: "/admin/ajustes", label: es.admin.nav.ajustes, icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      {/* Header sticky con glass — uno de los únicos usos permitidos por la
          regla dura #12 (nunca en calendario ni listas con scroll, que van
          en `children` más abajo, fuera de esta superficie). */}
      <GlassSurface as="section" className="sticky top-0 z-10 rounded-none border-x-0 border-t-0">
        <nav aria-label="Administración" className="mx-auto flex max-w-3xl flex-wrap gap-1 px-4 py-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="relative"
            >
              {({ isActive }) => (
                <span
                  className={`relative z-10 flex min-h-tap items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150 ${
                    isActive ? "text-on-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                  <link.icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  {link.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </GlassSurface>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">{children}</div>
    </div>
  );
}
