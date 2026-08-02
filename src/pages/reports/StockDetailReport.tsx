import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, DollarSign, Search } from 'lucide-react';
import { formatRD, ReportLoading, ReportError, type ReportPeriodProps } from './shared';
import { informeStockDetalle, type StockDetalleItem } from '@/services/informes.service';

function stockStatus(stock: number, minStock: number) {
  if (stock <= 0) return { label: 'Agotado', cls: 'badge-danger' };
  if (stock < minStock) return { label: 'Bajo', cls: 'badge-warning' };
  return { label: 'OK', cls: 'badge-success' };
}

export default function StockDetailReport({ dateFrom: _dateFrom, dateTo: _dateTo }: ReportPeriodProps) {
  const [items, setItems] = useState<StockDetalleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    informeStockDetalle()
      .then((d) => {
        if (alive) setItems(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Error al cargar stock');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  if (loading) return <ReportLoading />;
  if (error) return <ReportError error={error} />;

  const totalStock = items.reduce((s, p) => s + p.stock, 0);
  const outOfStock = items.filter((p) => p.stock <= 0).length;
  const inventoryValue = items.reduce((s, p) => s + p.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Existencias</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalStock.toLocaleString('es-DO')}</p>
            <p className="text-xs text-muted-foreground mt-1">unidades en almacén</p>
          </div>
          <Package size={20} className="text-primary" />
        </div>
        <div className="card p-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Agotados</p>
            <p className="text-2xl font-bold text-danger mt-1">{outOfStock}</p>
            <p className="text-xs text-muted-foreground mt-1">productos sin stock</p>
          </div>
          <AlertTriangle size={20} className="text-danger" />
        </div>
        <div className="card p-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Valor inventario</p>
            <p className="text-2xl font-bold text-success mt-1">{formatRD(inventoryValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">a costo</p>
          </div>
          <DollarSign size={20} className="text-success" />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-9"
          placeholder="Buscar por SKU, producto o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Mín.</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Sin datos en el periodo
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const status = stockStatus(p.stock, p.min);
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-primary font-medium">{p.sku}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                      <td className="px-4 py-3 font-semibold">{p.stock}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.min}</td>
                      <td className="px-4 py-3 font-bold">{formatRD(p.value)}</td>
                      <td className="px-4 py-3">
                        <span className={status.cls}>{status.label}</span>
                      </td>
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
