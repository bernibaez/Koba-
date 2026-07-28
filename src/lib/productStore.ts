import { Product as PMProduct, initialProducts } from '@/pages/product-management/components/ProductManagementScreen';

export type ProductItem = PMProduct;

const STORAGE_KEY = 'marketerp_products_store';

export function getStoredProducts(): ProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProducts));
      return initialProducts;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialProducts;
  } catch {
    return initialProducts;
  }
}

export function saveStoredProducts(products: ProductItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function updateProductStockInStore(productIdOrSku: string, deltaQty: number): ProductItem[] {
  const products = getStoredProducts();
  const updated = products.map((p) => {
    if (p.id === productIdOrSku || p.sku === productIdOrSku || p.barcode === productIdOrSku) {
      const newStock = Math.max(0, p.currentStock + deltaQty);
      let stockStatus: 'normal' | 'low' | 'out' = 'normal';
      if (newStock === 0) stockStatus = 'out';
      else if (newStock <= p.minStock) stockStatus = 'low';

      return {
        ...p,
        currentStock: newStock,
        stockStatus,
      };
    }
    return p;
  });
  saveStoredProducts(updated);
  return updated;
}
