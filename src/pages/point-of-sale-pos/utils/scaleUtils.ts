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

export const scaleProducts: ScaleProduct[] = [
  { productId: 'prod-scale-pollo', name: 'Pollo Entero', sku: 'POL-ENT-LB', price: 98, cost: 72, tax: 0, unit: 'Libra', barcode: '2001001', category: 'Carnes' },
  { productId: 'prod-scale-res', name: 'Carne de Res', sku: 'RES-LB', price: 185, cost: 140, tax: 0, unit: 'Libra', barcode: '2001002', category: 'Carnes' },
  { productId: 'prod-scale-queso', name: 'Queso Blanco', sku: 'QUE-BLA-LB', price: 120, cost: 90, tax: 0, unit: 'Libra', barcode: '2001003', category: 'Lácteos' },
  { productId: 'prod-scale-platano', name: 'Plátano Verde', sku: 'PLA-VER-LB', price: 25, cost: 15, tax: 0, unit: 'Libra', barcode: '2001004', category: 'Frutas' },
  { productId: 'prod-scale-cerdo', name: 'Chuleta de Cerdo', sku: 'CER-CHU-LB', price: 160, cost: 120, tax: 0, unit: 'Libra', barcode: '2001005', category: 'Carnes' },
  { productId: 'prod-scale-pescado', name: 'Filete de Mero', sku: 'PES-MER-LB', price: 240, cost: 180, tax: 0, unit: 'Libra', barcode: '2001006', category: 'Carnes' },
];

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

  const productsToSearch = catalog && catalog.length > 0 ? catalog : scaleProducts;

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
