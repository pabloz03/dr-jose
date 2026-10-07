# Auditoría de accesibilidad manual (E8-S1)

> Esta auditoría requiere dispositivos físicos y lectores de pantalla reales.
> No se puede ejecutar desde un agente de código — queda pendiente de que
> alguien del equipo (o QA) la corra antes del piloto y firme el resultado
> abajo. Lo que SÍ está cubierto automáticamente en cada PR (axe + teclado
> simulado + `prefers-reduced-motion`/`forced-colors` vía Playwright) no
> sustituye esta pasada manual — son complementarias.

**Estado: pendiente de ejecución.** Ninguna fila de abajo está marcada como
hecha todavía.

## Cómo correr esto

1. Build de producción desplegado (no `pnpm dev` — las métricas de teclado/
   zoom/lector deben verse contra lo real).
2. Un recorrido completo = las 4 columnas (teclado, zoom, VoiceOver/TalkBack,
   alto contraste forzado) en cada ruta de la tabla.
3. Cualquier bloqueante (no se puede completar la tarea de la pantalla con
   esa tecnología) se reporta aparte con pasos para reproducir — no se
   marca ✅ con un bloqueante abierto.

## Rutas a cubrir

| Ruta | Teclado | Zoom 200–400% | VoiceOver (iOS) | TalkBack (Android) | Alto contraste forzado |
|---|---|---|---|---|---|
| `/ingresar` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/citas/nueva` (stepper completo) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/citas` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/citas/:id` (confirmar/reprogramar/cancelar) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/a/:token` (confirmar) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/a/:token` (cancelar) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/a/:token` (reprogramar, elegir slot) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/perfil` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/ayuda` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin` (Hoy) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/calendario` (día/semana/mes) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/citas/:id` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/citas/nueva` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/pacientes` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/horarios` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/bloqueos` (panel de impacto) | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/clinicas` | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/ajustes` | ☐ | ☐ | ☐ | ☐ | ☐ |

## Qué revisar en cada columna

- **Teclado**: llegar a todo con Tab/Shift+Tab, activar con Enter/Espacio,
  foco siempre visible y nunca atrapado; en el calendario, flechas +
  Home/End cambian de día; Esc cierra diálogos/hojas sin perder el lugar.
- **Zoom 200–400%**: sin scroll horizontal, sin texto cortado, los botones
  siguen siendo alcanzables y de al menos 44×44 px efectivos.
- **VoiceOver (iOS)** / **TalkBack (Android)**: cada control anuncia rol +
  nombre + estado (ej. "Confirmada", no solo un color); los mensajes de
  `aria-live` (confirmaciones, errores) se escuchan sin tener que buscar el
  foco; el stepper de reserva anuncia el paso actual.
- **Alto contraste forzado** (Windows "Forced Colors" / `forced-colors:
  active`): los bordes de los glass panels y los estados siguen siendo
  distinguibles sin depender del `backdrop-filter`.

## Bloqueantes encontrados

_(ninguno reportado todavía — se llena durante la ejecución)_

## Firma

- Ejecutado por: ______________________
- Fecha: ______________________
- Resultado: ☐ 0 bloqueantes, listo para piloto ☐ bloqueantes abiertos (ver arriba)
