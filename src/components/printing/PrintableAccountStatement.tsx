import React from 'react';
import { getInvoiceSettings } from '@/lib/invoiceSettingsStore';

export interface StatementPayment {
  date: string;
  amount: number;
  method?: string;
  note?: string;
}

interface PrintableAccountStatementProps {
  type: 'receivable' | 'payable';
  code: string;
  name: string;
  phone?: string;
  invoiceCode?: string;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  dueDate?: string;
  payments: StatementPayment[];
}

export default function PrintableAccountStatement({
  type,
  code,
  name,
  phone,
  invoiceCode,
  totalAmount,
  paidAmount,
  pendingBalance,
  dueDate,
  payments,
}: PrintableAccountStatementProps) {
  const settings = getInvoiceSettings();
  const companyName = settings.companyName || 'SUPERMERCADO MERCATO S.R.L.';
  const companyRnc = settings.companyRnc || '131-45678-9';
  const companyPhone = settings.companyPhone || '(809) 555-0199';
  const companyAddress = settings.companyAddress || 'Av. 27 de Febrero #450, Santo Domingo, R.D.';

  const isReceivable = type === 'receivable';
  const title = isReceivable
    ? 'ESTADO DE CUENTA POR COBRAR (CxC)'
    : 'ESTADO DE CUENTA POR PAGAR (CxP)';
  const partyLabel = isReceivable ? 'Cliente:' : 'Proveedor:';

  const fmt = (num: number = 0) =>
    `RD$ ${Number(num || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="printable-document bg-white text-slate-900 font-sans p-8 max-w-2xl mx-auto border border-slate-300 print:border-none print:p-0 print:max-w-none text-xs leading-relaxed">
      {/* Encabezado */}
      <div className="text-center pb-4 border-b-2 border-slate-900">
        <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 mb-0.5">{companyName}</h1>
        <p className="text-[11px] text-slate-700 font-medium">RNC: {companyRnc} · Tel: {companyPhone}</p>
        <p className="text-[11px] text-slate-600">{companyAddress}</p>
        <div className="inline-block mt-3 px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
          {title}
        </div>
      </div>

      {/* Info General */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-[11px]">
        <div className="space-y-1">
          <p><span className="font-bold text-slate-700">No. Documento:</span> <span className="font-mono font-bold text-slate-900">{code}</span></p>
          <p><span className="font-bold text-slate-700">{partyLabel}</span> <span className="font-semibold text-slate-900">{name}</span></p>
          {phone && (
            <p><span className="font-bold text-slate-700">Teléfono:</span> <span className="text-slate-800">{phone}</span></p>
          )}
        </div>
        <div className="space-y-1 text-right">
          {invoiceCode && (
            <p><span className="font-bold text-slate-700">Factura de Referencia:</span> <span className="font-mono font-semibold text-slate-900">{invoiceCode}</span></p>
          )}
          {dueDate && (
            <p><span className="font-bold text-slate-700">Fecha de Vencimiento:</span> <span className="font-semibold text-slate-900">{dueDate}</span></p>
          )}
          <p><span className="font-bold text-slate-700">Fecha de Emisión:</span> <span className="text-slate-800">{new Date().toLocaleDateString('es-DO')}</span></p>
        </div>
      </div>

      {/* Resumen de Saldo */}
      <div className="py-4 border-b border-slate-300">
        <h2 className="font-bold text-slate-800 uppercase text-[11px] mb-2">Resumen Financiero del Saldo</h2>
        <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-300 rounded p-3 text-center">
          <div>
            <p className="text-[10px] text-slate-600 font-bold uppercase">Monto Total Original</p>
            <p className="text-sm font-black font-mono text-slate-900 mt-0.5">{fmt(totalAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-emerald-700 font-bold uppercase">Monto Abonado / Pagado</p>
            <p className="text-sm font-black font-mono text-emerald-800 mt-0.5">{fmt(paidAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-900 font-black uppercase">Saldo Pendiente</p>
            <p className="text-sm font-black font-mono text-slate-950 mt-0.5">{fmt(pendingBalance)}</p>
          </div>
        </div>
      </div>

      {/* Historial de Pagos / Abonos */}
      <div className="py-3 border-b border-slate-300">
        <h2 className="font-bold text-slate-800 uppercase text-[11px] mb-2">Historial de Pagos y Abonos Registrados</h2>
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-300 text-slate-700 font-bold">
              <th className="py-1">Fecha</th>
              <th className="py-1">Método</th>
              <th className="py-1">Nota / Referencia</th>
              <th className="py-1 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments && payments.length > 0 ? (
              payments.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 font-medium">{p.date}</td>
                  <td className="py-1.5">{p.method || 'Efectivo'}</td>
                  <td className="py-1.5 text-slate-600 italic">{p.note || '-'}</td>
                  <td className="py-1.5 text-right font-mono font-semibold">{fmt(p.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-slate-500 italic">
                  No se han registrado abonos previos a esta cuenta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Firmas */}
      <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px]">
        <div>
          <div className="border-b border-slate-400 mb-1 pb-6" />
          <p className="font-bold uppercase text-slate-900">Elaborado por (Caja / Contabilidad)</p>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1 pb-6" />
          <p className="font-bold uppercase text-slate-900">Recibido Conforme ({isReceivable ? 'Cliente' : 'Proveedor'})</p>
        </div>
      </div>

      <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
        MERCATO ERP · Estado de Cuenta Oficial · {new Date().toLocaleString('es-DO')}
      </div>
    </div>
  );
}
