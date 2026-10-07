import { describe, expect, it } from "vitest";
import { clinicDayBounds } from "@/lib/tz";

describe("clinicDayBounds", () => {
  it("medianoche local del 10 de marzo es 06:00 UTC (UTC-6 fijo)", () => {
    const { from, to } = clinicDayBounds("2026-03-10");
    expect(from).toBe("2026-03-10T06:00:00.000Z");
    expect(to).toBe("2026-03-11T06:00:00.000Z");
  });

  it("el rango dura exactamente 24 horas", () => {
    const { from, to } = clinicDayBounds("2026-07-01");
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("cruza correctamente el límite de año", () => {
    const { from, to } = clinicDayBounds("2026-12-31");
    expect(from).toBe("2026-12-31T06:00:00.000Z");
    expect(to).toBe("2027-01-01T06:00:00.000Z");
  });
});
