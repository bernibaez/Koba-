import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ShoppingCart, FileText, RotateCcw, Plus, Search, Filter, Download, Eye, Edit2, Trash2, Printer, X, FileSpreadsheet } from 'lucide-react';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';
import { useVentas } from '@/hooks/useVentas';

interface Sale {
  id: string;
  code: string;
  customer: string;
  date: string;
  time: string;
  items: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cost: number;
  profit: number;
  status: 'paid' | 'pending' | 'cancelled';
  payment: string;
  agent: string;
}

interface Quote {
  id: number; code: string; customer: string; date: string; validUntil: string; total: number; status: 'pending' | 'approved' | 'rejected' | 'converted';
}
interface SaleReturn {
  id: number; code: string; saleCode: string; customer: string; date: string; total: number; reason: string; status: 'approved' | 'pending';
}

const mockQuotes: Quote[] = [
  { id: 1, code: 'COT-001', customer: 'Empresa ABC S.R.L.', date: '2026-07-25', validUntil: '2026-08-01', total: 35000, status: 'pending' },
  { id: 2, code: 'COT-002', customer: 'Distribuidora XYZ', date: '2026-07-24', validUntil: '2026-07-31', total: 78000, status: 'approved' },
  { id: 3, code: 'COT-003', customer: 'Juan Pérez', date: '2026-07-22', validUntil: '2026-07-29', total: 4500, status: 'converted' },
];

const mockReturns: SaleReturn[] = [
  { id: 1, code: 'DEV-001', saleCode: 'FAC-001', customer: 'Juan Pérez', date: '2026-07-25', total: 450, reason: 'Producto defectuoso', status: 'approved' },
  { id: 2, code: 'DEV-002', saleCode: 'FAC-003', customer: 'Rosa Jiménez', date: '2026-07-24', total: 200, reason: 'Cambio de producto', status: 'pending' },
];

type Tab = 'sales' | 'quotes' | 'returns';

const saleStatusMap: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Pagado', cls: 'badge-success' },
  pending: { label: 'Pendiente', cls: 'badge-warning' },
  cancelled: { label: 'Cancelado', cls: 'badge-danger' },
  approved: { label: 'Aprobado', cls: 'badge-success' },
  rejected: { label: 'Rechazado', cls: 'badge-danger' },
  converted: { label: 'Convertido', cls: 'badge-info' },
};

const metodoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  mixto: 'Mixto',
};

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>('sales');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const { ventas } = useVentas({
    pagina: 1,
    limite: 100,
    busqueda: search,
    fechaInicio: dateFrom || undefined,
    fechaFin: dateTo || undefined,
  });

  const sales: Sale[] = useMemo(
    () =>
      ventas.map((v) => {
        const d = new Date(v.creado_en);
        return {
          id: v.id,
          code: v.numero_factura,
          customer: v.cliente_id ?? 'Cliente general',
          date: d.toISOString().slice(0, 10),
          time: d.toTimeString().slice(0, 5),
          items: 0,
          subtotal: Number(v.subtotal),
          tax: Number(v.monto_impuesto),
          discount: Number(v.monto_descuento),
          total: Number(v.monto_total),
          cost: Number(v.costo_total),
          profit: Number(v.monto_total) - Number(v.costo_total),
          status:
            v.estado === 'completada' ? 'paid' : v.estado === 'anulada' ? 'cancelled' : 'pending',
          payment: metodoLabel[v.metodo_pago] ?? v.metodo_pago,
          agent: v.cajero_id ?? '—',
        };
      }),
    [ventas]
  );

  const filteredSales = sales;

  const handleExportPdf = () => {
    if (tab === 'sales') {
      exportTableToPdf({
        title: 'Historial Detallado de Ventas',
        filename: 'historial-ventas',
        headers: ['Factura', 'Fecha', 'Cliente', 'Usuario/Agente', 'Pago', 'Subtotal', 'ITBIS (18%)', 'Desc.', 'Total', 'Costo', 'Ganancia', 'Estado'],
        rows: filteredSales.map((s) => [
          s.code,
          `${s.date} ${s.time}`,
          s.customer,
          s.agent,
          s.payment,
          formatMoneyPdf(s.subtotal),
          formatMoneyPdf(s.tax),
          formatMoneyPdf(s.discount),
          formatMoneyPdf(s.total),
          formatMoneyPdf(s.cost),
          formatMoneyPdf(s.profit),
          saleStatusMap[s.status]?.label ?? s.status,
        ]),
        landscape: true,
      });
      return;
    }
    if (tab === 'quotes') {
      exportTableToPdf({
        title: 'Listado de Cotizaciones',
        filename: 'cotizaciones',
        headers: ['Código', 'Cliente', 'Fecha', 'Válida hasta', 'Total', 'Estado'],
        rows: mockQuotes.map((q) => [
          q.code,
          q.customer,
          q.date,
          q.validUntil,
          formatMoneyPdf(q.total),
          saleStatusMap[q.status]?.label ?? q.status,
        ]),
      });
      return;
    }
    exportTableToPdf({
      title: 'Devoluciones de Venta',
      filename: 'devoluciones-venta',
      headers: ['Código', 'Factura', 'Cliente', 'Fecha', 'Total', 'Motivo', 'Estado'],
      rows: mockReturns.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        formatMoneyPdf(r.total),
        r.reason,
        saleStatusMap[r.status]?.label ?? r.status,
      ]),
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Historial Detallado de Ventas',
      filename: 'historial-ventas',
      headers: ['Factura', 'Fecha', 'Hora', 'Cliente', 'Usuario Agente', 'Método Pago', 'Ítems', 'Subtotal', 'ITBIS (18%)', 'Descuento', 'Total Factura', 'Costo Total', 'Ganancia Bruta', 'Estado'],
      rows: filteredSales.map((s) => [
        s.code,
        s.date,
        s.time,
        s.customer,
        s.agent,
        s.payment,
        s.items,
        s.subtotal,
        s.tax,
        s.discount,
        s.total,
        s.cost,
        s.profit,
        saleStatusMap[s.status]?.label ?? s.status,
      ]),
    });
  };

  if (showAddForm) {
    return (
      <AppLayout>
        <div className="space-y-6 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nueva Venta</h1>
              <p className="text-sm text-muted-foreground mt-1">Registrar factura de venta con ITBIS transparentado</p>
            </div>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">← Volver</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Información de la Venta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente *</label>
                    <select className="input-field"><option>Seleccionar cliente...</option><option>Juan Pérez</option><option>Empresa ABC S.R.L.</option></select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha *</label>
                    <input type="date" className="input-field" defaultValue="2026-07-26" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Agente / Usuario</label>
                    <select className="input-field"><option>Roberto Díaz</option><option>Luisa Fernández</option></select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Método de Pago</label>
                    <select className="input-field"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Crédito</option></select>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Productos</h3>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input className="input-field pl-8 py-1.5 text-xs w-48" placeholder="Buscar producto..." />
                    </div>
                    <button className="btn-primary flex items-center gap-1 text-xs py-1.5"><Plus size={14} />Agregar</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Producto</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Precio</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Cant.</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Desc.</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Total</th>
                      <th className="py-2"></th>
                    </tr></thead>
                    <tbody>
                      {[
                        { name: 'Arroz Selecto 5lb', price: 285, qty: 5, disc: 0, total: 1425 },
                        { name: 'Aceite Vegetal 1L', price: 195, qty: 3, disc: 0, total: 585 },
                      ].map((item, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-2 text-foreground font-medium">{item.name}</td>
                          <td className="py-2"><input type="number" defaultValue={item.price} className="input-field w-24 py-1" /></td>
                          <td className="py-2"><input type="number" defaultValue={item.qty} className="input-field w-16 py-1" /></td>
                          <td className="py-2"><input type="number" defaultValue={item.disc} className="input-field w-16 py-1" /></td>
                          <td className="py-2 font-semibold text-foreground">RD$ {item.total.toLocaleString()}</td>
                          <td className="py-2"><button className="p-1 text-danger hover:bg-danger-bg rounded"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Resumen de Facturación</h3>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">RD$ 2,010.00</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span className="font-medium text-success">- RD$ 0.00</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">ITBIS (18% transparentado)</span><span className="font-medium">RD$ 361.80</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-lg"><span>Total Factura</span><span>RD$ 2,371.80</span></div>
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Cobro</h3>
                <div><label className="text-xs text-muted-foreground mb-1 block">Monto recibido</label><input className="input-field" placeholder="0.00" type="number" /></div>
                <div className="flex justify-between text-sm font-semibold"><span>Cambio a devolver</span><span className="text-success">RD$ 0.00</span></div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => window.print()}><Printer size={16} />Imprimir</button>
                <button className="btn-primary flex-1" onClick={() => { toast.success('Venta guardada'); setShowAddForm(false); }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ventas e Historial Detallado</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona facturas, cotizaciones, ganancia por venta e ITBIS transparentado</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={16} />Nueva Venta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4"><p className="text-xs text-muted-foreground">Ventas totales en filtro</p><p className="text-2xl font-bold text-foreground mt-1">RD$ {filteredSales.reduce((s, x) => s + x.total, 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Ganancia Bruta total</p><p className="text-2xl font-bold text-success mt-1">RD$ {filteredSales.reduce((s, x) => s + x.profit, 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">ITBIS Transparentado</p><p className="text-2xl font-bold text-warning mt-1">RD$ {filteredSales.reduce((s, x) => s + x.tax, 0).toLocaleString()}</p></div>
          <div className="card p-4"><p className="text-xs text-muted-foreground">Facturas Emitidas</p><p className="text-2xl font-bold text-info mt-1">{filteredSales.length}</p></div>
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit flex-wrap">
          {[
            { id: 'sales' as Tab, label: 'Todas las Ventas', icon: <ShoppingCart size={16} /> },
            { id: 'quotes' as Tab, label: 'Cotizaciones', icon: <FileText size={16} /> },
            { id: 'returns' as Tab, label: 'Devoluciones', icon: <RotateCcw size={16} /> },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buscar</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="input-field pl-9" placeholder="Buscar por código, cliente o agente..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Desde (Fecha)</label>
              <input type="date" className="input-field" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hasta (Fecha)</label>
              <input type="date" className="input-field" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Mostrando {filteredSales.length} venta(s)</span>
            <div className="flex gap-2">
              <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-1.5 text-xs"><Download size={14} /> Exportar PDF</button>
              <button type="button" onClick={handleExportExcel} className="btn-secondary flex items-center gap-1.5 text-xs"><FileSpreadsheet size={14} /> Exportar Excel</button>
            </div>
          </div>
        </div>

        {tab === 'sales' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Factura</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha/Hora</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Usuario/Agente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Pago</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Subtotal</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">ITBIS</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Ganancia</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s, i) => (
                    <tr key={s.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-mono text-primary font-bold">{s.code}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{s.date} {s.time}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{s.agent}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{s.payment}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">RD$ {s.subtotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-warning font-semibold">RD$ {s.tax.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">RD$ {s.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-success hidden xl:table-cell">RD$ {s.profit.toLocaleString()}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className={saleStatusMap[s.status].cls}>{saleStatusMap[s.status].label}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewingSale(s)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Ver Detalle Factura"><Eye size={14} /></button>
                          <button onClick={() => window.print()} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Imprimir"><Printer size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'quotes' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Válida hasta</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockQuotes.map((q, i) => (
                    <tr key={q.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-mono text-primary font-medium">{q.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{q.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{q.date}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{q.validUntil}</td>
                      <td className="px-4 py-3 font-bold text-foreground">RD$ {q.total.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={saleStatusMap[q.status].cls}>{saleStatusMap[q.status].label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Eye size={14} /></button>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'returns' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Factura Ref.</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Motivo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReturns.map((r, i) => (
                    <tr key={r.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-3 font-mono text-danger font-medium">{r.code}</td>
                      <td className="px-4 py-3 font-mono text-primary">{r.saleCode}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.date}</td>
                      <td className="px-4 py-3 font-bold text-foreground">RD$ {r.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{r.reason}</td>
                      <td className="px-4 py-3"><span className={saleStatusMap[r.status].cls}>{saleStatusMap[r.status].label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Viewing Invoice Detail Modal with Transparent ITBIS Breakdown */}
        {viewingSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setViewingSale(null)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground text-lg">Detalle de Factura {viewingSale.code}</h3>
                <button type="button" onClick={() => setViewingSale(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-bold text-foreground">{viewingSale.customer}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fecha y Hora:</span><span>{viewingSale.date} {viewingSale.time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Usuario / Agente:</span><span>{viewingSale.agent}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Método de Pago:</span><span className="badge-neutral">{viewingSale.payment}</span></div>

                <div className="border-t border-border/80 pt-3 space-y-1.5">
                  <p className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Transparencia Fiscal y Costos</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono">RD$ {viewingSale.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Descuento:</span><span className="font-mono text-success">- RD$ {viewingSale.discount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground font-semibold">ITBIS (18% Transparentado):</span><span className="font-mono text-warning font-bold">RD$ {viewingSale.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold"><span>Total Factura:</span><span className="text-primary font-black">RD$ {viewingSale.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                </div>

                <div className="bg-secondary/40 rounded-xl p-3 space-y-1 mt-2">
                  <p className="font-bold text-muted-foreground text-[10px] uppercase">Rendimiento Financiero</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Costo de Productos:</span><span>RD$ {viewingSale.cost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between font-bold text-success"><span>Ganancia Bruta:</span><span>RD$ {viewingSale.profit.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-xs"><Printer size={14} /> Imprimir Factura</button>
                <button type="button" onClick={() => setViewingSale(null)} className="btn-primary text-xs">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
