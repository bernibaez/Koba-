import React from 'react';
import { Scale, Package, Layers } from 'lucide-react';
import type { SaleType, WeightUnit } from '@/types/database';
import { formatWeightUnitLabel } from './WeightCalculator';

interface WeightBadgeProps {
  saleType?: SaleType | 'unit' | 'weight' | 'both';
  weightUnit?: WeightUnit | string;
  isWeighted?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WeightBadge({
  saleType = 'unit',
  weightUnit = 'lb',
  isWeighted = false,
  className = '',
  size = 'sm',
}: WeightBadgeProps) {
  const actualSaleType = isWeighted ? (saleType === 'both' ? 'both' : 'weight') : saleType;
  const unitLabel = formatWeightUnitLabel(weightUnit);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 16,
  };

  if (actualSaleType === 'weight') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-extrabold rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 ${sizeClasses[size]} ${className}`}
        title={`Venta por peso (${unitLabel})`}
      >
        <Scale size={iconSizes[size]} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Peso ({unitLabel})</span>
      </span>
    );
  }

  if (actualSaleType === 'both') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-extrabold rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 ${sizeClasses[size]} ${className}`}
        title={`Venta por unidad o por peso (${unitLabel})`}
      >
        <Layers size={iconSizes[size]} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span>Unidad / {unitLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses[size]} ${className}`}
      title="Venta por unidad"
    >
      <Package size={iconSizes[size]} className="text-slate-500 flex-shrink-0" />
      <span>Unidad</span>
    </span>
  );
}
