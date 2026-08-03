import React from 'react';

export type ReportPeriodProps = {
  dateFrom: string;
  dateTo: string;
};

export function formatRD(value: number) {
  return `RD$ ${value.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function ReportLoading({ message = 'Cargando informe…' }: { message?: string }) {
  return (
    <div className="card p-12 flex flex-col items-center justify-center gap-3 text-center fade-in" role="status">
      <span
        className="inline-block h-8 w-8 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-2">
        <div className="skeleton-shimmer h-16 rounded-xl" />
        <div className="skeleton-shimmer h-16 rounded-xl" />
        <div className="skeleton-shimmer h-16 rounded-xl" />
      </div>
      <div className="w-full max-w-md skeleton-shimmer h-40 rounded-xl mt-1" />
    </div>
  );
}

export function ReportError({ error }: { error: string }) {
  return (
    <div className="card p-8 text-center text-danger text-sm">{error}</div>
  );
}

export function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `RD$ ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `RD$ ${(value / 1_000).toFixed(0)}K`;
  return formatRD(value);
}

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ReactNode;
}

export function KpiCard({ label, value, trend, trendPositive = true, icon }: KpiCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trendPositive ? 'text-success' : 'text-danger'}`}>{trend}</p>
      )}
    </div>
  );
}

interface ReportTableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  emptyMessage?: string;
}

export function ReportTable({ headers, rows, emptyMessage = 'Sin datos en el periodo' }: ReportTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-foreground whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const chartTooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
};
