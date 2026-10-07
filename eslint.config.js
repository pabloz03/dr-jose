import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // supabase/functions corre en Deno (jsr:, Deno.serve, sin DOM/Node):
    // otro runtime con sus propios tipos, igual que tsconfig.app.json ya
    // lo excluye de `pnpm tsc` incluyendo solo "src". ESLint con globals
    // de browser no puede evaluarlo correctamente.
    ignores: [
      "dist",
      "dev-dist",
      "coverage",
      "playwright-report",
      "test-results",
      "supabase/.temp",
      "supabase/functions",
      "**/._*",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat["recommended-latest"], jsxA11y.flatConfigs.strict],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Prohíbe colores crudos fuera de styles/tokens.css (regla dura #2) — se complementa
      // con revisión manual del subagente a11y-auditor, ESLint no puede parsear className literal con fiabilidad total.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
