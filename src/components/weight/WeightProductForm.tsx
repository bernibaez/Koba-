import React from 'react';
import { Scale, Layers, Package, Barcode } from 'lucide-react';
import type { SaleType, WeightUnit } from '@/types/database';

export interface WeightFormState {
  saleType: SaleType;
  weightUnit: WeightUnit;
  pricePerWeight: number;
  minWeight: number;
  maxWeight: number;
  allowDecimal: boolean;
  generateScaleBarcode: boolean;
}

interface WeightProductFormProps {
  values: WeightFormState;
  onChange: (updates: Partial<WeightFormState>) => void;
  baseSalePrice: number;
}

export default function WeightProductForm({
  values,
  onChange,
  baseSalePrice,
}: WeightProductFormProps) {
  const isWeighted = values.saleType === 'weight' || values.saleType === 'both';

  return (
    <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Scale size={18} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Tipo de Venta & Configuración de Peso
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Define si el producto se vende por unidades fijas o por peso variable.
          </p>
        </div>
      </div>

      {/* Sale Type Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            values.saleType === 'unit'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <input
            type="radio"
            name="sale_type"
            value="unit"
            checked={values.saleType === 'unit'}
            onChange={() => onChange({ saleType: 'unit' })}
            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex items-center gap-2">
            <Package size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <span className="font-bold text-xs block">Por Unidad</span>
              <span className="text-[10px] text-slate-400">1, 2, 3 unidades</span>
            </div>
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            values.saleType === 'weight'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <input
            type="radio"
            name="sale_type"
            value="weight"
            checked={values.saleType === 'weight'}
            onChange={() =>
              onChange({
                saleType: 'weight',
                pricePerWeight: values.pricePerWeight > 0 ? values.pricePerWeight : baseSalePrice,
              })
            }
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-bold text-xs block">Por Peso</span>
              <span className="text-[10px] text-slate-400">Balanza / Peso exacto</span>
            </div>
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            values.saleType === 'both'
              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <input
            type="radio"
            name="sale_type"
            value="both"
            checked={values.saleType === 'both'}
            onChange={() =>
              onChange({
                saleType: 'both',
                pricePerWeight: values.pricePerWeight > 0 ? values.pricePerWeight : baseSalePrice,
              })
            }
            className="w-4 h-4 text-amber-600 focus:ring-amber-500"
          />
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold text-xs block">Unidad o Peso</span>
              <span className="text-[10px] text-slate-400">Seleccionar en POS</span>
            </div>
          </div>
        </label>
      </div>

      {/* Conditional Weight Fields */}
      {isWeighted && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Weight Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidad de Peso
              </label>
              <select
                value={values.weightUnit}
                onChange={(e) => onChange({ weightUnit: e.target.value as WeightUnit })}
                className="input-field h-10 text-xs font-bold"
              >
                <option value="lb">Libras (lb)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="oz">Onzas (oz)</option>
              </select>
            </div>

            {/* Min Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso Mínimo ({values.weightUnit.toUpperCase()})
              </label>
              <input
                type="number"
                step="0.001"
                min={0.001}
                value={values.minWeight}
                onChange={(e) => onChange({ minWeight: parseFloat(e.target.value) || 0.01 })}
                className="input-field h-10 text-xs font-bold tabular-nums"
                placeholder="0.01"
              />
            </div>

            {/* Max Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso Máximo ({values.weightUnit.toUpperCase()})
              </label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={values.maxWeight}
                onChange={(e) => onChange({ maxWeight: parseFloat(e.target.value) || 999.99 })}
                className="input-field h-10 text-xs font-bold tabular-nums"
                placeholder="999.99"
              />
            </div>

            {/* Allow Decimals Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
                  Permitir Decimales
                </span>
                <span className="text-[10px] text-slate-400">Ej: 2.35 {values.weightUnit}</span>
              </div>
              <input
                type="checkbox"
                checked={values.allowDecimal}
                onChange={(e) => onChange({ allowDecimal: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {/* Scale Barcode Toggle */}
            <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <Scale size={16} />
                </div>
                <div>
                  <span className="font-bold text-xs block text-slate-900 dark:text-white flex items-center gap-1.5">
                    Producto de Balanza
                    {values.generateScaleBarcode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        EAN-13 / PLU
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Este producto utiliza etiquetas EAN-13 generadas por una balanza para identificar automáticamente el PLU y el peso.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={values.generateScaleBarcode}
                onChange={(e) => onChange({ generateScaleBarcode: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
