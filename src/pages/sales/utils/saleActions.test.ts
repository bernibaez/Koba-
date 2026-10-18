import { getSaleActions } from './saleActions';
import type { Sale } from '../types';

const baseMockSale: Sale = {
  id: 'sale-1',
  ncf: 'B0200000001',
  kind: 'Factura simple',
  date: '2026-10-18T10:00:00Z',
  client: 'Juan Perez',
  cashier: 'Admin',
  paymentMethod: 'cash',
  subtotal: 1000,
  itbis: 180,
  total: 1180,
  grossProfit: 300,
  status: 'completed',
  items: [],
};

// 1. Completed sale with full permissions:
// Direct: 'print', Menu: 'detail', 'return', 'void' (No 'edit', No 'delete')
const completedActions = getSaleActions(baseMockSale, { canDelete: true, canEdit: true });
console.assert(
  completedActions.direct.some((a) => a.id === 'print'),
  'Completed sale should have direct print action'
);
console.assert(
  completedActions.menu.some((a) => a.id === 'void'),
  'Completed sale should have void in menu if canDelete is true'
);
console.assert(
  completedActions.menu.some((a) => a.id === 'return'),
  'Completed sale should have return in menu'
);
console.assert(
  !completedActions.menu.some((a) => a.id === 'delete'),
  'Fiscal rule: sale with NCF must never have delete'
);
console.assert(
  !completedActions.direct.some((a) => a.id === 'edit'),
  'Fiscal rule: completed sale with NCF must never have edit'
);

// 2. Draft sale (no fiscal NCF):
const draftSale: Sale = {
  ...baseMockSale,
  id: 'sale-2',
  ncf: 'BOR-001',
  kind: 'Borrador',
  status: 'draft',
};

const draftActions = getSaleActions(draftSale, { canEdit: true, canDelete: true });
console.assert(
  draftActions.direct.some((a) => a.id === 'edit'),
  'Draft sale should have direct edit action'
);
console.assert(
  draftActions.menu.some((a) => a.id === 'delete'),
  'Draft sale should have delete action in menu'
);

// 3. Voided sale:
const voidedSale: Sale = {
  ...baseMockSale,
  id: 'sale-3',
  status: 'voided',
};

const voidedActions = getSaleActions(voidedSale, { canEdit: true, canDelete: true });
console.assert(
  voidedActions.direct.some((a) => a.id === 'print'),
  'Voided sale should have direct print action'
);
console.assert(
  !voidedActions.menu.some((a) => a.id === 'void'),
  'Voided sale cannot be voided again'
);
console.assert(
  !voidedActions.menu.some((a) => a.id === 'return'),
  'Voided sale cannot have return'
);

export {};
