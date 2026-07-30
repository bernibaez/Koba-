import { getStoredProducts, updateProductStockInStore, ProductItem } from './productStore';

export interface StockAdjustmentItem {
  id: string;
  code: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  type: 'entrada' | 'salida' | 'perdida';
  previousQty: number;
  newQty: number;
  qty: number; // Variación absoluta
  reason: string;
  date: string;
  time: string;
  responsible: string;
}

const STORAGE_KEY = 'marketerp_stock_adjustments';

export const INITIAL_ADJUSTMENTS: StockAdjustmentItem[] = [
  { id: '1', code: 'AJU-001', productId: 'prod-001', productName: 'Arroz Selecto 5lb', sku: 'ARR-SEL-5LB', category: 'Granos', type: 'entrada', previousQty: 74, newQty: 124, qty: 50, reason: 'Inventario inicial de almacén', date: '2026-07-28', time: '09:30', responsible: 'Admin General' },
  { id: '2', code: 'AJU-002', productId: 'prod-002', sku: 'ACE-VEG-1L', productName: 'Aceite Vegetal 1L', category: 'Granos', type: 'salida', previousQty: 13, newQty: 8, qty: 5, reason: 'Productos dañados en empaque', date: '2026-07-29', time: '14:15', responsible: 'Carlos López' },
  { id: '3', code: 'AJU-003', productId: 'prod-009', sku: 'LEC-PAS-1L', productName: 'Leche Pasteurizada 1L', category: 'Lácteos', type: 'perdida', previousQty: 3, newQty: 0, qty: 3, reason: 'Vencimiento de lote', date: '2026-07-30', time: '08:45', responsible: 'María García' },
  { id: '4', code: 'AJU-004', productId: 'prod-005', sku: 'AZU-BLA-5LB', productName: 'Azúcar Blanca 5lb', category: 'Granos', type: 'entrada', previousQty: 60, newQty: 160, qty: 100, reason: 'Corrección por conteo físico', date: '2026-07-30', time: '10:20', responsible: 'Admin General' },
];

export function getStoredAdjustments(): StockAdjustmentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADJUSTMENTS));
      return INITIAL_ADJUSTMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ADJUSTMENTS;
  } catch {
    return INITIAL_ADJUSTMENTS;
  }
}

export function saveStoredAdjustments(adjustments: StockAdjustmentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adjustments));
  } catch (e) {
    console.error('Error writing stock adjustments to localStorage', e);
  }
}

export function createBlockStockAdjustment(
  adjustmentsToApply: {
    product: ProductItem;
    newQty: number;
    reason: string;
  }[],
  responsibleUser: string = 'Admin General'
): StockAdjustmentItem[] {
  const currentHistory = getStoredAdjustments();
  const newEntries: StockAdjustmentItem[] = [];
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);

  adjustmentsToApply.forEach((adj, index) => {
    const delta = adj.newQty - adj.product.currentStock;
    if (delta === 0) return; // No change

    const type: 'entrada' | 'salida' | 'perdida' = delta > 0 ? 'entrada' : (adj.reason.toLowerCase().includes('perd') || adj.reason.toLowerCase().includes('venc') ? 'perdida' : 'salida');
    const seq = String(currentHistory.length + newEntries.length + 1).padStart(3, '0');

    const entry: StockAdjustmentItem = {
      id: `adj-${Date.now()}-${index}`,
      code: `AJU-${seq}`,
      productId: adj.product.id,
      productName: adj.product.name,
      sku: adj.product.sku,
      category: adj.product.category,
      type,
      previousQty: adj.product.currentStock,
      newQty: adj.newQty,
      qty: Math.abs(delta),
      reason: adj.reason || 'Ajuste de inventario en bloque',
      date: dateStr,
      time: timeStr,
      responsible: responsibleUser,
    };

    // Update stock in product store
    updateProductStockInStore(adj.product.id, delta);
    newEntries.push(entry);
  });

  const updatedHistory = [...newEntries, ...currentHistory];
  saveStoredAdjustments(updatedHistory);
  return updatedHistory;
}
