import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { BarChart3, Calendar, CalendarOff, CalendarPlus, Clock, Menu, Settings, Stethoscope, Users } from "lucide-react";
import { es } from "@/i18n/es";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Sheet } from "@/components/ui/Sheet";

const links = [
  { to: "/admin", label: es.admin.nav.hoy, end: true, icon: CalendarPlus },
  { to: "/admin/calendario", label: es.admin.nav.calendario, icon: Calendar },
  { to: "/admin/pacientes", label: es.admin.nav.pacientes, icon: Users },
  { to: "/admin/horarios", label: es.admin.nav.horarios, icon: Clock },
  { to: "/admin/bloqueos", label: es.admin.nav.bloqueos, icon: CalendarOff },
  { to: "/admin/metricas", label: es.admin.nav.metricas, icon: BarChart3 },
  { to: "/admin/clinicas", label: es.admin.nav.clinicas, icon: Stethoscope },
  { to: "/admin/ajustes", label: es.admin.nav.ajustes, icon: Settings },
];

function NavItem({
  to,
  end,
  label,
  Icon,
  vertical,
  onNavigate,
}: {
  to: string;
  end?: boolean;
  label: string;
  Icon: typeof Calendar;
  vertical: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className="relative">
      {({ isActive }) => (
        <span
          className={`relative z-10 flex min-h-tap items-center gap-2.5 rounded-full text-sm font-medium transition-colors duration-150 ${
            vertical ? "w-full px-3.5" : "px-3"
          } ${isActive ? "text-on-accent" : "text-muted hover:text-ink"}`}
        >
          {isActive ? (
            <motion.span
              layoutId={vertical ? "admin-nav-pill-desktop" : "admin-nav-pill-mobile"}
              className="absolute inset-0 -z-10 rounded-full bg-accent"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          ) : null}
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function AdminLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar fijo en escritorio — estilo Notion. Es el mismo primitive
          GlassSurface que ya se usaba en la barra superior (regla dura
          #12 ya lo permite para "nav"), solo en columna; el pill animado
          con layoutId es el mismo de siempre, ahora vertical. */}
      <GlassSurface
        as="aside"
        className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:rounded-none md:border-y-0 md:border-l-0 md:p-4"
      >
        <div className="flex items-center gap-2 px-2 py-2">
          <Stethoscope className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
          <span className="font-display text-base text-ink">{es.app.name}</span>
        </div>
        <nav aria-label="Administración" className="mt-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavItem key={link.to} to={link.to} end={link.end} label={link.label} Icon={link.icon} vertical />
          ))}
        </nav>
      </GlassSurface>

      {/* Barra superior compacta en mobile: nombre de la app + botón de
          menú que abre una hoja con los mismos enlaces del sidebar,
          en vez de amontonar los 7 enlaces en una fila que se envuelve. */}
      <GlassSurface
        as="section"
        className="sticky top-0 z-10 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:hidden"
      >
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
          <span className="font-display text-base text-ink">{es.app.name}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label={es.admin.nav.abrirMenu}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-ink"
        >
          <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </GlassSurface>

      <Sheet title={es.admin.nav.abrirMenu} isOpen={isMenuOpen} isDismissable onOpenChange={setIsMenuOpen}>
        <nav aria-label="Administración" className="flex flex-col gap-1">
          {links.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              end={link.end}
              label={link.label}
              Icon={link.icon}
              vertical
              onNavigate={() => setIsMenuOpen(false)}
            />
          ))}
        </nav>
      </Sheet>

      <main className="min-h-dvh flex-1">
        <div className={`mx-auto flex flex-col gap-6 px-4 py-8 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</div>
      </main>
    </div>
  );
}
