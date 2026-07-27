import React, { useMemo, useState } from 'react';
import { Search, Download, FileSpreadsheet, Filter, TrendingUp, Package } from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';

export interface ProductProfitItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  branch: string;
  qtySold: number;
  totalCost: number;
  totalSales: number;
  profit: number;
  marginPercent: number;
}

const mockProductProfits: ProductProfitItem[] = [
  { id: '1', name: 'Arroz Selecto 5lb', sku: 'ARR-SEL-5LB', category: 'Granos', supplier: 'Distribuidora El Caribe', branch: 'Sucursal Central', qtySold: 420, totalCost: 88200, totalSales: 119700, profit: 31500, marginPercent: 26.3 },
  { id: '2', name: 'Aceite Vegetal 1L', sku: 'ACE-VEG-1L', category: 'Granos', supplier: 'Importadora Pérez', branch: 'Sucursal Central', qtySold: 310, totalCost: 43400, totalSales: 60450, profit: 17050, marginPercent: 28.2 },
  { id: '3', name: 'Pollo Entero /lb', sku: 'POL-ENT-LB', category: 'Carnes', supplier: 'Pollo Rey SRL', branch: 'Sucursal Norte', qtySold: 540, totalCost: 38880, totalSales: 52920, profit: 14040, marginPercent: 26.5 },
  { id: '4', name: 'Leche Evaporada 410g', sku: 'LEC-EVA-410', category: 'Lácteos', supplier: 'Nestlé Dominicana', branch: 'Sucursal Central', qtySold: 280, totalCost: 30240, totalSales: 40600, profit: 10360, marginPercent: 25.5 },
  { id: '5', name: 'Azúcar Blanca 5lb', sku: 'AZU-BLA-5LB', category: 'Granos', supplier: 'Central Romana Corp.', branch: 'Sucursal Sur', qtySold: 230, totalCost: 29440, totalSales: 40250, profit: 10810, marginPercent: 26.8 },
  { id: '6', name: 'Detergente Líq. 1.5L', sku: 'DET-LIQ-1.5', category: 'Limpieza', supplier: 'Colgate-Palmolive DO', branch: 'Sucursal Central', qtySold: 180, totalCost: 35100, totalSales: 51300, profit: 16200, marginPercent: 31.5 },
  { id: '7', name: 'Yogur Griego 500g', sku: 'YOG-GRI-500', category: 'Lácteos', supplier: 'Importadora Pérez', branch: 'Sucursal Norte', qtySold: 140, totalCost: 19600, totalSales: 27300, profit: 7700, marginPercent: 28.2 },
  { id: '8', name: 'Jugo Naranja 1L', sku: 'JUG-NAR-1L', category: 'Bebidas', supplier: 'Nestlé Dominicana', branch: 'Sucursal Central', qtySold: 195, totalCost: 20475, totalSales: 28275, profit: 7800, marginPercent: 27.5 },
];

const categories = ['all', 'Granos', 'Carnes', 'Lácteos', 'Limpieza', 'Bebidas'];
const suppliers = ['all', 'Distribuidora El Caribe', 'Importadora Pérez', 'Pollo Rey SRL', 'Nestlé Dominicana', 'Central Romana Corp.', 'Colgate-Palmolive DO'];
const branches = ['all', 'Sucursal Central', 'Sucursal Norte', 'Sucursal Sur'];

export default function ProductProfitReport() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [supplier, setSupplier] = useState('all');
  const [branch, setBranch] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return mockProductProfits.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      const matchSup = supplier === 'all' || p.supplier === supplier;
      const matchBranch = branch === 'all' || p.branch === branch;
      return matchSearch && matchCat && matchSup && matchBranch;
    });
  }, [search, category, supplier, branch]);

  const totalSalesAcc = filtered.reduce((s, p) => s + p.totalSales, 0);
  const totalCostAcc = filtered.reduce((s, p) => s + p.totalCost, 0);
  const totalProfitAcc = filtered.reduce((s, p) => s + p.profit, 0);
  const avgMargin = totalSalesAcc > 0 ? ((totalProfitAcc / totalSalesAcc) * 100).toFixed(1) : '0.0';

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Reporte de Ganancias por Producto',
      filename: 'ganancias-por-producto',
      headers: ['SKU', 'Producto', 'Categoría', 'Proveedor', 'Cant. Vendida', 'Costo Total', 'Venta Total', 'Ganancia', 'Margen %'],
      rows: filtered.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.supplier,
        `${p.qtySold} uds`,
        formatMoneyPdf(p.totalCost),
        formatMoneyPdf(p.totalSales),
        formatMoneyPdf(p.profit),
        `${p.marginPercent.toFixed(1)}%`,
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Reporte de Ganancias por Producto',
      filename: 'ganancias-por-producto',
      headers: ['SKU', 'Producto', 'Categoría', 'Proveedor', 'Sucursal', 'Cantidad Vendida', 'Costo Total', 'Venta Total', 'Ganancia Bruta', 'Margen Porcentaje'],
      rows: filtered.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.supplier,
        p.branch,
        p.qtySold,
        p.totalCost,
        p.totalSales,
        p.profit,
        p.marginPercent,
      ]),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Productos Evaluados</p>
          <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Venta Total Acumulada</p>
          <p className="text-2xl font-bold text-info mt-1">
            RD$ {totalSalesAcc.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Ganancia Total</p>
          <p className="text-2xl font-bold text-success mt-1">
            RD$ {totalProfitAcc.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted-foreground">Margen Promedio %</p>
          <p className="text-2xl font-bold text-primary mt-1">{avgMargin}%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                <option key={`cat-${c}`} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Proveedor</label>
            <select className="input-field text-xs" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              {suppliers.map((s) => (
                <option key={`sup-${s}`} value={s}>{s === 'all' ? 'Todos los proveedores' : s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sucursal</label>
            <select className="input-field text-xs" value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={`br-${b}`} value={b}>{b === 'all' ? 'Todas las sucursales' : b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Rango de Fecha</label>
            <div className="flex gap-1">
              <input type="date" className="input-field text-[11px] px-1 py-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" className="input-field text-[11px] px-1 py-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
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

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Producto / SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Proveedor</th>
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
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Package size={28} className="mx-auto mb-2 opacity-30" />
                    No hay productos con los filtros seleccionados
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
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{p.supplier}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{p.qtySold} uds</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      RD$ {p.totalCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-foreground">
                      RD$ {p.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-success">
                      RD$ {p.profit.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="inline-block px-2 py-0.5 rounded bg-success-bg text-success font-bold text-xs">
                        {p.marginPercent.toFixed(1)}%
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
