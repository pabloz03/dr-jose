import { describe, expect, it } from "vitest";
import { groupSlotsByDate } from "@/features/booking/groupSlotsByDate";

describe("groupSlotsByDate", () => {
  it("agrupa por fecha LOCAL (America/Guatemala, UTC-6), no por fecha UTC", () => {
    // 2026-03-10T05:00:00Z = 2026-03-09 23:00 local — debe caer en el 09, no el 10.
    const slots = [{ slot_start: "2026-03-10T05:00:00.000Z", slot_end: "2026-03-10T05:30:00.000Z" }];
    const grouped = groupSlotsByDate(slots);
    expect(grouped.has("2026-03-09")).toBe(true);
    expect(grouped.has("2026-03-10")).toBe(false);
  });

  it("un slot bien entrado el día UTC pero temprano en local SÍ cae en el día UTC", () => {
    // 2026-03-10T18:00:00Z = 2026-03-10 12:00 local — mismo día en ambos.
    const slots = [{ slot_start: "2026-03-10T18:00:00.000Z", slot_end: "2026-03-10T18:30:00.000Z" }];
    const grouped = groupSlotsByDate(slots);
    expect(grouped.has("2026-03-10")).toBe(true);
  });

  it("agrupa varios slots del mismo día local en una sola entrada, en orden", () => {
    const slots = [
      { slot_start: "2026-03-10T15:00:00.000Z", slot_end: "2026-03-10T15:30:00.000Z" },
      { slot_start: "2026-03-10T15:30:00.000Z", slot_end: "2026-03-10T16:00:00.000Z" },
    ];
    const grouped = groupSlotsByDate(slots);
    expect(grouped.get("2026-03-10")).toHaveLength(2);
  });

  it("devuelve un mapa vacío si no hay slots", () => {
    expect(groupSlotsByDate([]).size).toBe(0);
  });
});
