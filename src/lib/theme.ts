import { useCallback, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyPreference(pref: ThemePreference): void {
  try {
    if (pref === "system") {
      localStorage.removeItem(STORAGE_KEY);
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem(STORAGE_KEY, pref);
      document.documentElement.dataset.theme = pref;
    }
  } catch {
    // Almacenamiento no disponible (modo privado estricto, etc.) — la
    // preferencia simplemente no persiste entre sesiones, no es un error
    // que deba interrumpir al usuario.
  }
}

/** Lee/escribe la preferencia de tema. `theme-init.js` (index.html) ya aplicó
 * el valor guardado antes del primer pintado, así que el estado inicial acá
 * solo necesita coincidir con lo que ya está en localStorage, no volver a
 * tocar el DOM hasta que el usuario cambie algo. */
export function useTheme(): [ThemePreference, (pref: ThemePreference) => void] {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);

  const setPreference = useCallback((pref: ThemePreference) => {
    applyPreference(pref);
    setPreferenceState(pref);
  }, []);

  return [preference, setPreference];
}
