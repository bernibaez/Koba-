import React, { useEffect, useState } from 'react';
import {
  getInvoiceSettings,
  subscribeInvoiceSettings,
  type InvoiceSettings,
  type PrintFormat,
} from '@/lib/invoiceSettingsStore';
import { getCompanyLogo } from '@/lib/companyLogo';

export interface InvoiceItem {
  sku?: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  itbis?: number;
}

export interface PrintableInvoiceProps {
  invoiceData: {
    invoiceNumber: string;
    isFiscal: boolean;
    ncf?: string | null;
    ncfType?: string | null;
    ncfTypeName?: string | null;
    expirationDate?: string | null;
    issueDate: string;
    issueTime?: string;
    cashier?: string;
    customerName?: string;
    customerRnc?: string;
    customerPhone?: string;
    customerAddress?: string;
    items: InvoiceItem[];
    subtotal: number;
    discount?: number;
    itbis: number;
    total: number;
    paymentMethod?: string;
    cashReceived?: number;
    change?: number;
  };
  settingsOverride?: Partial<InvoiceSettings>;
  formatOverride?: PrintFormat;
  className?: string;
}

export default function PrintableInvoice({
  invoiceData,
  settingsOverride,
  formatOverride,
  className = '',
}: PrintableInvoiceProps) {
  const [storeSettings, setStoreSettings] = useState<InvoiceSettings>(() => getInvoiceSettings());
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getCompanyLogo());

  useEffect(() => {
    return subscribeInvoiceSettings(() => {
      setStoreSettings(getInvoiceSettings());
      setLogoUrl(getCompanyLogo());
    });
  }, []);

  const settings: InvoiceSettings = {
    ...storeSettings,
    ...settingsOverride,
  };

  const activeFormat: PrintFormat = formatOverride ?? settings.printFormat;
  const isFiscal = invoiceData.isFiscal || Boolean(invoiceData.ncf);

  const fmt = (v: number) =>
    `RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const companyName = settings.companyName || 'SUPERMERCADO MERCATO S.R.L.';
  const companyRnc = settings.companyRnc || '131-45678-9';
  const companyPhone = settings.companyPhone || '(809) 555-0199';
  const companyEmail = settings.companyEmail || 'contacto@mercato.do';
  const companyAddress = settings.companyAddress || 'Av. 27 de Febrero #450, Santo Domingo, R.D.';

  // Map NCF Type label if available
  const getNcfLabel = () => {
    if (!invoiceData.ncfType) return 'Factura con Comprobante Fiscal';
    switch (invoiceData.ncfType) {
      case 'B01':
        return 'FACTURA DE CRÉDITO FISCAL (B01)';
      case 'B02':
        return 'FACTURA DE CONSUMO (B02)';
      case 'B14':
        return 'COMPROBANTE GUBERNAMENTAL (B14)';
      case 'B15':
        return 'COMPROBANTE REGISTRO ÚNICO (B15)';
      default:
        return `COMPROBANTE FISCAL (${invoiceData.ncfType})`;
    }
  };

  // Modern accent style inline border/text helper
  const accentBorderColor = settings.accentColor || '#1e40af';

  // -------------------------------------------------------------
  // RENDER 1: TICKET 80MM (SUPERMARKET POS THERMAL RECEIPT)
  // -------------------------------------------------------------
  if (activeFormat === 'ticket_80mm') {
    return (
      <div
        className={`printable-invoice-container bg-white text-slate-900 font-mono text-[11px] leading-tight p-4 max-w-[320px] mx-auto border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full ${className}`}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
          {settings.showLogo && logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-10 mx-auto object-contain mb-1" />
          )}
          <h2 className="font-bold text-sm uppercase tracking-wide">{companyName}</h2>
          <p className="text-[10px]">RNC: {companyRnc}</p>
          <p className="text-[10px]">{companyAddress}</p>
          <p className="text-[10px]">Tel: {companyPhone}</p>
        </div>

        {/* Invoice Title & NCF Info */}
        <div className="text-center py-2 border-b border-dashed border-slate-400 my-1 bg-slate-50 print:bg-transparent">
          <p className="font-extrabold text-xs uppercase">
            {isFiscal ? getNcfLabel() : 'COMPROBANTE DE VENTA'}
          </p>
          <p className="text-[10px] font-bold mt-0.5">No. {invoiceData.invoiceNumber}</p>
          {isFiscal && invoiceData.ncf && (
            <p className="text-xs font-black text-slate-900 mt-1 tracking-wider">
              NCF: {invoiceData.ncf}
            </p>
          )}
          {isFiscal && invoiceData.expirationDate && (
            <p className="text-[9px] text-slate-600 mt-0.5">
              Vencimiento NCF: {invoiceData.expirationDate}
            </p>
          )}
        </div>

        {/* Details: Date, Cashier, Customer */}
        <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{invoiceData.issueDate} {invoiceData.issueTime || ''}</span>
          </div>
          {settings.showCashier && invoiceData.cashier && (
            <div className="flex justify-between">
              <span>Cajero:</span>
              <span>{invoiceData.cashier}</span>
            </div>
          )}
          {invoiceData.customerName && (
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
              <span>Cliente:</span>
              <span className="truncate max-w-[170px]">{invoiceData.customerName}</span>
            </div>
          )}
          {(isFiscal || settings.showCustomerRncInNormal) && invoiceData.customerRnc && (
            <div className="flex justify-between">
              <span>RNC/Cédula:</span>
              <span>{invoiceData.customerRnc}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-slate-400">
          <div className="flex justify-between font-bold pb-1 border-b border-slate-300 text-[10px]">
            <span className="w-1/2">Descripción</span>
            <span className="w-1/6 text-center">Cant</span>
            <span className="w-1/3 text-right">Importe</span>
          </div>
          <div className="divide-y divide-slate-100 py-1">
            {invoiceData.items.map((item, idx) => (
              <div key={idx} className="py-1 space-y-0.5">
                <div className="font-semibold text-slate-900 leading-snug">{item.name}</div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>{item.qty} x {fmt(item.price)}</span>
                  <span className="font-bold text-slate-900">{fmt(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal Neto:</span>
            <span>{fmt(invoiceData.subtotal)}</span>
          </div>
          {Boolean(invoiceData.discount) && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Descuento:</span>
              <span>-{fmt(invoiceData.discount!)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-700">
            <span>ITBIS (18%):</span>
            <span>{fmt(invoiceData.itbis)}</span>
          </div>
          <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-800 text-slate-900">
            <span>TOTAL:</span>
            <span>{fmt(invoiceData.total)}</span>
          </div>
          {invoiceData.paymentMethod && (
            <div className="flex justify-between text-[10px] text-slate-600 pt-1">
              <span>Método Pago:</span>
              <span className="capitalize font-bold">{invoiceData.paymentMethod}</span>
            </div>
          )}
          {Boolean(invoiceData.cashReceived) && (
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Recibido:</span>
              <span>{fmt(invoiceData.cashReceived!)}</span>
            </div>
          )}
          {Boolean(invoiceData.change) && (
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Cambio:</span>
              <span>{fmt(invoiceData.change!)}</span>
            </div>
          )}
        </div>

        {/* Fiscal Legend & Custom Notes */}
        <div className="pt-3 text-center space-y-2 text-[9px] text-slate-600">
          {isFiscal && settings.showDgiiLegend && (
            <p className="font-semibold text-slate-800 leading-tight">
              {settings.dgiiNotice}
            </p>
          )}
          {settings.footerMessage && (
            <p className="font-medium text-slate-700 italic">{settings.footerMessage}</p>
          )}
          {settings.termsAndConditions && (
            <p className="text-[8px] text-slate-500">{settings.termsAndConditions}</p>
          )}
          <p className="text-[8px] pt-1 text-slate-400 border-t border-slate-200">
            Software de Gestión Mercato
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER 2: FULL PAGE (CARTA / A4 CORPORATE EXECUTIVES INVOICE)
  // -------------------------------------------------------------
  return (
    <div
      className={`printable-invoice-container bg-white text-slate-900 p-8 max-w-3xl mx-auto border border-slate-200 shadow-lg rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Banner Accent Line */}
      <div className="h-2 rounded-t-xl mb-6 print:hidden" style={{ backgroundColor: accentBorderColor }} />

      {/* Header Grid: Company Info (Left) + Invoice Title Badge (Right) */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          {settings.showLogo && logoUrl ? (
            <img src={logoUrl} alt="Logo Empresa" className="h-12 object-contain mb-2" />
          ) : null}
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{companyName}</h1>
          <p className="text-xs font-semibold text-slate-600">RNC: {companyRnc}</p>
          <p className="text-xs text-slate-600">{companyAddress}</p>
          <p className="text-xs text-slate-600">Tel: {companyPhone} | {companyEmail}</p>
        </div>

        <div className="text-right sm:text-right space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-auto">
          <div
            className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase text-white tracking-wider"
            style={{ backgroundColor: accentBorderColor }}
          >
            {isFiscal ? (invoiceData.ncfType ? getNcfLabel() : 'FACTURA FISCAL DGII') : 'COMPROBANTE DE VENTA'}
          </div>
          <p className="text-sm font-black text-slate-900">FACTURA N° {invoiceData.invoiceNumber}</p>
          {isFiscal && invoiceData.ncf && (
            <div className="pt-1 border-t border-slate-300">
              <p className="text-xs font-black text-indigo-900 tracking-wider">
                NCF: <span className="font-mono text-sm">{invoiceData.ncf}</span>
              </p>
              {invoiceData.expirationDate && (
                <p className="text-[10px] font-semibold text-slate-500">
                  Vencimiento NCF: {invoiceData.expirationDate}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Cards: Customer Details (Left) + Sale Details (Right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 text-xs">
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <p className="font-black text-slate-500 uppercase tracking-wider text-[10px]">
            DATOS DEL CLIENTE / RECEPTOR
          </p>
          <p className="text-sm font-bold text-slate-900">
            {invoiceData.customerName || 'Consumidor Final'}
          </p>
          {invoiceData.customerRnc && (
            <p className="font-semibold text-slate-700">RNC / Cédula: {invoiceData.customerRnc}</p>
          )}
          {invoiceData.customerPhone && <p className="text-slate-600">Tel: {invoiceData.customerPhone}</p>}
          {invoiceData.customerAddress && <p className="text-slate-600">{invoiceData.customerAddress}</p>}
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
          <p className="font-black text-slate-500 uppercase tracking-wider text-[10px]">
            DETALLES DE LA TRANSACCIÓN
          </p>
          <div className="flex justify-between">
            <span className="text-slate-600">Fecha de Emisión:</span>
            <span className="font-bold text-slate-800">{invoiceData.issueDate} {invoiceData.issueTime || ''}</span>
          </div>
          {settings.showCashier && invoiceData.cashier && (
            <div className="flex justify-between">
              <span className="text-slate-600">Atendido por:</span>
              <span className="font-semibold text-slate-800">{invoiceData.cashier}</span>
            </div>
          )}
          {invoiceData.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-slate-600">Forma de Pago:</span>
              <span className="font-bold text-slate-900 capitalize">{invoiceData.paymentMethod}</span>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Table */}
      <div className="my-2 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead
            className="text-white text-[11px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: accentBorderColor }}
          >
            <tr>
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3">Descripción del Producto</th>
              <th className="py-2.5 px-3 text-center">Cant.</th>
              <th className="py-2.5 px-3 text-right">Precio Unit.</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoiceData.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{item.sku || 'N/A'}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.qty}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">{fmt(item.price)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary & Signatures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 items-start">
        {/* Left Side: DGII Legal Legend & Terms */}
        <div className="space-y-3 text-xs">
          {isFiscal && settings.showDgiiLegend && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-950 dark:text-amber-200 text-[11px] font-medium leading-relaxed">
              <strong className="block font-bold mb-0.5">Nota Legal DGII:</strong>
              {settings.dgiiNotice}
            </div>
          )}
          {settings.footerMessage && (
            <p className="text-slate-700 font-semibold italic text-xs">{settings.footerMessage}</p>
          )}
          {settings.termsAndConditions && (
            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-200 pt-2">
              <strong className="block text-slate-700">Términos & Condiciones:</strong>
              {settings.termsAndConditions}
            </div>
          )}

          {/* Signature Lines if applicable */}
          {settings.showSignatureLine && (
            <div className="pt-8 grid grid-cols-2 gap-4 text-[10px] text-slate-500 text-center">
              <div>
                <div className="border-b border-slate-400 mb-1" />
                <span>Entregado por (Caja)</span>
              </div>
              <div>
                <div className="border-b border-slate-400 mb-1" />
                <span>Recibido Conforme (Cliente)</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Totals Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Neto:</span>
            <span className="font-mono font-semibold">{fmt(invoiceData.subtotal)}</span>
          </div>
          {Boolean(invoiceData.discount) && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Descuento Aplicado:</span>
              <span className="font-mono">-{fmt(invoiceData.discount!)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-200">
            <span>ITBIS (18%):</span>
            <span className="font-mono font-semibold">{fmt(invoiceData.itbis)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 pt-1">
            <span>TOTAL A PAGAR:</span>
            <span className="font-mono" style={{ color: accentBorderColor }}>
              {fmt(invoiceData.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
