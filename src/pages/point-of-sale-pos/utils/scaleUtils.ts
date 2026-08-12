export interface ScaleProduct {
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  tax: number;
  unit: string;
  barcode: string;
  category: string;
  image?: string;
}

export const scaleProducts: ScaleProduct[] = [];

export interface ParsedScaleBarcode {
  product: ScaleProduct;
  weight: number;
  price: number;
  total: number;
  isFromEan13: boolean;
}

export function parseScaleBarcode(code: string, catalog?: ScaleProduct[]): ParsedScaleBarcode | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;

  const productsToSearch = catalog || [];

  // 1. Direct match by barcode or SKU or ID
  const directMatch = productsToSearch.find(
    (p) => p.barcode === clean || p.sku.toUpperCase() === clean || p.productId === clean
  );
  if (directMatch) {
    const weight = 1.0;
    const total = Math.round(directMatch.price * weight * 100) / 100;
    return { product: directMatch, weight, price: directMatch.price, total, isFromEan13: false };
  }

  // 2. Check 13-digit EAN scale barcode starting with 20, 21 or 22
  // Format: 20 + 5 digits item barcode + 5 digits weight (thousandths) + 1 check digit
  // Example: 2001001015004 -> item "2001001", weight 01500 -> 1.500 lbs
  if ((clean.startsWith('20') || clean.startsWith('21') || clean.startsWith('22')) && clean.length === 13) {
    const itemCode = clean.substring(0, 7); // e.g. 2001001
    const shortCode = clean.substring(2, 7); // e.g. 01001
    const weightRaw = parseInt(clean.substring(7, 12), 10);
    const matchedProduct = productsToSearch.find(
      (p) =>
        p.barcode === itemCode ||
        p.barcode === shortCode ||
        p.barcode === clean.substring(0, 6) ||
        (p.barcode && clean.includes(p.barcode))
    );

    if (matchedProduct && !isNaN(weightRaw)) {
      const weight = weightRaw / 1000;
      const validWeight = weight > 0 ? weight : 1.0;
      const total = Math.round(matchedProduct.price * validWeight * 100) / 100;
      return {
        product: matchedProduct,
        weight: validWeight,
        price: matchedProduct.price,
        total,
        isFromEan13: true,
      };
    }
  }

  return null;
}
