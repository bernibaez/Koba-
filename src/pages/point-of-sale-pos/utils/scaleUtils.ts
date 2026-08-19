export interface ScaleProduct {
  productId: string;
  name: string;
  sku: string;
  plu?: string;
  price: number;
  cost: number;
  tax: number;
  unit: string;
  barcode: string;
  category: string;
  image?: string;
  isWeightProduct?: boolean;
}

export const scaleProducts: ScaleProduct[] = [];

let activeScalePrefix = '20';

export function setScalePrefix(prefix: string): void {
  if (prefix && prefix.trim().length === 2) {
    activeScalePrefix = prefix.trim();
  }
}

export function getScalePrefix(): string {
  return activeScalePrefix;
}

export interface ParsedScaleBarcode {
  product: ScaleProduct;
  weight: number;
  price: number;
  total: number;
  isFromEan13: boolean;
}

export interface DecodedVariableWeightBarcode {
  isVariableWeight: boolean;
  plu: string;
  weight: number;
  unit: string;
  rawBarcode: string;
  error?: string;
}

export function validateEan13(code: string): boolean {
  const clean = code.trim();
  if (!/^\d{13}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(clean[12], 10);
}

export function decodeVariableWeightBarcode(
  barcode: string,
  configuredPrefix: string = activeScalePrefix
): DecodedVariableWeightBarcode {
  const clean = barcode.trim();

  // Permite códigos de balanza de 12 o 13 dígitos
  if (!/^\d{12,13}$/.test(clean)) {
    return {
      isVariableWeight: false,
      plu: '',
      weight: 0,
      unit: 'lb',
      rawBarcode: clean,
      error: 'El código de peso debe tener 12 o 13 dígitos numéricos.',
    };
  }

  const prefix = clean.substring(0, 2);
  // Prefijos de balanza válidos en supermercados (20-29 o el configurado)
  const validPrefixes = Array.from(new Set([configuredPrefix, '20', '21', '22', '23', '24', '25', '26', '27', '28', '29']));

  if (!validPrefixes.includes(prefix)) {
    return {
      isVariableWeight: false,
      plu: '',
      weight: 0,
      unit: 'lb',
      rawBarcode: clean,
      error: `El código no corresponde al prefijo de balanza configurado (${configuredPrefix}).`,
    };
  }

  const plu = clean.substring(2, 7); // e.g. "00132"
  const weightRaw = parseInt(clean.substring(7, 12), 10);
  const weight = Math.round((weightRaw / 1000) * 1000) / 1000;

  return {
    isVariableWeight: true,
    plu,
    weight,
    unit: 'lb',
    rawBarcode: clean,
  };
}

export function parseScaleBarcode(code: string, catalog?: ScaleProduct[]): ParsedScaleBarcode | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;

  const productsToSearch = catalog || [];

  const decoded = decodeVariableWeightBarcode(clean);
  if (decoded.isVariableWeight) {
    const plu = decoded.plu;
    const fullPrefix = clean.substring(0, 7);

    const matchedProduct = productsToSearch.find(
      (p) =>
        (p.plu && p.plu === plu) ||
        p.barcode === plu ||
        p.barcode === fullPrefix ||
        p.sku === plu ||
        p.sku === fullPrefix ||
        p.sku.toUpperCase().includes(plu) ||
        (p.barcode && p.barcode.includes(plu))
    );

    if (matchedProduct) {
      const total = Math.round(matchedProduct.price * decoded.weight * 100) / 100;
      return {
        product: matchedProduct,
        weight: decoded.weight,
        price: matchedProduct.price,
        total,
        isFromEan13: true,
      };
    }
  }

  const directMatch = productsToSearch.find(
    (p) => p.barcode === clean || p.sku.toUpperCase() === clean || p.productId === clean
  );
  if (directMatch) {
    const weight = 1.0;
    const total = Math.round(directMatch.price * weight * 100) / 100;
    return { product: directMatch, weight, price: directMatch.price, total, isFromEan13: false };
  }

  return null;
}
