import type { Caja } from '@/types/database';

export type { Caja };

export type CajasFilter = 'all' | 'active' | 'inactive';

export interface CajaFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  es_caja_principal: boolean;
  activa: boolean;
}

export function isCajaActiva(c: Caja): boolean {
  return c.activa ?? c.activo ?? true;
}

export function isCajaPrincipal(c: Caja): boolean {
  return c.es_caja_principal ?? false;
}
