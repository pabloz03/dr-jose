import { describe, expect, it } from "vitest";
import { timeOffRangeUtc } from "@/features/admin/timeoff/timeOffRange";

describe("timeOffRangeUtc", () => {
  it("todo el día de un solo día: 00:00 local a 00:00 local del día siguiente", () => {
    const { starts_at, ends_at } = timeOffRangeUtc({
      from_date: "2026-03-10",
      to_date: "2026-03-10",
      all_day: true,
    });
    expect(starts_at).toBe("2026-03-10T06:00:00.000Z");
    expect(ends_at).toBe("2026-03-11T06:00:00.000Z");
  });

  it("todo el día de varios días cubre el rango completo", () => {
    const { starts_at, ends_at } = timeOffRangeUtc({
      from_date: "2026-03-10",
      to_date: "2026-03-12",
      all_day: true,
    });
    expect(starts_at).toBe("2026-03-10T06:00:00.000Z");
    expect(ends_at).toBe("2026-03-13T06:00:00.000Z");
  });

  it("franja parcial respeta las horas dadas", () => {
    const { starts_at, ends_at } = timeOffRangeUtc({
      from_date: "2026-03-10",
      to_date: "2026-03-10",
      all_day: false,
      from_time: "14:00",
      to_time: "16:30",
    });
    expect(starts_at).toBe("2026-03-10T20:00:00.000Z");
    expect(ends_at).toBe("2026-03-10T22:30:00.000Z");
  });
});
