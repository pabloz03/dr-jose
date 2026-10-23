import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import {
  BarChart3,
  Calendar,
  CalendarOff,
  CalendarPlus,
  Clock,
  LogOut,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { es } from "@/i18n/es";
import { supabase } from "@/lib/supabase";
import { AdminBottomNav } from "./AdminBottomNav";

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

function NavItem({ to, end, label, Icon }: { to: string; end?: boolean; label: string; Icon: typeof Calendar }) {
  return (
    <NavLink to={to} end={end} className="relative">
      {({ isActive }) => (
        <span
          className={`relative z-10 flex min-h-tap w-full items-center gap-2.5 rounded-[var(--r-md)] px-3.5 text-sm font-medium transition-colors duration-150 ${
            isActive ? "text-on-accent" : "text-muted hover:text-ink"
          }`}
        >
          {isActive ? (
            <motion.span
              layoutId="admin-nav-pill-desktop"
              className="absolute inset-0 -z-10 rounded-[var(--r-md)] bg-accent"
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
  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar fijo en escritorio — plano, lenguaje "Savia": borde
          1px en vez de glass, mismos 8 ítems completos (en escritorio
          hay espacio de sobra, no hace falta el "Más" que sí necesita
          el nav inferior móvil). */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:border-r md:border-line md:bg-surface md:p-4">
        <div className="flex items-center gap-2 px-2 py-2">
          <Stethoscope className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.25} aria-hidden="true" />
          <span className="font-display text-base text-ink">{es.app.name}</span>
        </div>
        <nav aria-label={es.admin.nav.navPrincipal} className="mt-4 flex flex-col gap-1">
          {links.map((link) => (
            <NavItem key={link.to} to={link.to} end={link.end} label={link.label} Icon={link.icon} />
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-2">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="flex min-h-tap w-full items-center gap-2.5 rounded-[var(--r-md)] px-3.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-ink"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            {es.home.cerrarSesion}
          </button>
        </div>
      </aside>

      {/* En móvil, cada pantalla monta su propio `AdminScreenHeader`
          (eyebrow + título + salir, igual que ya hace cada pantalla
          paciente) — el nav inferior es lo único que vive en el shell. */}
      <AdminBottomNav />

      <main className="min-h-dvh flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className={`mx-auto flex flex-col gap-6 px-4 py-8 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</div>
      </main>
    </div>
  );
}
