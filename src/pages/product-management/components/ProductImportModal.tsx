import React, { useEffect, useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, X, Scale, Package, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from './ProductManagementScreen';
import {
  annotateImportMatches,
  parseAnyFileContent,
  parseImportedFile,
  type ParsedImportRow,
} from '@/lib/scaleImport';

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
  existingProducts?: Product[];
  onImport: (productsToImport: Product[]) => Promise<void>;
  defaultIsScaleMode?: boolean;
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
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsScaleModeToggle(defaultIsScaleMode);
    setParsedRows([]);
    setPasteContent('');
    setActiveTab('upload');
  }, [open, defaultIsScaleMode]);

  if (!open) return null;

  const applyRows = (rows: ParsedImportRow[], sourceLabel: string) => {
    const annotated = annotateImportMatches(rows, existingProducts);
    setParsedRows(annotated);
    if (annotated.length > 0) {
      const updates = annotated.filter((r) => r.matchStatus === 'update').length;
      const creates = annotated.filter((r) => r.matchStatus === 'create' && r.isValid).length;
      toast.success(
        `Se leyeron ${annotated.length} producto(s) de ${sourceLabel} (${creates} nuevos, ${updates} para actualizar)`
      );
    } else {
      toast.error('No se encontraron registros válidos en el archivo.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsReadingFile(true);
    try {
      const rows = await parseImportedFile(file, isScaleModeToggle);
      applyRows(rows, `"${file.name}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer el archivo de balanza.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleParseText = () => {
    if (!pasteContent.trim()) {
      toast.error('Ingresa o pega el contenido del archivo plano.');
      return;
    }
    const rows = parseAnyFileContent(pasteContent, isScaleModeToggle);
    applyRows(rows, 'texto pegado');
  };

  const handleDownloadSample = () => {
    const sample = `PLU NO,Name,Code,Price,Mode,Shop NO
127,Repollo Picado,0000127,50,weight,20
128,HUESO DE VACA,0000128,50,weight,20
132,AVENA DETALLADA ECO,0000132,40,weight,20
133,Arroz Selecto Miranda,0000133,37,weight,20`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos_balanza.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Plantilla descargada');
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.matchStatus !== 'unchanged');
    const unchanged = parsedRows.filter((r) => r.isValid && r.matchStatus === 'unchanged').length;
    if (validRows.length === 0) {
      toast.error(
        unchanged > 0
          ? 'Todos los productos válidos ya están actualizados. No hay cambios que aplicar.'
          : 'No hay productos válidos para importar.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const productsToSave: Product[] = validRows.map((r) => {
        const isWeight = r.isWeightProduct || r.saleType === 'weight';
        return {
          id: r.existingId || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al importar productos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const createCount = parsedRows.filter((r) => r.isValid && r.matchStatus === 'create').length;
  const updateCount = parsedRows.filter((r) => r.isValid && r.matchStatus === 'update').length;
  const unchangedCount = parsedRows.filter((r) => r.isValid && r.matchStatus === 'unchanged').length;
  const applyCount = createCount + updateCount;

  return (
    <ModalShell open={open} onClose={onClose} size="xl" className="p-6">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Importar / actualizar productos de balanza
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Soporta volcado nativo <span className="font-mono">1P</span>, Excel mscale (.xls/.xlsx), CSV y texto plano. Si el PLU ya existe, se actualiza nombre y precio (el stock no se modifica).
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

      <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs font-semibold text-foreground">
            <span>Modo Balanza:</span>
            <span className="font-normal text-muted-foreground ml-1">
              PLU a 5 dígitos (132 → 00132) y venta por peso. Reimportar el mismo archivo actualiza los productos existentes.
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
                  annotateImportMatches(
                    prev.map((r) => ({
                      ...r,
                      saleType: e.target.checked ? 'weight' : 'unit',
                      isWeightProduct: e.target.checked,
                      generateScaleBarcode: e.target.checked,
                      category: e.target.checked ? 'Fresco / Balanza' : r.category,
                    })),
                    existingProducts
                  )
                );
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
        </label>
      </div>

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
              Cargar archivo (.txt / .xls / .csv)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'paste' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              Pegar volcado de balanza
            </button>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="ml-auto btn-secondary text-xs flex items-center gap-1.5 py-1.5"
            >
              <Download size={14} /> Descargar plantilla
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-all bg-secondary/30">
              <Upload size={36} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-foreground">Archivo exportado de la balanza o mscale</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Acepta volcado <span className="font-mono">1P0001A...</span> (.txt), Excel de mscale (.xls / .xlsx) y CSV
              </p>
              <label className="btn-primary inline-flex items-center gap-2 text-xs font-bold cursor-pointer px-5 py-2.5">
                {isReadingFile ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Leyendo...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={16} /> Seleccionar archivo...
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xls,.xlsx"
                  onChange={(ev) => void handleFileUpload(ev)}
                  className="hidden"
                  disabled={isReadingFile}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={`Pega el volcado de la balanza (líneas 1P...) o un CSV:\n1P0001A0000001002500...##BICARBONATO ####`}
                rows={7}
                className="input-field font-mono text-xs p-3.5 w-full"
              />
              <button type="button" onClick={handleParseText} className="btn-primary text-xs font-bold flex items-center gap-2">
                <Sparkles size={14} /> Procesar datos pegados
              </button>
            </div>
          )}
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="space-y-4 slide-up">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {createCount} nuevos
              </span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                {updateCount} a actualizar
              </span>
              {unchangedCount > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {unchangedCount} sin cambios
                </span>
              )}
              {invalidCount > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-danger-bg text-danger border border-danger/20">
                  {invalidCount} con errores
                </span>
              )}
            </div>
            <button type="button" onClick={() => setParsedRows([])} className="btn-secondary text-xs" disabled={isSubmitting}>
              ← Cargar otro archivo
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary text-muted-foreground uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3">Estado</th>
                  <th className="p-3">PLU</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3 text-right">Precio / lb</th>
                  <th className="p-3">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedRows.map((r) => (
                  <tr key={r.id} className={r.isValid ? 'hover:bg-secondary/40' : 'bg-danger-bg/20'}>
                    <td className="p-3">
                      {!r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-danger font-bold" title={r.validationError}>
                          <AlertTriangle size={14} /> {r.validationError}
                        </span>
                      ) : r.matchStatus === 'update' ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <RefreshCw size={14} /> Actualizar
                          {r.existingPrice != null && r.existingPrice !== r.salePrice
                            ? ` (RD$ ${r.existingPrice.toFixed(2)} → ${r.salePrice.toFixed(2)})`
                            : ''}
                        </span>
                      ) : r.matchStatus === 'unchanged' ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                          <CheckCircle2 size={14} /> Al día
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={14} /> Nuevo
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {r.plu ? r.plu : '—'}
                    </td>
                    <td className="p-3 font-bold text-foreground">{r.name}</td>
                    <td className="p-3 text-right font-bold text-foreground">RD$ {r.salePrice.toFixed(2)}</td>
                    <td className="p-3">
                      {r.saleType === 'weight' || r.isWeightProduct ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          <Scale size={12} /> Peso
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

          <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Se aplicarán {applyCount} cambios ({createCount} altas, {updateCount} actualizaciones). El inventario actual no se reemplaza.
              {validCount > 0 ? ` ${validCount} filas válidas de ${parsedRows.length}.` : ''}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmImport()}
                disabled={isSubmitting || applyCount === 0}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>Confirmar sincronización ({applyCount})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
