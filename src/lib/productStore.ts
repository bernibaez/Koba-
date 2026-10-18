import { Product as PMProduct } from '@/pages/product-management/components/ProductManagementScreen';
import { isSupabaseConfigured } from '@/services/clienteSupabase';

export type ProductItem = PMProduct;

const STORAGE_KEY = 'mercato_products_store';

const DEMO_PRODUCT_IDS = new Set([
  'prod-001',
  'prod-002',
  'prod-003',
  'prod-004',
  'prod-005',
  'prod-006',
  'prod-007',
  'prod-008',
  'prod-009',
  'prod-010',
  'prod-011',
  'prod-012',
  'prod-00132',
]);

export function getStoredProducts(): ProductItem[] {
  // Con Supabase activo no devolvemos catálogo demo local.
  if (isSupabaseConfigured()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purgar productos simulados de pruebas si quedaron en el almacenamiento local
    const filtered = parsed.filter(
      (p) => p && !DEMO_PRODUCT_IDS.has(p.id) && !String(p.id).startsWith('prod-00')
    );
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

export function saveStoredProducts(products: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function addProductToStore(
  input: Omit<ProductItem, 'id' | 'stockStatus'> & { id?: string }
): ProductItem {
  const products = getStoredProducts();
  const stock = Math.max(0, input.currentStock ?? 0);
  let stockStatus: ProductItem['stockStatus'] = 'normal';
  if (stock === 0) stockStatus = 'out';
  else if (stock <= (input.minStock ?? 10)) stockStatus = 'low';

  const product: ProductItem = {
    id: input.id ?? `prod-${Date.now()}`,
    barcode: input.barcode || `GEN-${Date.now().toString().slice(-8)}`,
    sku: input.sku,
    name: input.name,
    category: input.category || 'General',
    brand: input.brand || '',
    unit: input.unit || 'Unidad',
    supplier: input.supplier || '',
    costPrice: input.costPrice ?? 0,
    salePrice: input.salePrice ?? 0,
    wholesalePrice: input.wholesalePrice ?? input.salePrice ?? 0,
    tax: input.tax ?? 0,
    minStock: input.minStock ?? 10,
    currentStock: stock,
    image: input.image || '',
    expiryDate: input.expiryDate ?? null,
    warranty: input.warranty || 'N/A',
    status: input.status ?? 'active',
    stockStatus,
  };

  saveStoredProducts([product, ...products]);
  return product;
}

export function updateProductStockInStore(productIdOrSku: string, deltaQty: number): ProductItem[] {
  return updateProductPurchaseDataInStore(productIdOrSku, deltaQty);
}

export function updateProductPurchaseDataInStore(
  productIdOrSku: string,
  deltaQty: number,
  newCostPrice?: number,
  newSalePrice?: number
): ProductItem[] {
  const products = getStoredProducts();
  const updated = products.map((p) => {
    if (p.id === productIdOrSku || p.sku === productIdOrSku || p.barcode === productIdOrSku) {
      const rawStock = p.currentStock + deltaQty;
      const newStock = Math.max(0, Math.round(rawStock * 1000) / 1000);
      let stockStatus: 'normal' | 'low' | 'out' = 'normal';
      if (newStock === 0) stockStatus = 'out';
      else if (newStock <= p.minStock) stockStatus = 'low';

      return {
        ...p,
        currentStock: newStock,
        stockStatus,
        ...(newCostPrice !== undefined && newCostPrice > 0 ? { costPrice: newCostPrice } : {}),
        ...(newSalePrice !== undefined && newSalePrice > 0 ? { salePrice: newSalePrice } : {}),
      };
    }
    return p;
  });
  saveStoredProducts(updated);
  return updated;
}

