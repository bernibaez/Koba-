import React, { useMemo, useState } from 'react';
import { Package, AlertTriangle, DollarSign, Search } from 'lucide-react';

const mockProducts = [
  { sku: 'SKU-001', name: 'Arroz Selecto 5lb', category: 'Alimentos', stock: 245, minStock: 50, unitCost: 180, value: 44100 },
  { sku: 'SKU-014', name: 'Aceite Vegetal 1L', category: 'Alimentos', stock: 18, minStock: 40, unitCost: 220, value: 3960 },
  { sku: 'SKU-022', name: 'Leche Entera 1L', category: 'Lácteos', stock: 8, minStock: 30, unitCost: 65, value: 520 },
  { sku: 'SKU-045', name: 'Refresco Cola 2L', category: 'Bebidas', stock: 5, minStock: 25, unitCost: 85, value: 425 },
  { sku: 'SKU-058', name: 'Detergente 1kg', category: 'Limpieza', stock: 0, minStock: 15, unitCost: 120, value: 0 },
  { sku: 'SKU-072', name: 'Azúcar Blanca 2lb', category: 'Alimentos', stock: 120, minStock: 40, unitCost: 95, value: 11400 },
  { sku: 'SKU-088', name: 'Pan de Molde', category: 'Panadería', stock: 0, minStock: 20, unitCost: 75, value: 0 },
  { sku: 'SKU-091', name: 'Jabón en Barra', category: 'Limpieza', stock: 64, minStock: 30, unitCost: 35, value: 2240 },
];

function stockStatus(stock: number, minStock: number) {
  if (stock <= 0) return { label: 'Agotado', cls: 'badge-danger' };
  if (stock < minStock) return { label: 'Bajo', cls: 'badge-warning' };
  return { label: 'OK', cls: 'badge-success' };
}

/** Informe de stock detallado (dentro de Informes) */
export default function StockDetailReport() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      mockProducts.filter(
        (p) =>
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const totalStock = mockProducts.reduce((s, p) => s + p.stock, 0);
  const outOfStock = mockProducts.filter((p) => p.stock <= 0).length;
  const inventoryValue = mockProducts.reduce((s, p) => s + p.value, 0);

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
            <p className="text-2xl font-bold text-success mt-1">
              RD$ {inventoryValue.toLocaleString('es-DO')}
            </p>
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
              {filtered.map((p) => {
                const status = stockStatus(p.stock, p.minStock);
                return (
                  <tr key={p.sku} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-primary font-medium">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className="px-4 py-3 font-semibold">{p.stock}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.minStock}</td>
                    <td className="px-4 py-3 font-bold">RD$ {p.value.toLocaleString('es-DO')}</td>
                    <td className="px-4 py-3"><span className={status.cls}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
