import type { WeightUnit } from '@/types/database';

export interface WeightValidationResult {
  isValid: boolean;
  error?: string;
}

export function calculateWeightSubtotal(weight: number, pricePerUnit: number): number {
  if (isNaN(weight) || isNaN(pricePerUnit) || weight <= 0 || pricePerUnit <= 0) {
    return 0;
  }
  return Math.round(weight * pricePerUnit * 100) / 100;
}

export function validateWeightValue(
  weight: number,
  minWeight = 0.01,
  maxWeight = 999.99,
  allowDecimal = true
): WeightValidationResult {
  if (isNaN(weight)) {
    return { isValid: false, error: 'Por favor ingresa un peso válido.' };
  }
  if (weight <= 0) {
    return { isValid: false, error: 'El peso debe ser mayor a cero.' };
  }
  if (!allowDecimal && !Number.isInteger(weight)) {
    return { isValid: false, error: 'Este producto no permite valores decimales.' };
  }
  if (weight < minWeight) {
    return { isValid: false, error: `El peso mínimo permitido es ${minWeight}.` };
  }
  if (weight > maxWeight) {
    return { isValid: false, error: `El peso máximo permitido es ${maxWeight}.` };
  }
  return { isValid: true };
}

export function formatWeightUnitLabel(unit?: WeightUnit | string): string {
  if (!unit) return 'lb';
  const u = unit.toLowerCase();
  if (u === 'lb' || u === 'libra' || u === 'libras') return 'lb';
  if (u === 'kg' || u === 'kilo' || u === 'kilogramo' || u === 'kilogramos') return 'kg';
  if (u === 'g' || u === 'gramo' || u === 'gramos') return 'g';
  if (u === 'oz' || u === 'onza' || u === 'onzas') return 'oz';
  return unit;
}

export function formatWeightQuantity(qty: number, unit?: WeightUnit | string): string {
  const formattedQty = qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2);
  return `${formattedQty} ${formatWeightUnitLabel(unit)}`;
}
