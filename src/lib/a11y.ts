/**
 * Mueve el foco al encabezado de la pantalla/paso actual y lo anuncia por
 * aria-live, por la regla dura #14 (cambio de paso/ruta). El elemento debe
 * tener `tabIndex={-1}` para poder recibir foco programático sin quedar en
 * el orden de tabulación natural.
 */
export function focusRouteHeading(heading: HTMLElement | null): void {
  if (!heading) return;
  heading.focus({ preventScroll: false });
}
