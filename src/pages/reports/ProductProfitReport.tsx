import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, FileSpreadsheet, Package } from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { formatRD, ReportLoading, ReportError, type ReportPeriodProps } from './shared';
import { informeGananciasProducto, type ProductoGanancia } from '@/services/informes.service';

export default function ProductProfitReport({ dateFrom, dateTo }: ReportPeriodProps) {
  const [items, setItems] = useState<ProductoGanancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    informeGananciasProducto({ desde: dateFrom, hasta: dateTo })
      .then((d) => {
        if (alive) setItems(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Error al cargar ganancias por producto');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dateFrom, dateTo]);

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category).filter(Boolean));
    return ['all', ...[...set].sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      return matchSearch && matchCat;
    });
  }, [items, search, category]);

  const totalSalesAcc = filtered.reduce((s, p) => s + p.totalSales, 0);
  const totalProfitAcc = filtered.reduce((s, p) => s + p.profit, 0);
  const avgMargin = totalSalesAcc > 0 ? ((totalProfitAcc / totalSalesAcc) * 100).toFixed(1) : '0.0';

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Ganancias por Producto',
      subtitle: `Periodo: ${dateFrom} — ${dateTo}`,
      filename: `ganancias-por-producto-${dateFrom}-${dateTo}`,
      headers: ['SKU', 'Producto', 'Categoría', 'Cant. Vendida', 'Costo Total', 'Venta Total', 'Ganancia', 'Margen %'],
      rows: filtered.map((p) => [
        p.sku,
        p.name,
        p.category,
        `${p.qty} uds`,
        formatMoneyPdf(p.totalCost),
        formatMoneyPdf(p.totalSales),
        formatMoneyPdf(p.profit),
        `${p.margin.toFixed(1)}%`,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Ganancias por Producto',
      filename: `ganancias-por-producto-${dateFrom}-${dateTo}`,
      headers: ['SKU', 'Producto', 'Categoría', 'Cantidad Vendida', 'Costo Total', 'Venta Total', 'Ganancia Bruta', 'Margen Porcentaje'],
      rows: filtered.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.qty,
        p.totalCost,
        p.totalSales,
        p.profit,
        p.margin,
      ]),
    });
  };

  if (loading) return <ReportLoading />;
  if (error) return <ReportError error={error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Productos Evaluados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Venta Total Acumulada</p>
          <p className="text-2xl font-bold text-info mt-1">{formatRD(totalSalesAcc)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Ganancia Total</p>
          <p className="text-2xl font-bold text-success mt-1">{formatRD(totalProfitAcc)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Margen Promedio %</p>
          <p className="text-2xl font-bold text-primary mt-1">{avgMargin}%</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar Producto</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input-field pl-9 text-xs"
                placeholder="Nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoría</label>
            <select className="input-field text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={`cat-${c}`} value={c}>
                  {c === 'all' ? 'Todas las categorías' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-xs text-muted-foreground pb-2">
              Periodo: {dateFrom} → {dateTo}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">Mostrando {filtered.length} producto(s)</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleExportPdf} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <Download size={14} /> PDF
            </button>
            <button type="button" onClick={handleExportExcel} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto / SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Categoría</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Cant. Vendida</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Costo Total</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Venta Total</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ganancia</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    Sin datos en el periodo
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-foreground">{p.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-neutral text-xs">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{p.qty} uds</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatRD(p.totalCost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground">{formatRD(p.totalSales)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-success">{formatRD(p.profit)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="inline-block px-2 py-0.5 rounded bg-success-bg text-success font-bold text-xs">
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
