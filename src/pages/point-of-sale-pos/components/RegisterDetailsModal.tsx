import React, { useRef } from 'react';
import { X, Printer, Download, Briefcase, FileText } from 'lucide-react';
import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';
import { useAuth } from '@/context/AuthContext';

interface RegisterDetailsModalProps {
  onClose: () => void;
  dateRangeStr?: string;
  userName?: string;
  userEmail?: string;
  locationName?: string;
}

export default function RegisterDetailsModal({
  onClose,
  dateRangeStr = '27th Jul, 2026 10:17 AM - 29th Jul, 2026 02:00 PM',
  userName,
  userEmail,
  locationName = 'SUPERMERCADO REMANENTE',
}: RegisterDetailsModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const displayUser = userName || user?.name || 'Sra. Alba Iris Martinez Baez';
  const displayEmail = userEmail || user?.email || 'uu@gmail.com';

  const paymentMethods = [
    { name: 'Dinero en efectivo:', sales: 'RD$ 0.00', expenses: '--' },
    { name: 'Pago en efectivo:', sales: 'RD$ 132,660.16', expenses: 'RD$ 0.00' },
    { name: 'Verificar pago:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago con tarjeta:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Trans. bancaria:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago anticipado:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 1:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 2:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 3:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 4:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 5:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 6:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Pago personalizado 7:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
    { name: 'Otros pagos:', sales: 'RD$ 0.00', expenses: 'RD$ 0.00' },
  ];

  const totalsSummary = [
    { label: 'Ventas totales:', value: 'RD$ 132,660.16' },
    { label: 'Reembolso total', value: 'RD$ 0.00' },
    { label: 'Pago total', value: 'RD$ 132,660.16' },
    { label: 'Ventas a crédito:', value: 'RD$ 0.00' },
    { label: 'Ventas totales:', value: 'RD$ 132,660.16' },
    { label: 'Gasto total:', value: 'RD$ 0.00' },
  ];

  const productsSold = [
    { sku: '0068', name: 'FUNDA PLASTICA #12', qty: 40.00, total: 1600.00 },
    { sku: '7462381390874', name: 'Aceite El Gallo Yumbo', qty: 10.00, total: 10750.00 },
    { sku: '7468612640060', name: 'Aceite La Joya Yumbo', qty: 20.00, total: 22000.00 },
    { sku: '0225', name: 'HARINA DON QUIJOTE SAQUITO', qty: 25.00, total: 11500.00 },
    { sku: '7460193700119', name: 'Aceite Crisol Medio Galón', qty: 1.00, total: 320.00 },
    { sku: '7619592698644', name: 'VINAGRE IDOM DORADO GALON', qty: 8.00, total: 720.00 },
    { sku: '7460193703301', name: 'Aceite Crisol 8oz', qty: 1.00, total: 50.00 },
    { sku: '56', name: 'HARINA OZAMA 20 LB', qty: 5.00, total: 2500.00 },
    { sku: '25', name: 'CEBOLLA', qty: 24.98, total: 1249.00 },
    { sku: '34', name: 'Ajo', qty: 41.16, total: 5351.32 },
    { sku: '0873', name: 'FARDO DE AGUA CRYSTAL 0.5L', qty: 5.00, total: 750.00 },
    { sku: '1823', name: 'TIRA DE BANDEJA DE PICA POLLO GRD', qty: 38.00, total: 26600.00 },
    { sku: '1824', name: 'FARDO DE BANDEJA DE PICA POLLO PQ', qty: 5.00, total: 9900.00 },
    { sku: '7468612640152', name: 'Aceite Sol De Oro Yumbo', qty: 30.00, total: 32750.00 },
    { sku: '4527', name: 'SACO DE ACE', qty: 1.00, total: 1320.00 },
    { sku: '7468355587578', name: 'servilleta GreenNap 400', qty: 50.00, total: 2750.00 },
    { sku: '18247', name: 'Funda De Aza #51', qty: 30.00, total: 2550.00 },
  ];

  const brandSummary = [
    { brand: '', qty: 335.14, total: 132660.32 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      title: 'Registrar detalles de caja',
      subtitle: `${dateRangeStr} | ${locationName} | ${displayUser}`,
      filename: `registrar-detalles-${Date.now()}`,
      headers: ['#', 'SKU / CODIGO', 'Producto', 'Cantidad', 'Cantidad total'],
      rows: productsSold.map((p, idx) => [
        idx + 1,
        p.sku,
        p.name,
        p.qty.toFixed(2),
        formatMoneyPdf(p.total),
      ]),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Registrar detalles <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">({dateRangeStr})</span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Printable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm print:p-4 print:text-black">
          {/* Printable Header for print view */}
          <div className="hidden print:block mb-4 border-b pb-4">
            <h1 className="text-xl font-bold text-slate-900">Registrar detalles</h1>
            <p className="text-xs text-slate-600">({dateRangeStr})</p>
          </div>

          {/* Section 1: Table of Payment Methods & Expenses */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-4">Método de pago</th>
                  <th className="py-2.5 px-4 text-right">Ventas</th>
                  <th className="py-2.5 px-4 text-right">Gastos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paymentMethods.map((pm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-4 font-semibold text-slate-700 dark:text-slate-300">{pm.name}</td>
                    <td className="py-2 px-4 text-right font-mono">{pm.sales}</td>
                    <td className="py-2 px-4 text-right font-mono">{pm.expenses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Summary Totals */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-xs sm:text-sm">
            {totalsSummary.map((tot, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                <span className="font-bold text-slate-700 dark:text-slate-300">{tot.label}</span>
                <span className="font-black text-slate-900 dark:text-white">{tot.value}</span>
              </div>
            ))}
          </div>

          {/* Section 3: Detalles de los productos vendidos */}
          <div className="space-y-2">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              Detalles de los productos vendidos
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">SKU / CODIGO DE BARRAS</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Cantidad total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productsSold.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500 font-semibold">{idx + 1}.</td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-600 dark:text-slate-300">{p.sku}</td>
                      <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">{p.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{p.qty.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        RD$ {p.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-2.5 px-3">#</td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right font-bold">Total Cantidad:</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">335.144</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      Gran total: RD$ 132,660.32
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 4: Detalles de los productos vendidos (Por marca) */}
          <div className="space-y-2">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              Detalles de los productos vendidos (Por marca)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Marcas</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Cantidad total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {brandSummary.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500 font-semibold">{idx + 1}.</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">{b.brand || 'General / Variadas'}</td>
                      <td className="py-2 px-3 text-right font-mono">{b.qty.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        RD$ {b.total.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-2.5 px-3">#</td>
                    <td className="py-2.5 px-3 text-right font-bold">Total Cantidad:</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">335.144</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      Gran total: RD$ 132,660.32
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 5: User & Location Information */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300 font-medium">
            <p><span className="font-bold text-slate-900 dark:text-white">Usuario:</span> {displayUser}</p>
            <p><span className="font-bold text-slate-900 dark:text-white">Email:</span> {displayEmail}</p>
            <p><span className="font-bold text-slate-900 dark:text-white">Ubicación comercial:</span> {locationName}</p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all active:scale-95 shadow-sm"
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
            >
              <Download size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
