import React from 'react';
import { getInvoiceSettings } from '@/lib/invoiceSettingsStore';

export interface ReturnItemInfo {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PrintableReturnData {
  code: string;
  originalInvoiceCode?: string;
  date: string;
  customerName?: string;
  cashierName?: string;
  reason?: string;
  items?: ReturnItemInfo[];
  totalAmount: number;
  refundMethod?: string;
}

interface PrintableReturnReceiptProps {
  data: PrintableReturnData;
}

export default function PrintableReturnReceipt({ data }: PrintableReturnReceiptProps) {
  const settings = getInvoiceSettings();
  const companyName = settings.companyName || 'SUPERMERCADO MERCATO S.R.L.';
  const companyRnc = settings.companyRnc || '131-45678-9';
  const companyPhone = settings.companyPhone || '(809) 555-0199';
  const companyAddress = settings.companyAddress || 'Av. 27 de Febrero #450, Santo Domingo, R.D.';

  const fmt = (num: number = 0) =>
    `RD$ ${Number(num || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="printable-document bg-white text-slate-900 font-sans p-8 max-w-2xl mx-auto border border-slate-300 print:border-none print:p-0 print:max-w-none text-xs leading-relaxed">
      {/* Header */}
      <div className="text-center pb-4 border-b-2 border-slate-900">
        <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 mb-0.5">{companyName}</h1>
        <p className="text-[11px] text-slate-700 font-medium">RNC: {companyRnc} · Tel: {companyPhone}</p>
        <p className="text-[11px] text-slate-600">{companyAddress}</p>
        <div className="inline-block mt-3 px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
          Comprobante de Devolución de Mercancía
        </div>
      </div>

      {/* Info General */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-[11px]">
        <div className="space-y-1">
          <p><span className="font-bold text-slate-700">No. Devolución:</span> <span className="font-mono font-bold text-slate-900">{data.code}</span></p>
          {data.originalInvoiceCode && (
            <p><span className="font-bold text-slate-700">Factura Original:</span> <span className="font-mono font-semibold text-slate-900">{data.originalInvoiceCode}</span></p>
          )}
          <p><span className="font-bold text-slate-700">Cliente:</span> <span className="font-semibold text-slate-900">{data.customerName || 'Consumidor Final'}</span></p>
        </div>
        <div className="space-y-1 text-right">
          <p><span className="font-bold text-slate-700">Fecha:</span> <span className="font-semibold text-slate-900">{data.date}</span></p>
          <p><span className="font-bold text-slate-700">Atendido por:</span> <span className="font-semibold text-slate-900">{data.cashierName || 'Cajero'}</span></p>
          {data.refundMethod && (
            <p><span className="font-bold text-slate-700">Método de Reembolso:</span> <span className="font-semibold text-slate-900">{data.refundMethod}</span></p>
          )}
        </div>
      </div>

      {/* Motivo */}
      {data.reason && (
        <div className="py-2.5 border-b border-slate-300 text-[11px]">
          <span className="font-bold text-slate-700">Motivo de Devolución: </span>
          <span className="italic text-slate-800">{data.reason}</span>
        </div>
      )}

      {/* Items devueltos */}
      <div className="py-3 border-b border-slate-300">
        <h2 className="font-bold text-slate-800 uppercase text-[11px] mb-2">Detalle de Artículos Devueltos</h2>
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-300 text-slate-700 font-bold">
              <th className="py-1">Artículo</th>
              <th className="py-1 text-center">Cant.</th>
              <th className="py-1 text-right">Precio</th>
              <th className="py-1 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.items && data.items.length > 0 ? (
              data.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 font-medium text-slate-800">{it.name}</td>
                  <td className="py-1.5 text-center font-mono">{it.qty}</td>
                  <td className="py-1.5 text-right font-mono">{fmt(it.price)}</td>
                  <td className="py-1.5 text-right font-mono font-semibold">{fmt(it.subtotal)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-slate-600 italic">
                  Devolución registrada por valor global
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total Card */}
      <div className="py-3 flex justify-end">
        <div className="w-64 bg-slate-50 border border-slate-300 rounded p-2.5 text-[11px] space-y-1">
          <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
            <span>TOTAL REEMBOLSADO:</span>
            <span className="font-mono">{fmt(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Firmas */}
      <div className="pt-10 grid grid-cols-2 gap-8 text-center text-[10px]">
        <div>
          <div className="border-b border-slate-400 mb-1 pb-6" />
          <p className="font-bold uppercase text-slate-900">Firma del Cliente</p>
          <p className="text-slate-500">Conforme con la Devolución</p>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1 pb-6" />
          <p className="font-bold uppercase text-slate-900">Firma del Cajero / Supervisor</p>
          <p className="text-slate-500">Autorizado y Procesado</p>
        </div>
      </div>

      <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
        Emitido por Sistema POS MERCATO · {new Date().toLocaleString('es-DO')}
      </div>
    </div>
  );
}
