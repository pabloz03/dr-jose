/**
 * Sin esto, cuando el service worker nuevo activa (skipWaiting +
 * clientsClaim ya configurados por defecto en vite-plugin-pwa con
 * registerType "autoUpdate") toma control de una pestaña que ya
 * estaba abierta, pero esa pestaña sigue corriendo el HTML/JS viejo
 * que ya se renderizó — el usuario no ve el cambio hasta que navegue
 * o recargue otra vez. Recargar una sola vez al detectar el cambio de
 * controller cierra ese hueco sin pedirle nada al usuario.
 */
if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}
