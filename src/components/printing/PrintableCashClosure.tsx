import React from 'react';
import type { CashClosure } from '@/lib/cashClosureStore';
import { getInvoiceSettings } from '@/lib/invoiceSettingsStore';

interface PrintableCashClosureProps {
  closure: CashClosure;
}

export default function PrintableCashClosure({ closure }: PrintableCashClosureProps) {
  const settings = getInvoiceSettings();
  const companyName = settings.companyName || 'SUPERMERCADO MERCATO S.R.L.';
  const companyRnc = settings.companyRnc || '131-45678-9';
  const companyPhone = settings.companyPhone || '(809) 555-0199';
  const companyAddress = settings.companyAddress || 'Av. 27 de Febrero #450, Santo Domingo, R.D.';

  const fmt = (num: number = 0) =>
    `RD$ ${Number(num || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isExact = Math.abs(closure.difference) < 0.01;
  const isShortage = closure.difference < -0.01;
  const isSurplus = closure.difference > 0.01;

  return (
    <div className="printable-document bg-white text-slate-900 font-sans p-8 max-w-3xl mx-auto border border-slate-300 print:border-none print:p-0 print:max-w-none text-xs leading-relaxed">
      {/* Header Empresarial */}
      <div className="text-center pb-4 border-b-2 border-slate-900">
        <h1 className="text-xl font-black uppercase tracking-wide text-slate-900 mb-1">{companyName}</h1>
        <p className="text-[11px] text-slate-700 font-medium">RNC: {companyRnc} · Tel: {companyPhone}</p>
        <p className="text-[11px] text-slate-600">{companyAddress}</p>
        <div className="inline-block mt-3 px-4 py-1 bg-slate-900 text-white font-black text-sm uppercase tracking-wider rounded">
          Comprobante de Cierre de Caja / Arqueo de Turno
        </div>
      </div>

      {/* Metadatos del Turno */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-[11px]">
        <div className="space-y-1">
          <p><span className="font-bold text-slate-700">Comprobante No.:</span> <span className="font-mono font-bold text-slate-900">{closure.code}</span></p>
          <p><span className="font-bold text-slate-700">Caja Registradora:</span> <span className="font-semibold text-slate-900">{closure.cashRegisterLabel || `Caja #${closure.cashRegisterId}`}</span></p>
          <p><span className="font-bold text-slate-700">Cajero(a):</span> <span className="font-semibold text-slate-900">{closure.userName} (@{closure.username || 'usuario'})</span></p>
        </div>
        <div className="space-y-1 text-right">
          <p><span className="font-bold text-slate-700">Fecha de Operación:</span> <span className="font-semibold text-slate-900">{closure.date}</span></p>
          <p><span className="font-bold text-slate-700">Hora Apertura:</span> <span className="font-semibold text-slate-900">{closure.openedAt}</span></p>
          <p><span className="font-bold text-slate-700">Hora Cierre:</span> <span className="font-semibold text-slate-900">{closure.closedAt}</span></p>
        </div>
      </div>

      {/* Desglose de Ventas por Método de Pago */}
      <div className="py-4 border-b border-slate-300">
        <h2 className="font-black text-slate-800 uppercase tracking-wide mb-2 text-xs border-b border-slate-200 pb-1">
          1. Resumen de Ventas por Medio de Pago
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-700 font-bold text-[11px]">
              <th className="py-1.5">Método de Pago</th>
              <th className="py-1.5 text-center">Transacciones</th>
              <th className="py-1.5 text-right">Monto Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            <tr>
              <td className="py-1.5 font-medium">Efectivo en Caja</td>
              <td className="py-1.5 text-center text-slate-600">-</td>
              <td className="py-1.5 text-right font-mono font-semibold">{fmt(closure.totalCash)}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-medium">Tarjetas de Débito / Crédito</td>
              <td className="py-1.5 text-center text-slate-600">{closure.cardCount || 0}</td>
              <td className="py-1.5 text-right font-mono font-semibold">{fmt(closure.totalCard)}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-medium">Transferencias Bancarias</td>
              <td className="py-1.5 text-center text-slate-600">{closure.transferCount || 0}</td>
              <td className="py-1.5 text-right font-mono font-semibold">{fmt(closure.totalTransfer)}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-medium">Ventas a Crédito (CxC)</td>
              <td className="py-1.5 text-center text-slate-600">{closure.creditCount || 0}</td>
              <td className="py-1.5 text-right font-mono font-semibold">{fmt(closure.totalCredit)}</td>
            </tr>
            {Boolean(closure.totalCheque) && (
              <tr>
                <td className="py-1.5 font-medium">Cheques Recibidos</td>
                <td className="py-1.5 text-center text-slate-600">{closure.chequeCount || 0}</td>
                <td className="py-1.5 text-right font-mono font-semibold">{fmt(closure.totalCheque)}</td>
              </tr>
            )}
            <tr className="font-bold border-t-2 border-slate-900 bg-slate-50">
              <td className="py-2 text-slate-900 uppercase">Total Ventas Facturadas</td>
              <td className="py-2 text-center">-</td>
              <td className="py-2 text-right font-mono text-sm text-slate-900">{fmt(closure.totalSales)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Arqueo y Conciliación de Efectivo */}
      <div className="py-4 border-b border-slate-300">
        <h2 className="font-black text-slate-800 uppercase tracking-wide mb-2 text-xs border-b border-slate-200 pb-1">
          2. Conciliación y Arqueo de Efectivo Físico
        </h2>
        <div className="bg-slate-50 border border-slate-300 rounded p-3 space-y-2 text-[11px]">
          {Boolean(closure.baseCash) && (
            <div className="flex justify-between">
              <span className="text-slate-700">Fondo Inicial de Caja (Apertura):</span>
              <span className="font-mono font-semibold">{fmt(closure.baseCash)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-700">(+) Efectivo Cobrado en Ventas:</span>
            <span className="font-mono font-semibold">{fmt(closure.totalCash)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
            <span className="text-slate-900">(=) Efectivo Teórico Esperado en Caja:</span>
            <span className="font-mono text-slate-900">{fmt(closure.expectedCash)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-300 font-bold">
            <span className="text-slate-900">(=) Efectivo Físico Declarado (Contado):</span>
            <span className="font-mono text-slate-900">{fmt(closure.countedCash)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 text-xs font-black">
            <span className="uppercase">
              Diferencia de Cuadre:
              {isExact && <span className="ml-2 text-slate-700 font-bold">[CUADRE EXACTO]</span>}
              {isShortage && <span className="ml-2 text-slate-900 font-bold">[FALTANTE EN CAJA]</span>}
              {isSurplus && <span className="ml-2 text-slate-900 font-bold">[SOBRANTE EN CAJA]</span>}
            </span>
            <span className="font-mono text-sm">
              {closure.difference >= 0 ? `+${fmt(closure.difference)}` : `-${fmt(Math.abs(closure.difference))}`}
            </span>
          </div>
        </div>
      </div>

      {/* Notas / Observaciones */}
      {closure.notes && (
        <div className="py-3 border-b border-slate-300 text-[11px]">
          <span className="font-bold text-slate-800">Observaciones del turno: </span>
          <span className="text-slate-700 italic">{closure.notes}</span>
        </div>
      )}

      {/* Firmas de Responsabilidad */}
      <div className="pt-12 grid grid-cols-2 gap-12 text-center text-[10px]">
        <div>
          <div className="border-b border-slate-400 mb-1.5 pb-8" />
          <p className="font-bold uppercase text-slate-900">{closure.userName}</p>
          <p className="text-slate-600">Cajero(a) Responsable</p>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1.5 pb-8" />
          <p className="font-bold uppercase text-slate-900">Auditoría / Supervisor</p>
          <p className="text-slate-600">Revisado y Conforme</p>
        </div>
      </div>

      {/* Pie de Página */}
      <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-500">
        Documento generado el {new Date().toLocaleString('es-DO')} · Sistema de Punto de Venta MERCATO
      </div>
    </div>
  );
}
