---
description: Corre axe + checklist manual de WCAG 2.2 AA sobre una ruta
argument-hint: <ruta, p. ej. /citas/nueva>
---
Para la ruta `$1`:
1. Corre `pnpm e2e --grep @a11y` filtrado a esa ruta si existe un spec dedicado; si no, créalo en `e2e/` cubriendo los estados loading/empty/error/éxito.
2. Verifica manualmente: navegación solo teclado (Tab/Shift+Tab/flechas en calendarios), zoom 200%/400% sin pérdida de contenido, `prefers-reduced-motion: reduce`, `forced-colors: active`.
3. Invoca al subagente `a11y-auditor` sobre los componentes que renderiza esa ruta.
4. Reporta: violaciones axe (críticas/serias/moderadas/menores), hallazgos manuales, y si la ruta queda lista para merge.
