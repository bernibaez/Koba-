import React, { useEffect, useMemo, useState } from 'react';
import { Search, Sliders } from 'lucide-react';
import { KpiCard, ReportLoading, ReportError, type ReportPeriodProps } from './shared';
import { informeAjustes, type InformeAjustes } from '@/services/informes.service';

export default function AdjustmentsReport({ dateFrom, dateTo }: ReportPeriodProps) {
  const [data, setData] = useState<InformeAjustes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    informeAjustes({ desde: dateFrom, hasta: dateTo })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Error al cargar ajustes');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.rows.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.productName.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.date.includes(search) ||
        a.type.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (loading) return <ReportLoading />;
  if (error) return <ReportError error={error} />;
  if (!data) return <ReportError error="Sin datos" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total ajustes" value={String(data.total)} trend={`${dateFrom} → ${dateTo}`} icon={<Sliders size={16} className="text-primary" />} />
        <KpiCard label="Entradas" value={String(data.entradas)} trend="Incrementos" icon={<Sliders size={16} className="text-success" />} />
        <KpiCard label="Salidas" value={String(data.salidas)} trend="Disminuciones" trendPositive={false} icon={<Sliders size={16} className="text-danger" />} />
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por código, producto o motivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Anterior</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Nueva</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Diferencia</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Sin datos en el periodo
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const diff = a.newQty - a.previousQty;
                  return (
                    <tr key={a.code + a.date} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{a.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                      <td className="px-4 py-3 text-foreground">{a.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell font-mono text-xs">{a.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.previousQty}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.newQty}</td>
                      <td className="px-4 py-3">
                        <span className={diff >= 0 ? 'badge-success' : 'badge-danger'}>
                          {diff >= 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{a.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
