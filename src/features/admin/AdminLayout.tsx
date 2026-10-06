import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { es } from "@/i18n/es";

const links = [
  { to: "/admin/horarios", label: es.admin.nav.horarios },
  { to: "/admin/clinicas", label: es.admin.nav.clinicas },
  { to: "/admin/ajustes", label: es.admin.nav.ajustes },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <nav aria-label="Administración" className="flex gap-4 border-b border-line pb-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
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
