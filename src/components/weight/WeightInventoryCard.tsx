import React from 'react';
import { Scale, AlertTriangle, CheckCircle } from 'lucide-react';
import type { WeightUnit } from '@/types/database';
import { formatWeightQuantity, formatWeightUnitLabel } from './WeightCalculator';

interface WeightInventoryCardProps {
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  weightUnit?: WeightUnit | string;
  className?: string;
}

export default function WeightInventoryCard({
  productName,
  sku,
  currentStock,
  minStock,
  weightUnit = 'lb',
  className = '',
}: WeightInventoryCardProps) {
  const unitLabel = formatWeightUnitLabel(weightUnit);
  const isLow = currentStock <= minStock;
  const isOut = currentStock <= 0;

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isOut
          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
          : isLow
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Scale size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
              {productName}
            </h4>
          </div>
          <p className="text-xs font-mono text-slate-400">{sku}</p>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
            isOut
              ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
              : isLow
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isOut ? (
            <>
              <AlertTriangle size={12} /> Agotado
            </>
          ) : isLow ? (
            <>
              <AlertTriangle size={12} /> Stock bajo
            </>
          ) : (
            <>
              <CheckCircle size={12} /> Normal
            </>
          )}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block">Stock Mínimo</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {formatWeightQuantity(minStock, unitLabel)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block">Disponible</span>
          <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
            {formatWeightQuantity(currentStock, unitLabel)}
          </span>
        </div>
      </div>
    </div>
  );
}
