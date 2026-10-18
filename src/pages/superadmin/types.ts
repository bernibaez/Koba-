import type { Empresa, Perfil, PlanEmpresa, RolDb } from '@/types/database';
import type { PlanLimites } from '@/services/subscriptionModules.service';

export type SuperAdminViewMode =
  | 'dashboard'
  | 'create_tenant'
  | 'create_user'
  | 'edit_quotas'
  | 'edit_user_modules';

export type SuperAdminTab = 'tenants' | 'users' | 'subscriptions' | 'platform' | 'crm';

export interface ConsumoEmpresaMetric {
  actual: number;
  limite: number;
  porcentaje: number;
  ilimitado: boolean;
}

export interface ConsumoEmpresaData {
  facturasMes: ConsumoEmpresaMetric;
  usuarios: ConsumoEmpresaMetric;
  cajas: ConsumoEmpresaMetric;
}

export type ConsumosEmpresasMap = Record<string, ConsumoEmpresaData>;

export interface FormEmpresaState {
  nombre: string;
  codigo: string;
  razon_social: string;
  rnc: string;
  plan: PlanEmpresa;
  telefono: string;
  correo: string;
  direccion: string;
  limite_usuarios: number;
  limite_sucursales: number;
  limite_cajas: number;
  limite_facturas_mes: number;
  admin_nombre: string;
  admin_correo: string;
  admin_password: string;
}

export interface FormUsuarioState {
  nombre_completo: string;
  correo: string;
  password: string;
  rol: RolDb;
  empresa_id: string;
  es_superadmin: boolean;
  telefono: string;
}

export interface FormLimitesEmpresaState {
  limite_usuarios: number;
  limite_sucursales: number;
  limite_cajas: number;
  limite_facturas_mes: number;
  facturasIlimitadas: boolean;
  usuariosIlimitados: boolean;
  cajasIlimitadas: boolean;
}
