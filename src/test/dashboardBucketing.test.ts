import { describe, expect, it } from "vitest";
import { CalendarDate } from "@internationalized/date";
import { bucketKey, bucketLabel, groupByBucket, trailingBucketKeys } from "@/features/admin/dashboard/bucketing";

describe("bucketKey", () => {
  it("semana: un miércoles cae en el bucket del lunes de esa semana", () => {
    // 2026-03-11 es miércoles, el lunes de esa semana es 2026-03-09
    expect(bucketKey("2026-03-11", "semana")).toBe("2026-03-09");
  });

  it("semana: un domingo cae en el bucket del lunes anterior, no el mismo día", () => {
    expect(bucketKey("2026-03-15", "semana")).toBe("2026-03-09");
  });

  it("mes: cualquier día del mes cae en la misma clave año-mes", () => {
    expect(bucketKey("2026-03-01", "mes")).toBe("2026-03");
    expect(bucketKey("2026-03-31", "mes")).toBe("2026-03");
  });

  it("mes: el mes se rellena con cero", () => {
    expect(bucketKey("2026-01-15", "mes")).toBe("2026-01");
  });
});

describe("bucketLabel", () => {
  it("semana: formatea la fecha del lunes en español", () => {
    expect(bucketLabel("2026-03-09", "semana")).toMatch(/9 mar/i);
  });

  it("mes: formatea año-mes en español", () => {
    expect(bucketLabel("2026-03", "mes")).toMatch(/mar.*2026/i);
  });
});

describe("groupByBucket", () => {
  it("agrupa filas por semana preservando las filas originales", () => {
    const rows = [
      { day: "2026-03-09", n: 1 },
      { day: "2026-03-11", n: 2 },
      { day: "2026-03-16", n: 3 },
    ];
    const grouped = groupByBucket(rows, "semana");
    expect(grouped.size).toBe(2);
    expect(grouped.get("2026-03-09")).toEqual([
      { day: "2026-03-09", n: 1 },
      { day: "2026-03-11", n: 2 },
    ]);
    expect(grouped.get("2026-03-16")).toEqual([{ day: "2026-03-16", n: 3 }]);
  });

  it("agrupa filas por mes", () => {
    const rows = [
      { day: "2026-03-01", n: 1 },
      { day: "2026-04-15", n: 2 },
    ];
    const grouped = groupByBucket(rows, "mes");
    expect([...grouped.keys()]).toEqual(["2026-03", "2026-04"]);
  });
});

describe("trailingBucketKeys", () => {
  it("semana: devuelve N semanas en orden cronológico terminando en la de asOf", () => {
    const keys = trailingBucketKeys(new CalendarDate(2026, 3, 11), "semana", 3);
    expect(keys).toEqual(["2026-02-23", "2026-03-02", "2026-03-09"]);
  });

  it("mes: devuelve N meses en orden cronológico terminando en el de asOf", () => {
    const keys = trailingBucketKeys(new CalendarDate(2026, 3, 15), "mes", 3);
    expect(keys).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("incluye buckets sin datos — no se puede saber eso desde el resultado, pero el conteo siempre es exacto", () => {
    expect(trailingBucketKeys(new CalendarDate(2026, 6, 1), "mes", 6)).toHaveLength(6);
  });
});
