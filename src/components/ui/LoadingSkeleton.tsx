import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} style={style} aria-hidden />;
}

type SpinnerSize = 'sm' | 'md' | 'lg';

const SPINNER_SIZE: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

/** Spinner circular reutilizable */
export function Spinner({
  size = 'md',
  className = '',
  label = 'Cargando',
}: {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-primary/25 border-t-primary animate-spin ${SPINNER_SIZE[size]} ${className}`}
    />
  );
}

/** Spinner pequeño para botones */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin ${className}`}
      aria-hidden
    />
  );
}

/** Carga a pantalla completa (sesión / boot) */
export function PageLoader({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background page-loader-bg">
      <div className="relative flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/15 loader-ping" />
        <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">MarketERP</p>
      </div>
    </div>
  );
}

/** Bloque centrado para tarjetas / secciones */
export function ContentLoader({
  message = 'Cargando datos…',
  className = '',
  compact = false,
}: {
  message?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`card flex flex-col items-center justify-center gap-3 text-center ${
        compact ? 'p-8' : 'p-12'
      } ${className}`}
      role="status"
    >
      <Spinner size={compact ? 'sm' : 'md'} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Fila inline (tablas / listas) */
export function InlineLoader({
  message = 'Cargando…',
  colSpan = 1,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10">
        <div className="flex flex-col items-center justify-center gap-2.5" role="status">
          <Spinner size="sm" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <KpiCardSkeleton key={`kpi-skel-${i}`} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 8 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-col-${i + 1}`} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({
  cols = 8,
  rows = 6,
  headers,
}: {
  cols?: number;
  rows?: number;
  headers?: string[];
}) {
  const colCount = headers?.length ?? cols;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {headers && (
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <TableRowSkeleton key={`skel-row-${i}`} cols={colCount} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-xl" style={{ height }} />;
}

/** Skeleton de página típica ERP: KPIs + tabla */
export function PageContentSkeleton({
  kpiCount = 4,
  tableCols = 8,
  tableRows = 6,
}: {
  kpiCount?: number;
  tableCols?: number;
  tableRows?: number;
}) {
  return (
    <div className="space-y-6 fade-in" aria-busy="true" aria-label="Cargando contenido">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <KpiGridSkeleton count={kpiCount} />
      <Skeleton className="h-12 w-full rounded-xl" />
      <TableSkeleton cols={tableCols} rows={tableRows} />
    </div>
  );
}
