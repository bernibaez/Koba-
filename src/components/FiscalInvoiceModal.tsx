import React, { useRef, useState } from 'react';
import {
  X, Printer, Download, FileText, CheckCircle2, Building2, Copy, Check,
  Receipt, ShieldCheck, Calendar, User, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import type { FiscalInvoiceRecord } from '@/lib/ncfStore';
import { NCF_TYPES } from '@/lib/ncfStore';

interface FiscalInvoiceModalProps {
  invoice: FiscalInvoiceRecord;
  onClose: () => void;
}

export default function FiscalInvoiceModal({ invoice, onClose }: FiscalInvoiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedNcf, setCopiedNcf] = useState(false);
  const [viewFormat, setViewFormat] = useState<'ticket' | 'a4'>('a4');

  const ncfInfo = NCF_TYPES[invoice.ncfType];

  const handleCopyNcf = () => {
    navigator.clipboard.writeText(invoice.ncf);
    setCopiedNcf(true);
    toast.success(`NCF ${invoice.ncf} copiado al portapapeles`);
    setTimeout(() => setCopiedNcf(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: `FACTURA FISCAL DGII - NCF ${invoice.ncf}`,
      subtitle: `Emisor: SUPERMERCADO REMANENTE S.R.L. (RNC: 131-45678-9) | Cliente: ${invoice.companyName || 'Consumidor Final'} (${invoice.rncClient || 'N/A'})`,
      filename: `factura-fiscal-${invoice.ncf}`,
      headers: ['#', 'SKU', 'Descripción', 'Cant.', 'Precio Unit.', 'ITBIS (18%)', 'Subtotal'],
      rows: invoice.items.map((item, idx) => [
        idx + 1,
        item.sku,
        item.name,
        item.qty,
        formatMoneyPdf(item.price),
        formatMoneyPdf(item.itbis),
        formatMoneyPdf(item.subtotal),
      ]),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full text-slate-800 dark:text-slate-200"
      >
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Factura Fiscal Emitida
                </h2>
                <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  NCF: {invoice.ncf}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNcf}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Copiar NCF"
                >
                  {copiedNcf ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Comprobante de autorización tributaria emitido según normas DGII
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* View Format Switcher */}
            <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewFormat('a4')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewFormat === 'a4'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={14} />
                <span>Hoja A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewFormat('ticket')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewFormat === 'ticket'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Receipt size={14} />
                <span>Ticket 80mm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / Invoice Display */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-4 print:text-black">
          {viewFormat === 'ticket' ? (
            /* Ticket 80mm Thermal Print Format */
            <div className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-4 print:bg-white print:border-none print:shadow-none">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">SUPERMERCADO REMANENTE</h3>
                <p className="text-[11px] text-slate-500">RNC: 131-45678-9</p>
                <p className="text-[10px] text-slate-500">Av. Winston Churchill #102</p>
                <p className="text-[10px] text-slate-500">Santo Domingo, Rep. Dom.</p>
              </div>

              <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">{ncfInfo.name}</p>
                <p className="font-black text-indigo-600 dark:text-indigo-400 text-xs">NCF: {invoice.ncf}</p>
                <p className="text-slate-500">Vencimiento: {invoice.expirationDate}</p>
                <p className="text-slate-500">Fecha: {invoice.issueDate} {invoice.issueTime}</p>
              </div>

              <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 font-bold uppercase text-[10px]">CLIENTE:</p>
                <p className="font-bold text-slate-900 dark:text-white">{invoice.companyName || 'CONSUMIDOR FINAL'}</p>
                <p className="text-slate-600">RNC/Cédula: {invoice.rncClient || 'N/A'}</p>
              </div>

              <div className="space-y-2 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.qty} x RD$ {item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-bold tabular-nums">RD$ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pt-1 font-bold text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Neto:</span>
                  <span>RD$ {invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ITBIS (18%):</span>
                  <span>RD$ {invoice.itbis.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-1 border-t border-slate-300 dark:border-slate-700">
                  <span>TOTAL FISCAL:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">RD$ {invoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-400 space-y-0.5">
                <p>Comprobante Emitido según Normas DGII</p>
                <p>¡Gracias por su compra!</p>
              </div>
            </div>
          ) : (
            /* Documento A4 Official DGII Format */
            <div className="space-y-6">
              {/* Header Company & Fiscal Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                {/* Left: Emisor Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <Building2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                        SUPERMERCADO REMANENTE S.R.L.
                      </h3>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        RNC Emisor: 131-45678-9
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5 pl-1">
                    <p>Av. Winston Churchill #102, Polígono Central, Santo Domingo</p>
                    <p>Teléfono: (809) 555-0199 · Email: facturacion@marketerp.do</p>
                  </div>
                </div>

                {/* Right: Official NCF Card */}
                <div className="bg-gradient-to-br from-indigo-500/10 via-slate-50 to-indigo-50/30 dark:from-indigo-950/40 dark:to-slate-800/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {ncfInfo.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={11} /> DGII Válido
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500 font-bold uppercase">NCF:</span>
                    <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {invoice.ncf}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-indigo-100/80 dark:border-indigo-900/40 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">VENCIMIENTO NCF</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.expirationDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">FECHA EMISIÓN</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.issueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client / Receptor Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    RAZÓN SOCIAL / CLIENTE COMPRADOR
                  </span>
                  <span className="font-black text-sm text-slate-900 dark:text-white block">
                    {invoice.companyName || 'CONSUMIDOR FINAL'}
                  </span>
                  <span className="text-slate-500 text-[11px]">Tipo de Venta: {invoice.paymentMethod}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    RNC / CÉDULA DEL COMPRADOR
                  </span>
                  <span className="font-black text-sm font-mono text-slate-900 dark:text-white block">
                    {invoice.rncClient || 'N/A (Consumidor Final)'}
                  </span>
                  <span className="text-slate-500 text-[11px]">Cajero: {invoice.cashier}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Descripción del Producto</th>
                      <th className="py-3 px-4 text-right">Cant.</th>
                      <th className="py-3 px-4 text-right">Precio Unit.</th>
                      <th className="py-3 px-4 text-right">ITBIS (18%)</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-400 font-semibold">{idx + 1}.</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{item.qty}</td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          RD$ {item.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                          RD$ {item.itbis.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          RD$ {item.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Fiscal Totals & Legal Disclaimer */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="text-xs text-slate-400 space-y-1.5 max-w-md bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider block">
                    DECLARACIÓN LEGAL Y REGLAMENTACIÓN DGII:
                  </span>
                  <p className="leading-relaxed">
                    Comprobante fiscal válido para sustentar costos y gastos de conformidad con la Ley 11-92 y Norma General 06-2018 de la DGII.
                  </p>
                  <p className="pt-1 text-[11px] text-slate-500 font-semibold">
                    Documento generado electrónicamente en MarketERP.
                  </p>
                </div>

                <div className="w-full sm:w-80 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 font-mono text-xs sm:text-sm shadow-2xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Subtotal Neto (sin ITBIS):</span>
                    <span>RD$ {invoice.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>ITBIS Facturado (18%):</span>
                    <span>RD$ {invoice.itbis.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-black text-lg pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span>TOTAL FACTURA:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      RD$ {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 border border-slate-900 dark:border-white"
            >
              <Printer size={16} />
              <span>Imprimir Recibo</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Download size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
