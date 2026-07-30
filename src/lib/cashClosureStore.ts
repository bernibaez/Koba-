/** Persistence and state management for Daily Cash Closures (Cierre de Caja Diario) */

export type CashClosure = {
  id: string;
  code: string;
  userId: string;
  username: string;
  userName: string;
  openedAt: string; // ISO or YYYY-MM-DD HH:mm
  closedAt: string; // ISO or YYYY-MM-DD HH:mm
  date: string; // YYYY-MM-DD
  cashRegisterId: string;
  cashRegisterLabel: string;
  
  totalSales: number;
  
  totalCash: number;
  totalCard: number;
  cardCount: number;
  
  totalTransfer: number;
  transferCount: number;
  
  totalCheque: number;
  chequeCount: number;

  totalCredit: number;
  creditCount: number;
  
  expectedCash: number;
  countedCash: number;
  difference: number; // countedCash - expectedCash
  
  notes?: string;
};

const STORAGE_KEY = 'marketerp_cash_closures';

const INITIAL_CLOSURES: CashClosure[] = [
  {
    id: 'cc-101',
    code: 'CC-001',
    userId: '2',
    username: 'maria',
    userName: 'María García',
    openedAt: '2026-07-25 08:00',
    closedAt: '2026-07-25 18:30',
    date: '2026-07-25',
    cashRegisterId: '1',
    cashRegisterLabel: 'Caja #1',
    totalSales: 48250.50,
    totalCash: 24500.00,
    totalCard: 15200.50,
    cardCount: 18,
    totalTransfer: 8550.00,
    transferCount: 6,
    totalCheque: 0,
    chequeCount: 0,
    totalCredit: 0,
    creditCount: 0,
    expectedCash: 29500.00, // 5000 base + 24500 cash sales
    countedCash: 29500.00,
    difference: 0,
    notes: 'Cierre sin novedades',
  },
  {
    id: 'cc-102',
    code: 'CC-002',
    userId: '3',
    username: 'carlos',
    userName: 'Carlos López',
    openedAt: '2026-07-25 08:15',
    closedAt: '2026-07-25 17:45',
    date: '2026-07-25',
    cashRegisterId: '2',
    cashRegisterLabel: 'Caja #2',
    totalSales: 32400.00,
    totalCash: 18200.00,
    totalCard: 9800.00,
    cardCount: 12,
    totalTransfer: 4400.00,
    transferCount: 3,
    totalCheque: 0,
    chequeCount: 0,
    totalCredit: 0,
    creditCount: 0,
    expectedCash: 22200.00, // 4000 base + 18200 cash sales
    countedCash: 22150.00,
    difference: -50.00,
    notes: 'Diferencia menor en monedas',
  },
];

export function getCashClosures(): CashClosure[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLOSURES));
      return INITIAL_CLOSURES;
    }
    return JSON.parse(raw) as CashClosure[];
  } catch {
    return INITIAL_CLOSURES;
  }
}

export function saveCashClosure(closure: CashClosure): CashClosure[] {
  const current = getCashClosures();
  const updated = [closure, ...current.filter((c) => c.id !== closure.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
