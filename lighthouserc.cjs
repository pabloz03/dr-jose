module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm preview --port 4173",
      url: ["http://localhost:4173/"],
      numberOfRuns: 1,
      // Sin "preset": el default de Lighthouse ya emula móvil (throttling +
      // viewport). "mobile" no es un valor válido de --preset (solo perf/
      // experimental/desktop existen) — desktop invertiría la emulación.
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
