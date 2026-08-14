import React, { useEffect, useRef, useState } from 'react';
import { X, Scale, Barcode, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { decodeVariableWeightBarcode, type ScaleProduct } from '../utils/scaleUtils';

interface PosWeightScanModalProps {
  catalog: ScaleProduct[];
  onConfirm: (product: ScaleProduct, weight: number) => void;
  onClose: () => void;
}

export default function PosWeightScanModal({
  catalog,
  onConfirm,
  onClose,
}: PosWeightScanModalProps) {
  const [scanInput, setScanInput] = useState('');
  const [status, setStatus] = useState<'scanning' | 'processing' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus hidden input for scanner fallback
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    const interval = setInterval(focusInput, 500);
    return () => clearInterval(interval);
  }, []);

  // Global HID Scanner Buffer Keydown Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 12) {
          e.preventDefault();
          e.stopPropagation();
          const barcodeToProcess = buffer.trim();
          buffer = '';
          setScanInput(barcodeToProcess);
          processBarcode(barcodeToProcess);
        } else if (scanInput.trim().length >= 12) {
          e.preventDefault();
          processBarcode(scanInput.trim());
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // High speed hardware scanner keys arrive within short time intervals
        if (timeDiff > 100 && buffer.length > 0) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
        setScanInput(buffer);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, true);
    };
  }, [scanInput]);

  const processBarcode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setStatus('processing');
    setErrorMessage(null);

    // 1. Decode EAN-13 variable weight barcode
    const decoded = decodeVariableWeightBarcode(clean);

    if (!decoded.isVariableWeight) {
      const err = decoded.error || 'El código de peso no es válido.';
      setErrorMessage(err);
      setStatus('error');
      toast.error(err);
      setScanInput('');
      return;
    }

    const plu = decoded.plu; // e.g. "00132" (conserva ceros a la izquierda)
    const fullPrefix = clean.substring(0, 7); // e.g. "2000132"

    // 2. Search catalog by PLU
    const matchedProduct = catalog.find((p) => {
      const pPlu = (p.plu || '').trim();
      const pBarcode = (p.barcode || '').trim();
      const pSku = (p.sku || '').trim().toUpperCase();

      return (
        (pPlu && pPlu === plu) ||
        pBarcode === plu ||
        pBarcode === fullPrefix ||
        pSku === plu ||
        pSku === fullPrefix ||
        pSku.includes(plu) ||
        pBarcode.includes(plu) ||
        p.productId === plu ||
        p.productId === `prod-${plu}`
      );
    });

    if (!matchedProduct) {
      const err = 'No existe un producto configurado con este PLU.';
      setErrorMessage(err);
      setStatus('error');
      toast.error(err);
      setScanInput('');
      return;
    }

    // 3. Validate product is configured for weight
    const isWeighted =
      matchedProduct.isWeightProduct ||
      ['lb', 'kg', 'g', 'oz', 'libra'].some((u) => matchedProduct.unit.toLowerCase().includes(u));

    if (!isWeighted) {
      const err = 'Este producto no está configurado para venta por peso.';
      setErrorMessage(err);
      setStatus('error');
      toast.error(err);
      setScanInput('');
      return;
    }

    // 4. Validate price per pound/unit
    if (!matchedProduct.price || matchedProduct.price <= 0) {
      const err = 'El producto no tiene precio por libra configurado.';
      setErrorMessage(err);
      setStatus('error');
      toast.error(err);
      setScanInput('');
      return;
    }

    // 5. Success! Add to cart with exact weight
    const subtotal = Math.round(matchedProduct.price * decoded.weight * 100) / 100;
    onConfirm(matchedProduct, decoded.weight);
    toast.success(
      `Producto balanza agregado: ${matchedProduct.name} (${decoded.weight} ${matchedProduct.unit || 'lb'}) — Subtotal: RD$ ${subtotal.toFixed(2)}`
    );
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(scanInput);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Escanear producto pesado
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Acerca o escanea la etiqueta del producto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-5">
          {/* Animated Scanner Radar / Scale Icon */}
          <div className="relative my-2">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                status === 'processing'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 animate-pulse'
                  : status === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 ring-8 ring-emerald-500/10 animate-bounce'
              }`}
            >
              {status === 'processing' ? (
                <RefreshCw size={36} className="animate-spin" />
              ) : (
                <Scale size={40} />
              )}
            </div>
          </div>

          {/* Status Messages */}
          <div className="space-y-1">
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {status === 'processing'
                ? 'Procesando...'
                : status === 'error'
                ? 'Error de escaneo'
                : 'Esperando código...'}
            </p>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              {status === 'processing'
                ? 'Decodificando PLU y peso de la etiqueta...'
                : errorMessage || 'El lector escaneará automáticamente el código EAN-13 de la balanza.'}
            </p>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hidden Auto-focused Input for Barcode Scanner */}
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="opacity-0 absolute -z-10 w-0 h-0"
            autoFocus
          />

          {/* Quick Demo Test Barcodes */}
          <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pruebas Rápidas con Etiquetas Reales (Balanza Dahua)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setScanInput('2000132020240');
                  processBarcode('2000132020240');
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <Barcode size={14} />
                <span>2000132020240</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanInput('2000132020462');
                  processBarcode('2000132020462');
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <Barcode size={14} />
                <span>2000132020462</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
