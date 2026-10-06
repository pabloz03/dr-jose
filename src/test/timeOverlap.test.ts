import { describe, expect, it } from "vitest";
import { timeRangesOverlap } from "@/features/admin/schedule/timeOverlap";

describe("timeRangesOverlap", () => {
  it("detecta solape parcial", () => {
    expect(timeRangesOverlap("09:00", "12:00", "11:00", "13:00")).toBe(true);
  });

  it("detecta un rango contenido dentro de otro", () => {
    expect(timeRangesOverlap("08:00", "17:00", "10:00", "11:00")).toBe(true);
  });

  it("rangos adyacentes (fin = inicio) NO se consideran solape", () => {
    expect(timeRangesOverlap("08:00", "12:00", "12:00", "14:00")).toBe(false);
  });

  it("rangos separados no se solapan", () => {
    expect(timeRangesOverlap("08:00", "09:00", "10:00", "11:00")).toBe(false);
  });

  it("rangos idénticos se solapan", () => {
    expect(timeRangesOverlap("08:00", "09:00", "08:00", "09:00")).toBe(true);
  });
});
