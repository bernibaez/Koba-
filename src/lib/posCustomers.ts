import type { Customer } from '@/pages/point-of-sale-pos/components/POSTerminal';

const STORAGE_KEY = 'mercato_pos_customers';

const DEMO_CUSTOMER_IDS = new Set(['cust-001', 'cust-002', 'cust-003', 'cust-004', 'cust-005']);

export function getPosCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Customer[];
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter((c) => c && !DEMO_CUSTOMER_IDS.has(c.id));
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

export function savePosCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

export function addPosCustomer(input: {
  name: string;
  phone: string;
  credit?: number;
}): Customer {
  const customers = getPosCustomers();
  const customer: Customer = {
    id: `cust-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    credit: Math.max(0, Number(input.credit) || 0),
  };
  const next = [customer, ...customers];
  savePosCustomers(next);
  return customer;
}
