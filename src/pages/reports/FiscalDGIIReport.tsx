import React from 'react';
import { FileText, Receipt, Percent, Building2 } from 'lucide-react';
import { KpiCard, ReportTable, formatRD } from './shared';

/** Informe fiscal orientado a DGII (Rep. Dominicana): ITBIS, NCF, resumen 606/607 style */
const ncfSales = [
  ['B01', 'Crédito Fiscal', '42', formatRD(186400), formatRD(33552)],
  ['B02', 'Consumidor Final', '680', formatRD(412800), formatRD(74304)],
  ['B14', 'Régimen Especial', '8', formatRD(28400), formatRD(0)],
  ['B15', 'Gubernamental', '3', formatRD(52000), formatRD(9360)],
];

const itbisSummary = [
  ['ITBIS cobrado en ventas (18%)', formatRD(117216)],
  ['ITBIS retenido', formatRD(4200)],
  ['ITBIS pagado en compras (crédito fiscal)', formatRD(68400)],
  ['ITBIS a pagar (neto estimado)', formatRD(44616)],
];

const form606 = [
  ['131-45678-9', 'Alimentos del Caribe', '05/01/2024', 'B01', 'E3100000123', formatRD(28100), formatRD(5058)],
  ['101-22334-5', 'Distribuidora Norte', '10/01/2024', 'B01', 'E3100000142', formatRD(45200), formatRD(8136)],
  ['130-99887-6', 'Bebidas RD S.A.', '12/01/2024', 'B01', 'E3100000155', formatRD(18650), formatRD(3357)],
];

const form607 = [
  ['001-1234567-8', 'Juan Pérez', '15/01/2024', 'B02', 'B0200000842', formatRD(2832), formatRD(432)],
  ['131-45678-9', 'Empresa ABC S.R.L.', '15/01/2024', 'B01', 'B0100000218', formatRD(21830), formatRD(3330)],
  ['101-22334-5', 'Distribuidora XYZ', '14/01/2024', 'B01', 'B0100000219', formatRD(53100), formatRD(8100)],
];

export default function FiscalDGIIReport() {
  return (
    <div className="space-y-4">
      <div className="card p-4 bg-warning/5 border-warning/20">
        <div className="flex items-start gap-3">
          <Building2 size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Informe Fiscal DGII — Periodo seleccionado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Resumen preliminar para formatos 606 (compras) y 607 (ventas). Los montos son de demostración; al conectar datos reales se exportan a TXT/XML según especificación DGII.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ventas gravadas" value="RD$ 679K" trend="Incluye NCF emitidos" icon={<Receipt size={16} className="text-info" />} />
        <KpiCard label="ITBIS cobrado" value="RD$ 117K" trend="Tasa 18%" icon={<Percent size={16} className="text-warning" />} />
        <KpiCard label="ITBIS crédito fiscal" value="RD$ 68.4K" trend="Compras con B01" icon={<FileText size={16} className="text-primary" />} />
        <KpiCard label="ITBIS neto a pagar" value="RD$ 44.6K" trend="Estimado del periodo" trendPositive={false} icon={<Building2 size={16} className="text-danger" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-foreground mb-3">Ventas por tipo de NCF</h3>
          <ReportTable
            headers={['NCF', 'Descripción', 'Cantidad', 'Monto', 'ITBIS']}
            rows={ncfSales}
          />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-3">Resumen ITBIS</h3>
          <div className="card divide-y divide-border">
            {itbisSummary.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Formato 606 — Compras (muestra)</h3>
        <ReportTable
          headers={['RNC', 'Proveedor', 'Fecha', 'NCF', 'Número', 'Monto', 'ITBIS']}
          rows={form606}
        />
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Formato 607 — Ventas (muestra)</h3>
        <ReportTable
          headers={['RNC/Cédula', 'Cliente', 'Fecha', 'NCF', 'Número', 'Monto', 'ITBIS']}
          rows={form607}
        />
      </div>
    </div>
  );
}
