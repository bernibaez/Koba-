import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Download, RotateCcw, Plus, FileSpreadsheet, Eye, Printer, X } from 'lucide-react';
import { getPosReturns, type PosReturn } from '@/lib/posStore';
import { exportTableToPdf, exportTableToExcel, formatMoneyPdf } from '@/lib/exportPdf';
import PosReturnModal from './point-of-sale-pos/components/PosReturnModal';

const methodLabel: Record<PosReturn['method'], string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit_note: 'Nota de crédito',
  exchange: 'Cambio',
};

const typeLabel: Record<PosReturn['type'], string> = {
  partial: 'Parcial',
  full: 'Total',
};

export default function ReturnsHistoryPage() {
  const [returns, setReturns] = useState<PosReturn[]>(() => getPosReturns());
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<PosReturn | null>(null);

  // Filters
  const [date, setDate] = useState('');
  const [user, setUser] = useState('');
  const [customer, setCustomer] = useState('');
  const [cashier, setCashier] = useState('');
  const [product, setProduct] = useState('');

  const refreshReturns = () => setReturns(getPosReturns());

  const filtered = useMemo(() => {
    const q = product.toLowerCase().trim();
    return returns.filter((r) => {
      if (date && r.date !== date) return false;
      if (user && !r.user.toLowerCase().includes(user.toLowerCase())) return false;
      if (customer && !r.customer.toLowerCase().includes(customer.toLowerCase())) return false;
      if (cashier && !r.cashier.toLowerCase().includes(cashier.toLowerCase())) return false;
      if (q) {
        const matchProduct = r.products.some(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
        if (!matchProduct) return false;
      }
      return true;
    });
  }, [returns, date, user, customer, cashier, product]);

  const totalAmount = filtered.reduce((s, r) => s + r.total, 0);

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Historial de Devoluciones de Mercancía',
      filename: 'historial-devoluciones',
      headers: [
        'Código', 'Venta Ref.', 'Cliente', 'Fecha', 'Hora', 'Usuario', 'Productos', 'Total', 'Motivo', 'Método', 'Tipo',
      ],
      rows: filtered.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        r.time,
        r.user,
        r.products.map((p) => `${p.name} x${p.qty}`).join(', '),
        formatMoneyPdf(r.total),
        r.reason,
        methodLabel[r.method],
        typeLabel[r.type],
      ]),
      landscape: true,
    });
  };

  const handleExportExcel = () => {
    exportTableToExcel({
      title: 'Historial de Devoluciones de Mercancía',
      filename: 'historial-devoluciones',
      headers: [
        'Código', 'Factura Original', 'Cliente', 'Fecha', 'Hora', 'Usuario', 'Cajero', 'Productos Devueltos', 'Total Reembolso', 'Motivo', 'Método Reembolso', 'Tipo Devolución'
      ],
      rows: filtered.map((r) => [
        r.code,
        r.saleCode,
        r.customer,
        r.date,
        r.time,
        r.user,
        r.cashier,
        r.products.map((p) => `${p.name} (Cant: ${p.qty})`).join('; '),
        r.total,
        r.reason,
        methodLabel[r.method],
        typeLabel[r.type],
      ]),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <RotateCcw className="text-danger" size={24} />
              Historial de Devoluciones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Consulta y registra devoluciones parciales o totales de mercancía</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowReturnModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Nueva Devolución
            </button>
            <button type="button" onClick={handleExportPdf} className="btn-secondary flex items-center gap-1.5">
              <Download size={16} /> PDF
            </button>
            <button type="button" onClick={handleExportExcel} className="btn-secondary flex items-center gap-1.5">
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Devoluciones Filtradas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Monto Total Reembolsado</p>
            <p className="text-2xl font-bold text-danger mt-1">
              RD$ {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted-foreground">Total Histórico</p>
            <p className="text-2xl font-bold text-info mt-1">{returns.length} registros</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Usuario</label>
              <input className="input-field" placeholder="Usuario..." value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
              <input className="input-field" placeholder="Cliente..." value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cajero</label>
              <input className="input-field" placeholder="Cajero..." value={cashier} onChange={(e) => setCashier(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Producto</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input-field pl-9"
                  placeholder="Buscar producto..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Factura Ref.</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Fecha/Hora</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Productos</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <RotateCcw size={28} className="mx-auto mb-2 opacity-40" />
                      No hay devoluciones registradas con estos filtros
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3 font-mono text-danger font-bold">{r.code}</td>
                      <td className="px-4 py-3 font-mono text-primary font-semibold">{r.saleCode}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {r.date} {r.time}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">{r.user}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell max-w-[200px] truncate text-xs">
                        {r.products.map((p) => `${p.name} x${p.qty}`).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        RD$ {r.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span className={r.type === 'full' ? 'badge-warning' : 'badge-success'}>
                          {typeLabel[r.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReturn(r)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Ver comprobante de devolución"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Return */}
        {showReturnModal && (
          <PosReturnModal
            onClose={() => {
              setShowReturnModal(false);
              refreshReturns();
            }}
          />
        )}

        {/* Modal: Viewing Detail / Receipt */}
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={() => setSelectedReturn(null)}>
            <div className="card w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground text-lg">Comprobante Devolución {selectedReturn.code}</h3>
                <button type="button" onClick={() => setSelectedReturn(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Factura Ref:</span><span className="font-bold text-primary">{selectedReturn.saleCode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-semibold">{selectedReturn.customer}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fecha/Hora:</span><span>{selectedReturn.date} {selectedReturn.time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Usuario:</span><span>{selectedReturn.user}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Motivo:</span><span>{selectedReturn.reason}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Método:</span><span className="badge-info">{methodLabel[selectedReturn.method]}</span></div>
                
                <div className="pt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Productos Devueltos</p>
                  <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5 text-xs">
                    {selectedReturn.products.map((p, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{p.name} (x{p.qty})</span>
                        <span className="font-semibold">RD$ {(p.qty * p.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                  <span>Total Reembolsado:</span>
                  <span className="text-danger">RD$ {selectedReturn.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Printer size={14} /> Imprimir Comprobante
                </button>
                <button type="button" onClick={() => setSelectedReturn(null)} className="btn-primary text-xs">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
