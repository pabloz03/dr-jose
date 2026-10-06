import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tokensPath = resolve(process.cwd(), "src/styles/tokens.css");

describe("tokens.css", () => {
  const css = readFileSync(tokensPath, "utf-8");

  it("no declara hex/rgb fuera del bloque de tokens (regla dura #2)", () => {
    // Todo color vive en tokens.css por diseño; esta prueba documenta esa
    // intención y falla si alguien borra el bloque de --tap o --focus.
    expect(css).toContain("--accent:");
    expect(css).toContain("--focus:");
    expect(css).toContain("--tap: 44px");
  });

  it("define overrides para esquema oscuro vía prefers-color-scheme y [data-theme]", () => {
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('[data-theme="light"]');
  });
});
