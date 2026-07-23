import { exportTableToPdf, formatMoneyPdf } from '@/lib/exportPdf';

type ReportId =
  | 'profit-loss'
  | 'sales'
  | 'purchases'
  | 'stock'
  | 'stock-detail'
  | 'adjustments'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'agents'
  | 'fiscal'
  | 'cashier';

export function exportReportPdf(
  reportId: ReportId,
  label: string,
  dateFrom: string,
  dateTo: string
) {
  const subtitle = `Periodo: ${dateFrom} — ${dateTo}`;

  switch (reportId) {
    case 'profit-loss':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-ganancias-${dateFrom}-${dateTo}`,
        headers: ['Mes', 'Ventas', 'Compras', 'Ganancias'],
        rows: [
          ['Ago', formatMoneyPdf(145000), formatMoneyPdf(98000), formatMoneyPdf(47000)],
          ['Sep', formatMoneyPdf(162000), formatMoneyPdf(110000), formatMoneyPdf(52000)],
          ['Oct', formatMoneyPdf(138000), formatMoneyPdf(95000), formatMoneyPdf(43000)],
          ['Nov', formatMoneyPdf(175000), formatMoneyPdf(118000), formatMoneyPdf(57000)],
          ['Dic', formatMoneyPdf(210000), formatMoneyPdf(140000), formatMoneyPdf(70000)],
          ['Ene', formatMoneyPdf(185000), formatMoneyPdf(125000), formatMoneyPdf(60000)],
        ],
      });
      break;
    case 'sales':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-ventas-${dateFrom}-${dateTo}`,
        headers: ['Factura', 'Fecha', 'Cliente', 'Ítems', 'Pago', 'Agente', 'Total'],
        rows: [
          ['FAC-001', '15/01/2024', 'Juan Pérez', '8', 'Efectivo', 'Roberto Díaz', formatMoneyPdf(2832)],
          ['FAC-002', '15/01/2024', 'Empresa ABC S.R.L.', '25', 'Transferencia', 'Luisa Fernández', formatMoneyPdf(21830)],
          ['FAC-003', '14/01/2024', 'Rosa Jiménez', '4', 'Crédito', 'Roberto Díaz', formatMoneyPdf(1003)],
          ['FAC-004', '14/01/2024', 'Distribuidora XYZ', '40', 'Cheque', 'Luisa Fernández', formatMoneyPdf(53100)],
          ['FAC-006', '13/01/2024', 'Pedro Martínez', '12', 'Tarjeta', 'Roberto Díaz', formatMoneyPdf(3776)],
        ],
        landscape: true,
      });
      break;
    case 'purchases':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-compras-${dateFrom}-${dateTo}`,
        headers: ['Orden', 'Fecha', 'Proveedor', 'Estado', 'Ítems', 'Total'],
        rows: [
          ['OC-0142', '15/01/2024', 'Distribuidora Norte', 'Recibida', '38', formatMoneyPdf(45200)],
          ['OC-0141', '14/01/2024', 'Alimentos del Caribe', 'Recibida', '22', formatMoneyPdf(28100)],
          ['OC-0140', '12/01/2024', 'Bebidas RD S.A.', 'Parcial', '15', formatMoneyPdf(18650)],
          ['OC-0139', '10/01/2024', 'Lácteos del Cibao', 'Pendiente', '40', formatMoneyPdf(52000)],
        ],
      });
      break;
    case 'stock':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-inventario-${dateFrom}-${dateTo}`,
        headers: ['SKU', 'Producto', 'Categoría', 'Stock', 'Mín.', 'Valor', 'Estado'],
        rows: [
          ['SKU-001', 'Arroz Selecto 5lb', 'Alimentos', '245', '50', formatMoneyPdf(68600), 'OK'],
          ['SKU-014', 'Aceite Vegetal 1L', 'Alimentos', '18', '40', formatMoneyPdf(6300), 'Bajo'],
          ['SKU-022', 'Leche Entera 1L', 'Lácteos', '8', '30', formatMoneyPdf(2400), 'Bajo'],
          ['SKU-045', 'Refresco Cola 2L', 'Bebidas', '5', '25', formatMoneyPdf(750), 'Bajo'],
          ['SKU-058', 'Detergente 1kg', 'Limpieza', '0', '15', formatMoneyPdf(0), 'Agotado'],
        ],
      });
      break;
    case 'stock-detail':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-stock-${dateFrom}-${dateTo}`,
        headers: ['SKU', 'Producto', 'Categoría', 'Stock', 'Mín.', 'Valor', 'Estado'],
        rows: [
          ['SKU-001', 'Arroz Selecto 5lb', 'Alimentos', '245', '50', formatMoneyPdf(44100), 'OK'],
          ['SKU-014', 'Aceite Vegetal 1L', 'Alimentos', '18', '40', formatMoneyPdf(3960), 'Bajo'],
          ['SKU-022', 'Leche Entera 1L', 'Lácteos', '8', '30', formatMoneyPdf(520), 'Bajo'],
          ['SKU-045', 'Refresco Cola 2L', 'Bebidas', '5', '25', formatMoneyPdf(425), 'Bajo'],
          ['SKU-058', 'Detergente 1kg', 'Limpieza', '0', '15', formatMoneyPdf(0), 'Agotado'],
          ['SKU-072', 'Azúcar Blanca 2lb', 'Alimentos', '120', '40', formatMoneyPdf(11400), 'OK'],
        ],
      });
      break;
    case 'adjustments':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-ajustes-${dateFrom}-${dateTo}`,
        headers: ['Usuario', 'Fecha', 'Producto', 'Anterior', 'Nueva', 'Dif.', 'Motivo'],
        rows: [
          ['Admin General', '2024-01-15', 'Arroz Selecto 5lb', '200', '250', '+50', 'Inventario inicial'],
          ['Carlos López', '2024-01-14', 'Aceite Vegetal 1L', '23', '18', '-5', 'Productos dañados'],
          ['María García', '2024-01-13', 'Leche Entera 1L', '11', '8', '-3', 'Vencimiento'],
          ['Admin General', '2024-01-12', 'Azúcar Blanca 2lb', '80', '180', '+100', 'Corrección'],
          ['Pedro Sánchez', '2024-01-11', 'Detergente 1kg', '5', '0', '-5', 'Merma'],
        ],
        landscape: true,
      });
      break;
    case 'expenses':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-gastos-${dateFrom}-${dateTo}`,
        headers: ['Código', 'Fecha', 'Categoría', 'Descripción', 'Responsable', 'Monto', 'Estado'],
        rows: [
          ['GAS-001', '15/01/2024', 'Servicios', 'Pago de electricidad enero', 'Admin General', formatMoneyPdf(8500), 'Aprobado'],
          ['GAS-002', '14/01/2024', 'Mantenimiento', 'Reparación de refrigerador', 'Carlos López', formatMoneyPdf(3200), 'Aprobado'],
          ['GAS-003', '14/01/2024', 'Transporte', 'Combustible para entregas', 'Pedro Sánchez', formatMoneyPdf(1800), 'Pendiente'],
          ['GAS-005', '12/01/2024', 'Publicidad', 'Anuncios en redes sociales', 'Admin General', formatMoneyPdf(5000), 'Aprobado'],
        ],
        landscape: true,
      });
      break;
    case 'customers':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-clientes-${dateFrom}-${dateTo}`,
        headers: ['Código', 'Cliente', 'Doc.', 'Identificación', 'Compras', 'Total', 'Saldo'],
        rows: [
          ['CLI-001', 'Juan Pérez', 'Cédula', '001-1234567-8', '15', formatMoneyPdf(28400), formatMoneyPdf(0)],
          ['CLI-002', 'Empresa ABC S.R.L.', 'RNC', '131-45678-9', '12', formatMoneyPdf(142800), formatMoneyPdf(8500)],
          ['CLI-003', 'Rosa Jiménez', 'Cédula', '402-9876543-1', '9', formatMoneyPdf(15200), formatMoneyPdf(1003)],
          ['CLI-004', 'Distribuidora XYZ', 'RNC', '101-22334-5', '8', formatMoneyPdf(186400), formatMoneyPdf(0)],
        ],
        landscape: true,
      });
      break;
    case 'suppliers':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-proveedores-${dateFrom}-${dateTo}`,
        headers: ['Código', 'Proveedor', 'Compras', 'Saldo', 'Facturas', 'Productos'],
        rows: [
          ['PROV-001', 'Distribuidora Norte', formatMoneyPdf(125400), formatMoneyPdf(38500), '3', '42'],
          ['PROV-002', 'Importadora del Caribe', formatMoneyPdf(84200), formatMoneyPdf(21830), '1', '28'],
          ['PROV-003', 'Bebidas y Más', formatMoneyPdf(61800), formatMoneyPdf(9160), '1', '35'],
          ['PROV-004', 'Lácteos del Cibao', formatMoneyPdf(52000), formatMoneyPdf(9600), '2', '18'],
        ],
        landscape: true,
      });
      break;
    case 'agents':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-agentes-${dateFrom}-${dateTo}`,
        headers: ['Agente', 'Tickets', 'Ventas', 'Meta', 'Cumplimiento', 'Comisión'],
        rows: [
          ['Roberto Díaz', '142', formatMoneyPdf(86500), formatMoneyPdf(80000), '108%', formatMoneyPdf(2162.5)],
          ['Luisa Fernández', '98', formatMoneyPdf(74200), formatMoneyPdf(75000), '99%', formatMoneyPdf(1855)],
          ['Miguel Torres', '86', formatMoneyPdf(52800), formatMoneyPdf(60000), '88%', formatMoneyPdf(1320)],
          ['Ana Castillo', '64', formatMoneyPdf(41300), formatMoneyPdf(50000), '83%', formatMoneyPdf(1032.5)],
        ],
      });
      break;
    case 'fiscal':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-fiscal-dgii-${dateFrom}-${dateTo}`,
        headers: ['NCF', 'Descripción', 'Cantidad', 'Monto', 'ITBIS'],
        rows: [
          ['B01', 'Crédito Fiscal', '42', formatMoneyPdf(186400), formatMoneyPdf(33552)],
          ['B02', 'Consumidor Final', '680', formatMoneyPdf(412800), formatMoneyPdf(74304)],
          ['B14', 'Régimen Especial', '8', formatMoneyPdf(28400), formatMoneyPdf(0)],
          ['B15', 'Gubernamental', '3', formatMoneyPdf(52000), formatMoneyPdf(9360)],
        ],
      });
      break;
    case 'cashier':
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-caja-${dateFrom}-${dateTo}`,
        headers: ['Sesión', 'Caja', 'Cajero', 'Apertura', 'Cierre', 'Esperado', 'Contado', 'Dif.'],
        rows: [
          ['CJ-001', 'Caja #1', 'Roberto Díaz', '08:00', '16:05', formatMoneyPdf(48200), formatMoneyPdf(48150), formatMoneyPdf(-50)],
          ['CJ-002', 'Caja #2', 'Luisa Fernández', '08:00', '16:00', formatMoneyPdf(35600), formatMoneyPdf(35600), formatMoneyPdf(0)],
          ['CJ-003', 'Caja #1', 'Miguel Torres', '16:00', '22:10', formatMoneyPdf(52800), formatMoneyPdf(52920), formatMoneyPdf(120)],
        ],
        landscape: true,
      });
      break;
    default:
      exportTableToPdf({
        title: label,
        subtitle,
        filename: `informe-${dateFrom}-${dateTo}`,
        headers: ['Concepto', 'Valor'],
        rows: [['Sin datos específicos', '—']],
      });
  }
}
