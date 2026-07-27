import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export type PdfCell = string | number;

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: PdfCell[][];
  landscape?: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function exportTableToPdf({
  title,
  subtitle,
  filename,
  headers,
  rows,
  landscape = false,
}: ExportPdfOptions) {
  if (!rows.length) {
    toast.error('No hay datos para exportar');
    return;
  }

  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const generatedAt = new Date().toLocaleString('es-DO');

  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text('MarketERP', 14, 16);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, 24);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (subtitle) {
    doc.text(subtitle, 14, 30);
    doc.text(`Generado: ${generatedAt}`, 14, 35);
  } else {
    doc.text(`Generado: ${generatedAt}`, 14, 30);
  }

  autoTable(doc, {
    startY: subtitle ? 40 : 36,
    head: [headers],
    body: rows.map((row) => row.map((cell) => String(cell ?? ''))),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  const safeName = filename.endsWith('.pdf') ? filename : `${slugify(filename)}.pdf`;
  doc.save(safeName);
  toast.success('PDF descargado');
}

export function exportTableToExcel({
  title,
  filename,
  headers,
  rows,
}: Omit<ExportPdfOptions, 'landscape' | 'subtitle'>) {
  if (!rows.length) {
    toast.error('No hay datos para exportar');
    return;
  }

  const csvRows: string[] = [];
  csvRows.push(`"${title.replace(/"/g, '""')}"`);
  csvRows.push(`"Generado el: ${new Date().toLocaleString('es-DO')}"`);
  csvRows.push(''); // Empty line

  // Header row
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach((row) => {
    const formattedRow = row.map((cell) => {
      const val = String(cell ?? '');
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(formattedRow.join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = filename.endsWith('.csv') ? filename : `${slugify(filename)}.csv`;
  link.setAttribute('download', safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success('Excel (CSV) descargado');
}

export function formatMoneyPdf(value: number) {
  return `RD$ ${value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
