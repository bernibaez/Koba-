import React, { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, X, Scale, Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from './ProductManagementScreen';

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
  existingProducts?: Product[];
  onImport: (productsToImport: Product[]) => Promise<void>;
  defaultIsScaleMode?: boolean;
}

interface ParsedImportRow {
  id: string;
  plu: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  minStock: number;
  saleType: 'unit' | 'weight' | 'both';
  weightUnit: 'lb' | 'kg';
  isWeightProduct: boolean;
  generateScaleBarcode: boolean;
  status: 'active' | 'inactive' | 'discontinued';
  isValid: boolean;
  validationError?: string;
}

function stripNullBytes(str: string): string {
  if (!str) return '';
  return str.replace(/[\u0000\0]/g, '').trim();
}

function padPlu(rawPlu: string | number): string {
  const digits = stripNullBytes(String(rawPlu || '')).replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(5, '0');
}

function parseCsvOrTsv(text: string, forceScaleMode = false): ParsedImportRow[] {
  const cleanText = stripNullBytes(text);
  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Detect delimiter (, or \t or ;)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  const rows = lines.map((line) => {
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      const val = match[1] !== undefined ? match[1] : match[2];
      matches.push(val ? val.trim() : '');
    }
    return matches;
  });

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const hasHeader =
    headers.some((h) => h.includes('plu') || h.includes('name') || h.includes('nombre') || h.includes('price') || h.includes('precio') || h.includes('sku') || h.includes('code'));

  const dataRows = hasHeader ? rows.slice(1) : rows;

  const getColIdx = (terms: string[]) =>
    headers.findIndex((h) => terms.some((t) => h.includes(t)));

  const pluIdx = getColIdx(['plu no', 'pluno', 'plu']);
  const nameIdx = getColIdx(['name', 'nombre', 'descripcion', 'description', 'item']);
  const codeIdx = getColIdx(['code', 'codigo', 'sku', 'barcode', 'codigo_barras']);
  const priceIdx = getColIdx(['price', 'precio', 'precio_venta', 'saleprice', 'precio/lb']);
  const costIdx = getColIdx(['cost', 'costo', 'precio_costo', 'costprice']);
  const modeIdx = getColIdx(['mode', 'modo', 'tipo', 'sale_type', 'saletype', 'type']);
  const catIdx = getColIdx(['category', 'categoria', 'cat']);
  const stockIdx = getColIdx(['stock', 'existencia', 'cant', 'cantidad', 'currentstock']);

  const parsedList: ParsedImportRow[] = [];

  dataRows.forEach((cols, i) => {
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) return;

    let rawPlu = pluIdx >= 0 ? cols[pluIdx] : '';
    let name = nameIdx >= 0 ? cols[nameIdx] : '';
    let rawCode = codeIdx >= 0 ? cols[codeIdx] : '';
    let rawPrice = priceIdx >= 0 ? cols[priceIdx] : '';
    let rawCost = costIdx >= 0 ? cols[costIdx] : '';
    let rawMode = modeIdx >= 0 ? cols[modeIdx] : '';
    let category = catIdx >= 0 ? cols[catIdx] : '';
    let rawStock = stockIdx >= 0 ? cols[stockIdx] : '';

    if (!hasHeader) {
      rawPlu = cols[0] || '';
      name = cols[1] || '';
      rawCode = cols[2] || '';
      rawPrice = cols[3] || '';
      rawMode = cols[4] || '';
    }

    if (!name && !rawPlu && !rawCode) return;

    const formattedPlu = padPlu(rawPlu);
    const salePrice = Math.max(0, parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
    const costPrice = rawCost ? Math.max(0, parseFloat(String(rawCost).replace(/[^0-9.]/g, '')) || 0) : Math.round(salePrice * 0.7 * 100) / 100;
    const currentStock = rawStock ? parseFloat(String(rawStock).replace(/[^0-9.]/g, '')) || 0 : 100;

    const isWeightMode =
      forceScaleMode ||
      !!formattedPlu ||
      rawMode.toLowerCase().includes('weight') ||
      rawMode.toLowerCase().includes('peso') ||
      rawMode.toLowerCase().includes('lb') ||
      rawMode.toLowerCase().includes('kg');

    const cleanCode = String(rawCode || '').trim();
    const barcode = cleanCode || formattedPlu || `20${(formattedPlu || '00001').padStart(5, '0')}00000`;
    const sku = cleanCode || (formattedPlu ? `PLU-${formattedPlu}` : `SKU-${Date.now()}-${i + 1}`);

    let validationError = '';
    if (!name) validationError = 'Nombre de producto requerido';
    else if (salePrice <= 0) validationError = 'Precio de venta debe ser mayor a 0';

    parsedList.push({
      id: `import-${Date.now()}-${i}`,
      plu: formattedPlu,
      name: name || 'Producto sin nombre',
      sku,
      barcode,
      category: category || (isWeightMode ? 'Fresco / Balanza' : 'General'),
      salePrice,
      costPrice,
      currentStock,
      minStock: 10,
      saleType: isWeightMode ? 'weight' : 'unit',
      weightUnit: 'lb',
      isWeightProduct: isWeightMode,
      generateScaleBarcode: isWeightMode,
      status: 'active',
      isValid: !validationError,
      validationError,
    });
  });

  return parsedList;
}

