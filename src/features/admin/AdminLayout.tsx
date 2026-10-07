import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { es } from "@/i18n/es";

const links = [
  { to: "/admin", label: es.admin.nav.hoy, end: true },
  { to: "/admin/calendario", label: es.admin.nav.calendario },
  { to: "/admin/pacientes", label: es.admin.nav.pacientes },
  { to: "/admin/horarios", label: es.admin.nav.horarios },
  { to: "/admin/bloqueos", label: es.admin.nav.bloqueos },
  { to: "/admin/clinicas", label: es.admin.nav.clinicas },
  { to: "/admin/ajustes", label: es.admin.nav.ajustes },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Administración" className="flex flex-wrap gap-4 border-b border-line pb-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `min-h-tap px-1 py-1 text-sm font-medium ${isActive ? "text-accent underline" : "text-muted"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
