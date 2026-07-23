import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Truck, FileText, Package, CreditCard } from 'lucide-react';
import { KpiCard, ReportTable, formatRD, chartTooltipStyle } from './shared';

const topSuppliers = [
  { name: 'Distribuidora Norte', compras: 125400 },
  { name: 'Alimentos del Caribe', compras: 84200 },
  { name: 'Bebidas RD S.A.', compras: 61800 },
  { name: 'Lácteos del Cibao', compras: 52000 },
  { name: 'Carnes Selectas', compras: 31400 },
];

const purchaseRows = [
  ['OC-0142', '15/01/2024', 'Distribuidora Norte', 'Recibida', formatRD(45200)],
  ['OC-0141', '14/01/2024', 'Alimentos del Caribe', 'Recibida', formatRD(28100)],
  ['OC-0140', '12/01/2024', 'Bebidas RD S.A.', 'Parcial', formatRD(18650)],
  ['OC-0139', '10/01/2024', 'Lácteos del Cibao', 'Pendiente', formatRD(52000)],
];

const balanceRows = [
  ['PROV-001', 'Distribuidora Norte', formatRD(125400), formatRD(38500), '3 facturas'],
  ['PROV-002', 'Importadora del Caribe', formatRD(84200), formatRD(21830), '1 factura'],
  ['PROV-003', 'Bebidas y Más', formatRD(61800), formatRD(9160), '1 factura'],
  ['PROV-004', 'Lácteos del Cibao', formatRD(52000), formatRD(9600), '2 facturas'],
];

const invoiceRows = [
  ['FAC-P-088', '15/01/2024', 'Distribuidora Norte', formatRD(45200), 'Pendiente'],
  ['FAC-P-087', '14/01/2024', 'Alimentos del Caribe', formatRD(28100), 'Pagada'],
  ['FAC-P-086', '12/01/2024', 'Bebidas RD S.A.', formatRD(18650), 'Parcial'],
  ['FAC-P-085', '10/01/2024', 'Lácteos del Cibao', formatRD(52000), 'Pendiente'],
];

const productsRows = [
  ['SKU-001', 'Arroz Selecto 5lb', 'Distribuidora Norte', '12', formatRD(180)],
  ['SKU-014', 'Aceite Vegetal 1L', 'Alimentos del Caribe', '8', formatRD(220)],
  ['SKU-022', 'Leche Entera 1L', 'Lácteos del Cibao', '15', formatRD(65)],
  ['SKU-045', 'Refresco Cola 2L', 'Bebidas RD S.A.', '20', formatRD(85)],
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Recibida: 'badge-success',
    Pagada: 'badge-success',
    Parcial: 'badge-warning',
    Pendiente: 'badge-info',
  };
  return <span className={map[status] || 'badge-info'}>{status}</span>;
};

export default function SuppliersReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Compras del periodo" value="RD$ 355K" trend="+5.1% vs mes anterior" icon={<Truck size={16} className="text-warning" />} />
        <KpiCard label="Saldo por pagar" value="RD$ 79.1K" trend="7 facturas abiertas" trendPositive={false} icon={<CreditCard size={16} className="text-danger" />} />
        <KpiCard label="Facturas recibidas" value="28" trend="4 pendientes de pago" icon={<FileText size={16} className="text-info" />} />
        <KpiCard label="Productos suministrados" value="186" trend="12 proveedores activos" icon={<Package size={16} className="text-primary" />} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-foreground mb-4">Top proveedores por compras</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topSuppliers} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatRD(v)} contentStyle={chartTooltipStyle} />
            <Bar dataKey="compras" fill="var(--warning)" radius={[0, 4, 4, 0]} name="Compras" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Compras por proveedor</h3>
        <ReportTable
          headers={['Orden', 'Fecha', 'Proveedor', 'Estado', 'Total']}
          rows={purchaseRows.map((r) => [r[0], r[1], r[2], statusBadge(String(r[3])), r[4]])}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Balance pendiente</h3>
        <ReportTable
          headers={['Código', 'Proveedor', 'Compras periodo', 'Saldo', 'Facturas']}
          rows={balanceRows}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Facturas de proveedores</h3>
        <ReportTable
          headers={['Factura', 'Fecha', 'Proveedor', 'Monto', 'Estado']}
          rows={invoiceRows.map((r) => [r[0], r[1], r[2], r[3], statusBadge(String(r[4]))])}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Productos suministrados</h3>
        <ReportTable
          headers={['SKU', 'Producto', 'Proveedor', 'Órdenes', 'Costo unit.']}
          rows={productsRows}
        />
      </div>
    </div>
  );
}
