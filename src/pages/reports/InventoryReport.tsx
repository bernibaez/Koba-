import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, Layers, TrendingDown } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle, ReportLoading, ReportError, type ReportPeriodProps } from './shared';
import { informeInventario, type InformeInventario } from '@/services/informes.service';

const stockBadge = (estado: string) => {
  if (estado === 'Agotado') return <span className="badge-danger">Agotado</span>;
  if (estado === 'Bajo') return <span className="badge-warning">Bajo</span>;
  return <span className="badge-success">OK</span>;
};

export default function InventoryReport({ dateFrom: _dateFrom, dateTo: _dateTo }: ReportPeriodProps) {
  const [data, setData] = useState<InformeInventario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    informeInventario()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Error al cargar inventario');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categoryStock = useMemo(() => {
    if (!data?.rows.length) return [];
    const map = new Map<string, number>();
    for (const r of data.rows) {
      const cat = String(r[2] ?? 'Otros');
      const raw = String(r[5]).replace(/[^\d.-]/g, '');
      map.set(cat, (map.get(cat) ?? 0) + Number(raw || 0));
    }
    return [...map.entries()].map(([name, valor]) => ({ name, valor }));
  }, [data]);

  if (loading) return <ReportLoading />;
  if (error) return <ReportError error={error} />;
  if (!data) return <ReportError error="Sin datos" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Valor de inventario" value={formatRD(data.valor)} trend={`${data.skus} SKUs activos`} icon={<Package size={16} className="text-primary" />} />
        <KpiCard label="Stock bajo" value={String(data.bajos)} trend="Requieren reposición" trendPositive={false} icon={<AlertTriangle size={16} className="text-warning" />} />
        <KpiCard label="Productos agotados" value={String(data.agotados)} trend="Sin existencia" trendPositive={false} icon={<TrendingDown size={16} className="text-danger" />} />
        <KpiCard label="Categorías" value={String(categoryStock.length)} trend="Snapshot actual" icon={<Layers size={16} className="text-info" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Valor de inventario por categoría</h3>
        {categoryStock.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Sin productos activos</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryStock} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
              <Bar dataKey="valor" fill="var(--primary)" radius={[0, 4, 4, 0]} name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Estado de inventario</h3>
        <ReportTable
          headers={['SKU', 'Producto', 'Categoría', 'Stock', 'Mín.', 'Valor', 'Estado']}
          rows={data.rows.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], stockBadge(String(r[6]))])}
        />
      </div>
    </div>
  );
}
