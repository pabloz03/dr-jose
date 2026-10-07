import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf-8");

/** Extrae el primer bloque de reglas que matchee `selector { ... }`. */
function extractBlock(selectorRegex: RegExp): string {
  const match = selectorRegex.exec(css);
  if (!match) throw new Error(`No se encontró el bloque ${selectorRegex.source}`);
  const start = match.index + match[0].length;
  let depth = 1;
  let end = start;
  while (depth > 0) {
    if (css[end] === "{") depth++;
    if (css[end] === "}") depth--;
    end++;
  }
  return css.slice(start, end - 1);
}

function colorsFromBlock(block: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    const [, name, hex] = m;
    if (name && hex) out.set(name, hex);
  }
  return out;
}

function getColor(palette: Map<string, string>, name: string): string {
  const hex = palette.get(name);
  if (!hex) throw new Error(`Token --${name} no encontrado en tokens.css`);
  return hex;
}

// relative luminance + contrast ratio, fórmula WCAG 2.x
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const light = colorsFromBlock(extractBlock(/:root\s*\{/));
const dark = colorsFromBlock(extractBlock(/:root\[data-theme="dark"\]\s*\{/));

const TEXT_MIN = 4.5;
const UI_MIN = 3.0;

interface Pair {
  label: string;
  fg: string;
  bg: string;
  min: number;
}

const pairs: Pair[] = [
  { label: "ink sobre bg", fg: "ink", bg: "bg", min: TEXT_MIN },
  { label: "muted sobre bg", fg: "muted", bg: "bg", min: TEXT_MIN },
  { label: "accent sobre surface (enlaces/acciones)", fg: "accent", bg: "surface", min: TEXT_MIN },
  { label: "on-accent sobre accent (texto de botón primario)", fg: "on-accent", bg: "accent", min: TEXT_MIN },
  { label: "danger sobre surface", fg: "danger", bg: "surface", min: TEXT_MIN },
  { label: "success sobre surface", fg: "success", bg: "surface", min: TEXT_MIN },
  { label: "warning sobre surface", fg: "warning", bg: "surface", min: TEXT_MIN },
  { label: "border-ui sobre surface (controles)", fg: "border-ui", bg: "surface", min: UI_MIN },
  { label: "focus sobre bg (anillo de foco)", fg: "focus", bg: "bg", min: UI_MIN },
];

describe("contraste de tokens (WCAG 2.2 AA)", () => {
  describe.each([
    ["claro", light],
    ["oscuro", dark],
  ])("%s", (_scheme, palette) => {
    it.each(pairs)("$label ≥ $min:1", ({ fg, bg, min }) => {
      const ratio = contrastRatio(getColor(palette, fg), getColor(palette, bg));
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  });
});

// El bloque "hero" (tarjeta de próxima cita, etc.) es invariante de
// tema a propósito — se verifica una sola vez, no por claro/oscuro.
const heroPairs: Pair[] = [
  { label: "hero-ink sobre hero-bg", fg: "hero-ink", bg: "hero-bg", min: TEXT_MIN },
  { label: "hero-accent-ink sobre hero-accent (texto de botón sobre el bloque hero)", fg: "hero-accent-ink", bg: "hero-accent", min: TEXT_MIN },
  { label: "hero-danger sobre hero-bg (Badge onDark)", fg: "hero-danger", bg: "hero-bg", min: TEXT_MIN },
  { label: "hero-success sobre hero-bg (Badge onDark)", fg: "hero-success", bg: "hero-bg", min: TEXT_MIN },
  { label: "hero-warning sobre hero-bg (Badge onDark)", fg: "hero-warning", bg: "hero-bg", min: TEXT_MIN },
];

describe("contraste del bloque hero (invariante de tema)", () => {
  it.each(heroPairs)("$label ≥ $min:1", ({ fg, bg, min }) => {
    const ratio = contrastRatio(getColor(light, fg), getColor(light, bg));
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
