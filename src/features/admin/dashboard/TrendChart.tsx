export interface TrendBucket {
  key: string;
  label: string;
  total: number;
}

/**
 * Barras decorativas (`aria-hidden`) + una lista de texto siempre visible
 * al lado con los mismos números — regla dura #10 (nunca solo color) y
 * para que un lector de pantalla tenga los datos reales, no solo el
 * gráfico. Sin librería de gráficos: `div`s + tokens existentes.
 */
export function TrendChart({ buckets }: { buckets: TrendBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.total));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
      <div aria-hidden="true" className="flex h-32 flex-1 items-end gap-2 sm:h-40">
        {buckets.map((b) => (
          <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium tabular-nums text-ink">{b.total}</span>
            <div
              className="w-full min-h-[2px] rounded-t-sm bg-accent"
              style={{ height: `${Math.max(4, (b.total / max) * 100)}%` }}
            />
            <span className="text-[11px] text-muted">{b.label}</span>
          </div>
        ))}
      </div>
      <dl className="flex shrink-0 flex-col gap-1 sm:w-40">
        {buckets.map((b) => (
          <div key={b.key} className="flex justify-between gap-3 text-sm">
            <dt className="text-muted">{b.label}</dt>
            <dd className="font-medium tabular-nums text-ink">{b.total}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