export default function ProductImportModal({
  open,
  onClose,
  existingProducts = [],
  onImport,
  defaultIsScaleMode = false,
}: ProductImportModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [isScaleModeToggle, setIsScaleModeToggle] = useState(defaultIsScaleMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const rows = parseCsvOrTsv(text, isScaleModeToggle);
      setParsedRows(rows);
      if (rows.length > 0) {
        toast.success(`Se leyeron ${rows.length} producto(s) del archivo "${file.name}"`);
      } else {
        toast.error('No se encontraron registros válidos en el archivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    if (!pasteContent.trim()) {
      toast.error('Ingresa o pega el contenido del archivo plano.');
      return;
    }
    const rows = parseCsvOrTsv(pasteContent, isScaleModeToggle);
    setParsedRows(rows);
    if (rows.length > 0) {
      toast.success(`Se detectaron ${rows.length} producto(s) correctamente`);
    } else {
      toast.error('No se identificaron datos válidos en el texto ingresado.');
    }
  };

  const handleDownloadSample = () => {
    const sampleMscaleCsv = `PLU NO,Name,Code,Price,Mode,Shop NO
127,Repollo Picado,0000127,50,weight,20
128,HUESO DE VACA,0000128,50,weight,20
129,CHIVO,0000129,250,weight,20
130,QUESO GOUDA RICA,0000130,275,weight,20
131,UVA NAVIDERA,0000131,225,weight,20
132,AVENA DETALLADA ECO,0000132,40,weight,20
133,Arroz Selecto Miranda,0000133,37,weight,20
134,JAMON 4X4,0000134,85,weight,20
135,QUESO DE FREIR YOQUE,0000135,260,weight,20`;

    const blob = new Blob([sampleMscaleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos_mscale.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla mscale descargada');
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('No hay productos válidos para importar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productsToSave: Product[] = validRows.map((r) => {
        const isWeight = r.isWeightProduct || r.saleType === 'weight';
        return {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          barcode: r.barcode,
          sku: r.sku,
          plu: r.plu || undefined,
          name: r.name,
          category: r.category,
          brand: 'General',
          unit: isWeight ? 'Libra' : 'Unidad',
          supplier: 'Distribuidor Local',
          costPrice: r.costPrice,
          salePrice: r.salePrice,
          wholesalePrice: r.salePrice,
          tax: 0,
          minStock: r.minStock,
          currentStock: r.currentStock,
          image: '',
          expiryDate: null,
          warranty: 'N/A',
          status: 'active',
          stockStatus: r.currentStock <= 0 ? 'out' : r.currentStock <= r.minStock ? 'low' : 'normal',
          saleType: isWeight ? 'weight' : 'unit',
          weightUnit: 'lb',
          pricePerWeight: r.salePrice,
          allowDecimal: true,
          minWeight: 0.01,
          maxWeight: 999.99,
          generateScaleBarcode: isWeight,
          isWeightProduct: isWeight,
        };
      });

      await onImport(productsToSave);
      toast.success(`¡Éxito! Se importaron ${productsToSave.length} productos correctamente.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al importar productos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <ModalShell open={open} onClose={onClose} size="xl" className="p-6">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Importar Productos (mscale / Excel / CSV)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Carga directa de datos desde software de balanzas mscale o archivos planos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Control Switch: Configurar Venta por Peso / Balanza mscale */}
      <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs font-semibold text-foreground">
            <span>Modo Balanza mscale:</span>
            <span className="font-normal text-muted-foreground ml-1">
              Formatea PLUs a 5 dígitos (ej. 132 → 00132) y activa la venta por peso automáticamente
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isScaleModeToggle}
            onChange={(e) => {
              setIsScaleModeToggle(e.target.checked);
              if (parsedRows.length > 0) {
                setParsedRows((prev) =>
                  prev.map((r) => ({
                    ...r,
                    saleType: e.target.checked ? 'weight' : 'unit',
                    isWeightProduct: e.target.checked,
                    generateScaleBarcode: e.target.checked,
                    category: e.target.checked ? 'Fresco / Balanza' : r.category,
                  }))
                );
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
        </label>
      </div>

      {/* Options: File Upload vs Text Paste */}
      {parsedRows.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'upload' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              Cargar Archivo (.csv / .txt / .tsv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'paste' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              Pegar Texto Plano (mscale)
            </button>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="ml-auto btn-secondary text-xs flex items-center gap-1.5 py-1.5"
            >
              <Download size={14} /> Descargar Plantilla mscale
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-secondary/30">
              <Upload size={36} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-foreground">Arrastra o selecciona un archivo exportado de mscale</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Soporta formatos CSV, TSV (delimitados por comas o tabulaciones) exportados directamente desde el software mscale
              </p>
              <label className="btn-primary inline-flex items-center gap-2 text-xs font-bold cursor-pointer px-5 py-2.5">
                <FileSpreadsheet size={16} /> Seleccionar Archivo...
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={`Pega las filas o contenido del reporte mscale aquí...\nEjemplo:\nPLU NO,Name,Code,Price,Mode\n127,Repollo Picado,0000127,50,weight\n132,AVENA DETALLADA ECO,0000132,40,weight`}
                rows={7}
                className="input-field font-mono text-xs p-3.5 w-full"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="btn-primary text-xs font-bold flex items-center gap-2"
              >
                <Sparkles size={14} /> Procesar Datos Pegados
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Table & Action Controls */}
      {parsedRows.length > 0 && (
        <div className="space-y-4 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {validCount} Válidos
              </span>
              {invalidCount > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-danger-bg text-danger border border-danger/20">
                  {invalidCount} Con Errores
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedRows([])}
                className="btn-secondary text-xs"
                disabled={isSubmitting}
              >
                ← Cargar otro archivo
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary text-muted-foreground uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3">Estado</th>
                  <th className="p-3">PLU</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">SKU / Código</th>
                  <th className="p-3">Código Barras</th>
                  <th className="p-3 text-right">Precio Venta (RD$)</th>
                  <th className="p-3 text-right">Stock</th>
                  <th className="p-3">Tipo Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedRows.map((r) => (
                  <tr key={r.id} className={r.isValid ? 'hover:bg-secondary/40' : 'bg-danger-bg/20'}>
                    <td className="p-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={14} /> Listo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger font-bold" title={r.validationError}>
                          <AlertTriangle size={14} /> {r.validationError}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {r.plu ? `PLU: ${r.plu}` : '—'}
                    </td>
                    <td className="p-3 font-bold text-foreground">{r.name}</td>
                    <td className="p-3 font-mono">{r.sku}</td>
                    <td className="p-3 font-mono text-muted-foreground">{r.barcode}</td>
                    <td className="p-3 text-right font-bold text-foreground">RD$ {r.salePrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{r.currentStock}</td>
                    <td className="p-3">
                      {r.saleType === 'weight' || r.isWeightProduct ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          <Scale size={12} /> Peso (mscale)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          <Package size={12} /> Unidad
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Se importarán los {validCount} productos listos a la base de datos de Mercato
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting || validCount === 0}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>Confirmar e Importar {validCount} Productos</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
