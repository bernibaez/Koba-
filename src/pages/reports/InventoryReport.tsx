import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, Layers, TrendingDown } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const categoryStock = [
  { name: 'Alimentos', valor: 420000, skus: 186 },
  { name: 'Bebidas', valor: 185000, skus: 94 },
  { name: 'Lácteos', valor: 98000, skus: 52 },
  { name: 'Carnes', valor: 142000, skus: 38 },
  { name: 'Limpieza', valor: 67000, skus: 71 },
  { name: 'Otros', valor: 45000, skus: 44 },
];

const stockRows = [
  ['SKU-001', 'Arroz Selecto 5lb', 'Alimentos', '245', '50', formatRD(68600)],
  ['SKU-014', 'Aceite Vegetal 1L', 'Alimentos', '18', '40', formatRD(6300)],
  ['SKU-022', 'Leche Entera 1L', 'Lácteos', '8', '30', formatRD(2400)],
  ['SKU-031', 'Pollo Entero', 'Carnes', '42', '20', formatRD(21000)],
  ['SKU-045', 'Refresco Cola 2L', 'Bebidas', '5', '25', formatRD(750)],
  ['SKU-058', 'Detergente 1kg', 'Limpieza', '0', '15', formatRD(0)],
];

const stockBadge = (qty: string, min: string) => {
  const q = Number(qty);
  const m = Number(min);
  if (q === 0) return <span className="badge-danger">Agotado</span>;
  if (q <= m) return <span className="badge-warning">Bajo</span>;
  return <span className="badge-success">OK</span>;
};

export default function InventoryReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Valor de inventario" value="RD$ 957K" trend="485 SKUs activos" icon={<Package size={16} className="text-primary" />} />
        <KpiCard label="Stock bajo" value="28" trend="Requieren reposición" trendPositive={false} icon={<AlertTriangle size={16} className="text-warning" />} />
        <KpiCard label="Productos agotados" value="6" trend="Sin existencia" trendPositive={false} icon={<TrendingDown size={16} className="text-danger" />} />
        <KpiCard label="Categorías" value="6" trend="Cobertura completa" icon={<Layers size={16} className="text-info" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Valor de inventario por categoría</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoryStock} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="valor" fill="var(--primary)" radius={[0, 4, 4, 0]} name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Estado de inventario (muestra crítica)</h3>
        <ReportTable
          headers={['SKU', 'Producto', 'Categoría', 'Stock', 'Mín.', 'Valor', 'Estado']}
          rows={stockRows.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], stockBadge(String(r[3]), String(r[4]))])}
        />
      </div>
    </div>
  );
}
