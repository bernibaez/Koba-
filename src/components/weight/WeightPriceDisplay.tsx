import React from 'react';
import type { WeightUnit } from '@/types/database';
import { formatWeightUnitLabel } from './WeightCalculator';

interface WeightPriceDisplayProps {
  price: number;
  unit?: WeightUnit | string;
  isWeighted?: boolean;
  className?: string;
  priceClassName?: string;
  unitClassName?: string;
  currencyPrefix?: string;
}

export default function WeightPriceDisplay({
  price,
  unit = 'lb',
  isWeighted = true,
  className = '',
  priceClassName = 'font-black text-slate-900 dark:text-white',
  unitClassName = 'text-slate-500 font-semibold text-xs',
  currencyPrefix = 'RD$',
}: WeightPriceDisplayProps) {
  const unitLabel = formatWeightUnitLabel(unit);
  const formattedPrice = price.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className={priceClassName}>
        {currencyPrefix} {formattedPrice}
      </span>
      {isWeighted && (
        <span className={unitClassName}>
          / {unitLabel}
        </span>
      )}
    </div>
  );
}
