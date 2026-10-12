export interface TypeBreakdownRow {
  type_id: string;
  type_name: string;
  n: number;
}

export function TypeBreakdown({ rows }: { rows: TypeBreakdownRow[] }) {
  const total = Math.max(1, rows.reduce((sum, r) => sum + r.n, 0));
  const sorted = [...rows].sort((a, b) => b.n - a.n);

  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map((row) => (
        <li key={row.type_id} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-ink sm:w-48" title={row.type_name}>
            {row.type_name}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(row.n / total) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-ink">{row.n}</span>
        </li>
      ))}
    </ul>
  );
}
