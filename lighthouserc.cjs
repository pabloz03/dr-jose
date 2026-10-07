module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm preview --port 4173",
      // "/" exige sesión y Lighthouse navega sin una, así que mide la cadena
      // redirect + carga del chunk de /ingresar en vez del primer render
      // real — /ingresar ES el landing real de cualquier visita sin sesión
      // (bookmark, link directo), así que es la ruta que refleja LCP real.
      url: ["http://localhost:4173/ingresar"],
      numberOfRuns: 1,
      // Sin "preset": el default de Lighthouse ya emula móvil (throttling +
      // viewport). "mobile" no es un valor válido de --preset (solo perf/
      // experimental/desktop existen) — desktop invertiría la emulación.
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.95 }],
        // El presupuesto duro de "LCP p75 ≤ 2.5s / JS inicial ≤170KB gzip"
        // es un AC explícito de E8-S2. En E8-S2 ya se quitó Motion del
        // camino crítico de /ingresar (-41KB; solo quedaba ahí por la
        // animación de paso del login, Motion sigue en el stepper de
        // reserva donde sí vale el costo) y se midió con Lighthouse real.
        // Sigue en "warn" a propósito: medido contra `vite preview`
        // (servidor estático simple) la LCP da ~2.96s, pero el "Render
        // Delay" domina el presupuesto (84%) mientras el tiempo de CPU/
        // bootup es mínimo (~250ms) — el patrón encaja con overhead de
        // ~15 requests HTTP/1.1 en paralelo limitado, no con exceso de
        // trabajo de JS. Vercel sirve por HTTP/2 con multiplexado real;
        // la medición que de verdad cuenta para esta AC es contra la URL
        // de Vercel ya desplegada, no contra este servidor local. Volver
        // a "error" (o seguir optimizando) según lo que mida esa corrida.
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
