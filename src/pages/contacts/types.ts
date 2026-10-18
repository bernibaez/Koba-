import type { TipoCliente } from '@/types/database';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  credit: number;
  purchases: number;
  balance: number;
  status: 'active' | 'inactive';
  group: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contact: string;
  purchases: number;
  balance: number;
  status: 'active' | 'inactive';
}

export interface CustomerGroup {
  id: string;
  nombre: string;
  porcentaje_descuento: number;
  descripcion: string | null;
  clientes_count?: number;
}

export type ContactsTab = 'customers' | 'suppliers' | 'groups';
export type FormMode = 'create' | 'edit' | 'view';

export interface DeleteTarget {
  type: 'customer' | 'supplier' | 'group';
  id: string;
  name: string;
}

export const TIPO_CLIENTE_OPTIONS: { value: TipoCliente; label: string }[] = [
  { value: 'final', label: 'Consumidor Final' },
  { value: 'fiscal', label: 'Crédito Fiscal' },
  { value: 'credito', label: 'Cliente a Crédito' },
];
