import { Laptop, Moon, Sun } from "lucide-react";
import { es } from "@/i18n/es";
import { useTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: "system", icon: Laptop },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

/** Mismo patrón de grupo de botones ya usado en el selector de vista del
 * calendario de admin (día/semana/mes) — `role="group"` + `aria-pressed`,
 * nada nuevo que aprender para quien ya revisó ese componente. */
export function ThemeToggle() {
  const [preference, setPreference] = useTheme();

  return (
    <div role="group" aria-label={es.perfil.aparienciaTitulo} className="flex gap-2">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          onClick={() => setPreference(value)}
          className={`inline-flex min-h-tap items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm ${
            preference === value ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink"
          }`}
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          {es.perfil.apariencia[value]}
        </button>
      ))}
    </div>
  );
}
