import type { PlanEmpresa, Empresa } from '@/types/database';
import { tryGetSupabase, isSupabaseConfigured } from './clienteSupabase';
import { getStoredUser, AUTH_ACCOUNTS } from '@/lib/auth';
import { listarEmpresas } from './empresas.service';

export interface AppModuleDef {
  id: string;
  label: string;
  href: string;
  group: 'Principal' | 'Operaciones' | 'Inventario' | 'CRM' | 'Finanzas' | 'Análisis' | 'Configuración';
  description: string;
  recommendedFor: PlanEmpresa[];
}

export const ALL_APP_MODULES: AppModuleDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard & Métricas',
    href: '/',
    group: 'Principal',
    description: 'Resumen ejecutivo, ventas del día y KPIs principales',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'pos',
    label: 'Punto de Venta (POS)',
    href: '/point-of-sale-pos',
    group: 'Principal',
    description: 'Terminal de facturación rápida, escáner y cobro',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'sales',
    label: 'Ventas & Cotizaciones',
    href: '/sales',
    group: 'Operaciones',
    description: 'Historial de facturas, cotizaciones y emisión de comprobantes',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'purchases',
    label: 'Compras & Proveedores',
    href: '/purchases',
    group: 'Operaciones',
    description: 'Recepción de mercancía, órdenes de compra y gastos a suplidores',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
  {
    id: 'returns',
    label: 'Devoluciones',
    href: '/returns-history',
    group: 'Operaciones',
    description: 'Control de notas de crédito y devoluciones de clientes',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
  {
    id: 'products',
    label: 'Productos & Catálogo',
    href: '/product-management',
    group: 'Inventario',
    description: 'Precios, códigos de barra, categorías y stock',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'combos',
    label: 'Combos & Paquetes',
    href: '/combos',
    group: 'Inventario',
    description: 'Kits y combos promocionales con descuento',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
  {
    id: 'stock-transfers',
    label: 'Transferencias de Stock',
    href: '/stock-transfers',
    group: 'Inventario',
    description: 'Traspasos entre almacenes y sucursales',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'stock-adjustments',
    label: 'Ajustes de Inventario',
    href: '/stock-adjustments',
    group: 'Inventario',
    description: 'Entradas, mermas, pérdidas y recuentos físicos',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'cajas',
    label: 'Cajas Registradoras',
    href: '/cajas',
    group: 'Finanzas',
    description: 'Administración de cajas físicas y terminales',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'contacts',
    label: 'Contactos & Directorio',
    href: '/contacts',
    group: 'CRM',
    description: 'Base de datos de clientes, proveedores y grupos fiscales',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'crm',
    label: 'CRM Ventas & Pipeline',
    href: '/crm',
    group: 'CRM',
    description: 'Embudos de ventas, prospectos, tareas y expedientes 360°',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'cash-closure',
    label: 'Cierre de Caja & Arqueo',
    href: '/cash-closure',
    group: 'Finanzas',
    description: 'Aperturas de turno, cuadres ciegos y remesas',
    recommendedFor: ['free', 'starter', 'pro', 'enterprise'],
  },
  {
    id: 'maleta',
    label: 'Maleta / Carnes & Merma',
    href: '/maleta',
    group: 'Finanzas',
    description: 'Rendimiento de cortes de carne y peso variable',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'expenses',
    label: 'Control de Gastos',
    href: '/expenses',
    group: 'Finanzas',
    description: 'Gastos fijos, viáticos y salidas operativas de caja',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
  {
    id: 'accounts-receivable',
    label: 'Cuentas por Cobrar (CxC)',
    href: '/accounts-receivable',
    group: 'Finanzas',
    description: 'Gestión de créditos a clientes, vencimientos y abonos',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'accounts-payable',
    label: 'Cuentas por Pagar (CxP)',
    href: '/accounts-payable',
    group: 'Finanzas',
    description: 'Facturas pendientes a proveedores y programación de pagos',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'reports',
    label: 'Informes & Reportes',
    href: '/reports',
    group: 'Análisis',
    description: 'Estados de resultados, ventas por vendedor y exportación PDF/Excel',
    recommendedFor: ['pro', 'enterprise'],
  },
  {
    id: 'audit',
    label: 'Auditoría & Trazabilidad',
    href: '/audit',
    group: 'Configuración',
    description: 'Registro forense de accesos, modificaciones y eliminaciones',
    recommendedFor: ['enterprise'],
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios',
    href: '/users',
    group: 'Configuración',
    description: 'Roles, empleados, cajeros y permisos de la sucursal',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
  {
    id: 'settings',
    label: 'Configuración General',
    href: '/settings',
    group: 'Configuración',
    description: 'Datos fiscales RNC, ITBIS, tickets e impresoras térmicas',
    recommendedFor: ['starter', 'pro', 'enterprise'],
  },
];

export const DEFAULT_PLAN_MODULES: Record<PlanEmpresa, string[]> = {
  free: [
    'dashboard',
    'pos',
    'sales',
    'products',
    'cajas',
    'contacts',
    'cash-closure',
  ],
  starter: [
    'dashboard',
    'pos',
    'sales',
    'purchases',
    'returns',
    'products',
    'combos',
    'cajas',
    'contacts',
    'cash-closure',
    'expenses',
    'users',
    'settings',
  ],
  pro: [
    'dashboard',
    'pos',
    'sales',
    'purchases',
    'returns',
    'products',
    'combos',
    'stock-transfers',
    'stock-adjustments',
    'cajas',
    'contacts',
    'crm',
    'cash-closure',
    'maleta',
    'expenses',
    'accounts-receivable',
    'accounts-payable',
    'reports',
    'users',
    'settings',
  ],
  enterprise: ALL_APP_MODULES.map((m) => m.id),
};

export interface PlanInfo {
  id: PlanEmpresa;
  name: string;
  price: string;
  badge: string;
  desc: string;
}

export const DEFAULT_PLANS_INFO: Record<PlanEmpresa, PlanInfo> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '0 $',
    badge: '7 módulos',
    desc: 'Caja rápida, ventas básicas y catálogo indispensable',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: '29 $',
    badge: '13 módulos',
    desc: 'Compras, combos y control de gastos',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '79 $',
    badge: '20 módulos · Popular',
    desc: 'CRM, CxC, CxP, stock multi-sucursal y facturación',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Desde 199 $',
    badge: '21 módulos',
    desc: 'Auditoría integral, integración API sin límites y soporte prioritario',
  },
};

const STORAGE_PLANS_INFO = 'koba_subscription_plans_info_v2';
const STORAGE_MODULES_CUSTOMIZATION = 'koba_modules_custom_names_v2';

/**
 * Obtiene la metadata editable de los planes (nombres, precios, etiquetas, descripciones)
 */
export function obtenerInfoPlanes(): Record<PlanEmpresa, PlanInfo> {
  try {
    const raw = localStorage.getItem(STORAGE_PLANS_INFO);
    if (!raw) return { ...DEFAULT_PLANS_INFO };
    const parsed = JSON.parse(raw);
    return {
      free: parsed.free ? { ...DEFAULT_PLANS_INFO.free, ...parsed.free } : DEFAULT_PLANS_INFO.free,
      starter: parsed.starter ? { ...DEFAULT_PLANS_INFO.starter, ...parsed.starter } : DEFAULT_PLANS_INFO.starter,
      pro: parsed.pro ? { ...DEFAULT_PLANS_INFO.pro, ...parsed.pro } : DEFAULT_PLANS_INFO.pro,
      enterprise: parsed.enterprise ? { ...DEFAULT_PLANS_INFO.enterprise, ...parsed.enterprise } : DEFAULT_PLANS_INFO.enterprise,
    };
  } catch {
    return { ...DEFAULT_PLANS_INFO };
  }
}

/**
 * Guarda la metadata editable de los planes
 */
export function guardarInfoPlanes(info: Record<PlanEmpresa, PlanInfo>): void {
  try {
    localStorage.setItem(STORAGE_PLANS_INFO, JSON.stringify(info));
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
    void sincronizarConfiguracionPlanesEnSupabase();
  } catch (e) {
    console.error('Error al guardar información de planes:', e);
  }
}

/**
 * Actualiza los datos de un plan en específico (nombre, precio, badge, desc)
 */
export function actualizarInfoPlan(planId: PlanEmpresa, cambios: Partial<PlanInfo>): Record<PlanEmpresa, PlanInfo> {
  const actual = obtenerInfoPlanes();
  actual[planId] = {
    ...actual[planId],
    ...cambios,
    id: planId,
  };
  guardarInfoPlanes(actual);
  return actual;
}

/**
 * Obtiene nombres y descripciones personalizadas de módulos
 */
export function obtenerNombresModulosPersonalizados(): Record<string, { label?: string; description?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_MODULES_CUSTOMIZATION);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Guarda personalizaciones de nombres de módulos
 */
export function guardarNombresModulosPersonalizados(customMap: Record<string, { label?: string; description?: string }>): void {
  try {
    localStorage.setItem(STORAGE_MODULES_CUSTOMIZATION, JSON.stringify(customMap));
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
    void sincronizarConfiguracionPlanesEnSupabase();
  } catch (e) {
    console.error('Error guardando personalización de módulos:', e);
  }
}

/**
 * Actualiza el nombre o descripción de un módulo específico
 */
export function actualizarDatosModulo(moduleId: string, data: { label?: string; description?: string }): void {
  const current = obtenerNombresModulosPersonalizados();
  current[moduleId] = {
    ...current[moduleId],
    ...data,
  };
  guardarNombresModulosPersonalizados(current);
}

/**
 * Retorna la lista de módulos incorporando las personalizaciones de nombres y descripciones
 */
export function obtenerModulosConPersonalizacion(): AppModuleDef[] {
  const customMap = obtenerNombresModulosPersonalizados();
  return ALL_APP_MODULES.map((m) => {
    const custom = customMap[m.id];
    if (!custom) return m;
    return {
      ...m,
      label: custom.label || m.label,
      description: custom.description || m.description,
    };
  });
}

const STORAGE_PLAN_MODULES = 'koba_subscription_plan_modules_v2';
const STORAGE_USER_OVERRIDES = 'koba_user_custom_modules_overrides_v2';
const STORAGE_SIMULATED_PLAN = 'koba_simulated_subscription_plan_v2';

/**
 * Obtiene el plan simulado actualmente activo (para pruebas o previsualizaciones)
 */
export function obtenerPlanSimulado(): PlanEmpresa | null {
  try {
    const val = localStorage.getItem(STORAGE_SIMULATED_PLAN);
    if (val && ['free', 'starter', 'pro', 'enterprise'].includes(val)) {
      return val as PlanEmpresa;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Activa o desactiva la simulación de un plan específico
 */
export function establecerPlanSimulado(plan: PlanEmpresa | null): void {
  try {
    if (!plan) {
      localStorage.removeItem(STORAGE_SIMULATED_PLAN);
    } else {
      localStorage.setItem(STORAGE_SIMULATED_PLAN, plan);
    }
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
  } catch (e) {
    console.error('Error al guardar plan simulado:', e);
  }
}

/**
 * Retorna true si el usuario actual está en modo simulación de plan
 */
export function esModoSimulacionPlan(): boolean {
  return obtenerPlanSimulado() !== null;
}

/**
 * Obtiene la configuración de módulos por plan (persistencia local con defaults)
 */
export function obtenerConfiguracionModulosPlanes(): Record<PlanEmpresa, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_PLAN_MODULES);
    if (!raw) return { ...DEFAULT_PLAN_MODULES };
    const parsed = JSON.parse(raw);
    return {
      free: Array.isArray(parsed.free) ? parsed.free : DEFAULT_PLAN_MODULES.free,
      starter: Array.isArray(parsed.starter) ? parsed.starter : DEFAULT_PLAN_MODULES.starter,
      pro: Array.isArray(parsed.pro) ? parsed.pro : DEFAULT_PLAN_MODULES.pro,
      enterprise: Array.isArray(parsed.enterprise) ? parsed.enterprise : DEFAULT_PLAN_MODULES.enterprise,
    };
  } catch {
    return { ...DEFAULT_PLAN_MODULES };
  }
}

/**
 * Guarda la configuración de módulos por plan
 */
export function guardarConfiguracionModulosPlanes(config: Record<PlanEmpresa, string[]>): void {
  try {
    localStorage.setItem(STORAGE_PLAN_MODULES, JSON.stringify(config));
    // Disparar evento para que Sidebar y ProtectedRoute se actualicen de inmediato
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
    void sincronizarConfiguracionPlanesEnSupabase();
  } catch (e) {
    console.error('Error al guardar configuración de módulos por plan:', e);
  }
}

/**
 * Obtiene los módulos personalizados para un usuario (null si hereda de su plan)
 */
export function obtenerModulosPersonalizadosUsuario(userId: string): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_OVERRIDES);
    if (!raw) return null;
    const map: Record<string, string[]> = JSON.parse(raw);
    return map[userId] ?? null;
  } catch {
    return null;
  }
}

/**
 * Guarda los módulos personalizados para un usuario (pasar null para heredar del plan)
 */
export function guardarModulosPersonalizadosUsuario(userId: string, modules: string[] | null): void {
  try {
    const raw = localStorage.getItem(STORAGE_USER_OVERRIDES);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    if (modules === null) {
      delete map[userId];
    } else {
      map[userId] = modules;
    }
    localStorage.setItem(STORAGE_USER_OVERRIDES, JSON.stringify(map));
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
    void sincronizarConfiguracionPlanesEnSupabase();
  } catch (e) {
    console.error('Error al guardar personalización de módulos del usuario:', e);
  }
}

/**
 * Obtiene la lista de IDs de módulos que un usuario tiene activos según su plan o personalización
 */
export function obtenerModulosActivosUsuario(user: {
  id?: string;
  isSuperAdmin?: boolean;
  empresaPlan?: PlanEmpresa;
} | null): string[] {
  if (!user) return [];

  // 1. Si está activo el modo simulación, aplicar el plan simulado estrictamente
  const planSimulado = obtenerPlanSimulado();
  if (planSimulado) {
    const planConfig = obtenerConfiguracionModulosPlanes();
    return planConfig[planSimulado] || DEFAULT_PLAN_MODULES[planSimulado] || DEFAULT_PLAN_MODULES.free;
  }

  // 2. SuperAdmin real sin simulación: tiene habilitado Dashboard y CRM
  if (user.isSuperAdmin) {
    return ['dashboard', 'crm'];
  }

  // 3. Si tiene personalización individual por usuario, prevalece
  if (user.id) {
    const override = obtenerModulosPersonalizadosUsuario(user.id);
    if (override && Array.isArray(override)) {
      return override;
    }
  }

  // 4. Módulos asignados al Plan de la Empresa
  const plan = user.empresaPlan || 'free';
  const planConfig = obtenerConfiguracionModulosPlanes();
  return planConfig[plan] || DEFAULT_PLAN_MODULES[plan] || DEFAULT_PLAN_MODULES.free;
}

/**
 * Retorna el primer módulo habilitado para un usuario (ideal para redirecciones limpias)
 */
export function obtenerPrimerModuloHabilitado(user: {
  id?: string;
  isSuperAdmin?: boolean;
  empresaPlan?: PlanEmpresa;
} | null): AppModuleDef | null {
  const activeIds = obtenerModulosActivosUsuario(user);
  if (!activeIds || activeIds.length === 0) return null;
  return ALL_APP_MODULES.find((m) => activeIds.includes(m.id)) || null;
}

/**
 * Verifica si un usuario puede acceder a una ruta o módulo según su suscripción
 */
export function puedeUsuarioAccederModulo(
  user: {
    id?: string;
    isSuperAdmin?: boolean;
    empresaPlan?: PlanEmpresa;
  } | null,
  routeOrId: string
): boolean {
  if (!user) return false;

  // Ruta pública de autenticación
  if (routeOrId === '/login') return true;

  const isSimulating = esModoSimulacionPlan();

  // SuperAdmin sin simulación: acceso a Dashboard, CRM y consola SuperAdmin
  if (user.isSuperAdmin && !isSimulating) {
    return (
      routeOrId === '/' ||
      routeOrId === '/superadmin' ||
      routeOrId === '/crm' ||
      routeOrId === 'dashboard' ||
      routeOrId === 'crm' ||
      routeOrId === 'nav-dashboard' ||
      routeOrId === 'nav-crm' ||
      routeOrId === 'nav-superadmin'
    );
  }

  // Rutas exclusivas de plataforma / SuperAdmin: denegar estrictamente a usuarios de planes o durante simulación
  if (
    routeOrId === '/superadmin' ||
    routeOrId === 'superadmin' ||
    routeOrId === 'nav-superadmin'
  ) {
    return false;
  }

  const activeModules = obtenerModulosActivosUsuario(user);

  // Buscar módulo por ID exacto o por coincidencia de ruta
  const moduleMatch = ALL_APP_MODULES.find((m) => {
    if (m.id === routeOrId) return true;
    if (m.href === routeOrId) return true;
    if (routeOrId === '/' && m.href === '/') return true;
    if (m.href !== '/' && (routeOrId === m.href || routeOrId.startsWith(m.href + '/') || routeOrId.startsWith(m.href + '?'))) return true;
    return false;
  });

  if (!moduleMatch) {
    // Si la ruta no está registrada en el catálogo, permitir
    return true;
  }

  return activeModules.includes(moduleMatch.id);
}

/* ==============================================================================
   CONTROL DE CUOTAS Y LÍMITES OPERATIVOS (Facturas/Mes, Usuarios, Cajas)
   ============================================================================== */

export interface PlanLimites {
  limite_facturas_mes: number; // -1 = ilimitado
  limite_usuarios: number;      // -1 = ilimitado
  limite_cajas: number;         // -1 = ilimitado
}

export const DEFAULT_PLAN_LIMITES: Record<PlanEmpresa, PlanLimites> = {
  free: {
    limite_facturas_mes: 100,
    limite_usuarios: 2,
    limite_cajas: 1,
  },
  starter: {
    limite_facturas_mes: 500,
    limite_usuarios: 5,
    limite_cajas: 2,
  },
  pro: {
    limite_facturas_mes: 2500,
    limite_usuarios: 15,
    limite_cajas: 5,
  },
  enterprise: {
    limite_facturas_mes: -1, // Ilimitado
    limite_usuarios: -1,     // Ilimitado
    limite_cajas: -1,        // Ilimitado
  },
};

const STORAGE_PLAN_LIMITES = 'koba_subscription_plan_limites_v2';

/**
 * Obtiene la configuración de cuotas y límites por plan (persistencia local con defaults)
 */
export function obtenerConfiguracionLimitesPlanes(): Record<PlanEmpresa, PlanLimites> {
  try {
    const raw = localStorage.getItem(STORAGE_PLAN_LIMITES);
    if (!raw) return { ...DEFAULT_PLAN_LIMITES };
    const parsed = JSON.parse(raw);
    return {
      free: parsed.free ? { ...DEFAULT_PLAN_LIMITES.free, ...parsed.free } : DEFAULT_PLAN_LIMITES.free,
      starter: parsed.starter ? { ...DEFAULT_PLAN_LIMITES.starter, ...parsed.starter } : DEFAULT_PLAN_LIMITES.starter,
      pro: parsed.pro ? { ...DEFAULT_PLAN_LIMITES.pro, ...parsed.pro } : DEFAULT_PLAN_LIMITES.pro,
      enterprise: parsed.enterprise ? { ...DEFAULT_PLAN_LIMITES.enterprise, ...parsed.enterprise } : DEFAULT_PLAN_LIMITES.enterprise,
    };
  } catch {
    return { ...DEFAULT_PLAN_LIMITES };
  }
}

/**
 * Guarda la configuración de cuotas y límites por plan
 */
export function guardarConfiguracionLimitesPlanes(config: Record<PlanEmpresa, PlanLimites>): void {
  try {
    localStorage.setItem(STORAGE_PLAN_LIMITES, JSON.stringify(config));
    window.dispatchEvent(new Event('koba_subscription_config_changed'));
    void sincronizarConfiguracionPlanesEnSupabase();
  } catch (e) {
    console.error('Error al guardar configuración de límites por plan:', e);
  }
}

/**
 * Obtiene los límites efectivos para una empresa, respetando overrides individuales
 * o recurriendo a los límites base del plan asignado.
 */
export function obtenerLimitesEfectivosEmpresa(empresa: Partial<Empresa> | null | undefined): PlanLimites {
  const plan = empresa?.plan || 'pro';
  const planConfig = obtenerConfiguracionLimitesPlanes();
  const planLimites = planConfig[plan] || DEFAULT_PLAN_LIMITES[plan] || DEFAULT_PLAN_LIMITES.pro;

  return {
    limite_facturas_mes:
      empresa?.limite_facturas_mes !== undefined && empresa?.limite_facturas_mes !== null
        ? empresa.limite_facturas_mes
        : planLimites.limite_facturas_mes,
    limite_usuarios:
      empresa?.limite_usuarios !== undefined && empresa?.limite_usuarios !== null
        ? empresa.limite_usuarios
        : planLimites.limite_usuarios,
    limite_cajas:
      empresa?.limite_cajas !== undefined && empresa?.limite_cajas !== null
        ? empresa.limite_cajas
        : planLimites.limite_cajas,
  };
}

/**
 * Cuenta las facturas emitidas por la empresa en el mes calendario actual.
 */
export async function contarFacturasMesActual(empresaId?: string | null): Promise<number> {
  if (!empresaId) return 0;
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { count, error } = await sb
        .from('ventas')
        .select('id', { count: 'exact', head: true })
        .gte('creado_en', primerDiaMes)
        .eq('empresa_id', empresaId);

      if (!error && count !== null) {
        return count;
      }
    } catch {
      // fallback local
    }
  }

  // Fallback a localStorage de ventas estrictamente filtrado por empresa_id
  try {
    const raw = localStorage.getItem('mercato_ventas_local');
    if (!raw) return 0;
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return 0;

    const fechaCorte = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return lista.filter((v: any) => {
      if (v.empresa_id !== empresaId) return false;
      const fechaVenta = v.creado_en ? new Date(v.creado_en).getTime() : 0;
      return fechaVenta >= fechaCorte;
    }).length;
  } catch {
    return 0;
  }
}

/**
 * Cuenta los usuarios activos de una empresa.
 */
export async function contarUsuariosActivos(empresaId?: string | null): Promise<number> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      let query = sb
        .from('perfiles')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { count, error } = await query;
      if (!error && count !== null) {
        return count;
      }
    } catch {
      // fallback local
    }
  }

  // Fallback local
  if (empresaId) {
    return AUTH_ACCOUNTS.filter((u) => u.empresaId === empresaId && u.status === 'active').length;
  }
  return AUTH_ACCOUNTS.filter((u) => u.status === 'active').length;
}

/**
 * Cuenta las cajas registradoras activas de una empresa.
 */
export async function contarCajasActivas(empresaId?: string | null): Promise<number> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      let query = sb
        .from('cajas')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { count, error } = await query;
      if (!error && count !== null) {
        return count;
      }
    } catch {
      // fallback local
    }
  }

  // Fallback local
  try {
    const raw = localStorage.getItem('mercato_local_cajas');
    if (!raw) return 4;
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return 4;
    return lista.filter((c: any) => c.activa !== false && c.activo !== false).length;
  } catch {
    return 4;
  }
}

/**
 * Obtiene el resumen consolidado de consumo de cuotas (porcentajes, actuales y límites) para una empresa.
 */
export async function obtenerConsumoLimitesEmpresa(empresa: Partial<Empresa>): Promise<{
  facturasMes: { actual: number; limite: number; porcentaje: number; ilimitado: boolean };
  usuarios: { actual: number; limite: number; porcentaje: number; ilimitado: boolean };
  cajas: { actual: number; limite: number; porcentaje: number; ilimitado: boolean };
}> {
  const limites = obtenerLimitesEfectivosEmpresa(empresa);
  const [actualFacturas, actualUsuarios, actualCajas] = await Promise.all([
    contarFacturasMesActual(empresa.id),
    contarUsuariosActivos(empresa.id),
    contarCajasActivas(empresa.id),
  ]);

  const calcPorcentaje = (actual: number, limite: number) => {
    if (limite <= 0) return 0;
    return Math.min(100, Math.round((actual / limite) * 100));
  };

  return {
    facturasMes: {
      actual: actualFacturas,
      limite: limites.limite_facturas_mes,
      porcentaje: calcPorcentaje(actualFacturas, limites.limite_facturas_mes),
      ilimitado: limites.limite_facturas_mes === -1,
    },
    usuarios: {
      actual: actualUsuarios,
      limite: limites.limite_usuarios,
      porcentaje: calcPorcentaje(actualUsuarios, limites.limite_usuarios),
      ilimitado: limites.limite_usuarios === -1,
    },
    cajas: {
      actual: actualCajas,
      limite: limites.limite_cajas,
      porcentaje: calcPorcentaje(actualCajas, limites.limite_cajas),
      ilimitado: limites.limite_cajas === -1,
    },
  };
}

/**
 * Verifica si se puede emitir una nueva factura según la cuota mensual del negocio.
 */
export async function verificarLimiteFacturasMes(empresaId?: string | null): Promise<{
  permitido: boolean;
  actual: number;
  limite: number;
  restantes: number;
  mensaje?: string;
}> {
  const user = getStoredUser();
  if (user?.isSuperAdmin) {
    return { permitido: true, actual: 0, limite: -1, restantes: Infinity };
  }

  const targetEmpresaId = empresaId || user?.empresaId;
  let targetEmpresa: Partial<Empresa> | undefined;

  if (targetEmpresaId) {
    try {
      const empresas = await listarEmpresas();
      targetEmpresa = empresas.find((e) => e.id === targetEmpresaId);
    } catch {
      // noop
    }
  }

  const limites = obtenerLimitesEfectivosEmpresa(
    targetEmpresa || { plan: user?.empresaPlan || 'pro' }
  );

  if (limites.limite_facturas_mes === -1) {
    return { permitido: true, actual: 0, limite: -1, restantes: Infinity };
  }

  const actual = await contarFacturasMesActual(targetEmpresaId);
  const restantes = Math.max(0, limites.limite_facturas_mes - actual);

  if (actual >= limites.limite_facturas_mes) {
    return {
      permitido: false,
      actual,
      limite: limites.limite_facturas_mes,
      restantes: 0,
      mensaje: `Has alcanzado el límite mensual de ${limites.limite_facturas_mes} facturas/ventas para tu plan (${actual}/${limites.limite_facturas_mes}). Mejora tu suscripción para seguir facturando este mes.`,
    };
  }

  return {
    permitido: true,
    actual,
    limite: limites.limite_facturas_mes,
    restantes,
  };
}

/**
 * Verifica si se puede dar de alta un nuevo usuario según la cuota del negocio.
 */
export async function verificarLimiteUsuarios(empresaId?: string | null): Promise<{
  permitido: boolean;
  actual: number;
  limite: number;
  restantes: number;
  mensaje?: string;
}> {
  const user = getStoredUser();
  const targetEmpresaId = empresaId || user?.empresaId;
  let targetEmpresa: Partial<Empresa> | undefined;

  if (targetEmpresaId) {
    try {
      const empresas = await listarEmpresas();
      targetEmpresa = empresas.find((e) => e.id === targetEmpresaId);
    } catch {
      // noop
    }
  }

  const limites = obtenerLimitesEfectivosEmpresa(
    targetEmpresa || { plan: user?.empresaPlan || 'pro' }
  );

  if (limites.limite_usuarios === -1) {
    return { permitido: true, actual: 0, limite: -1, restantes: Infinity };
  }

  const actual = await contarUsuariosActivos(targetEmpresaId);
  const restantes = Math.max(0, limites.limite_usuarios - actual);

  if (actual >= limites.limite_usuarios) {
    return {
      permitido: false,
      actual,
      limite: limites.limite_usuarios,
      restantes: 0,
      mensaje: `Has alcanzado el límite de ${limites.limite_usuarios} usuarios activos permitidos (${actual}/${limites.limite_usuarios}). Mejora el plan de suscripción para habilitar más cuentas.`,
    };
  }

  return {
    permitido: true,
    actual,
    limite: limites.limite_usuarios,
    restantes,
  };
}

/**
 * Verifica si se puede crear una nueva caja registradora según la cuota del negocio.
 */
export async function verificarLimiteCajas(empresaId?: string | null): Promise<{
  permitido: boolean;
  actual: number;
  limite: number;
  restantes: number;
  mensaje?: string;
}> {
  const user = getStoredUser();
  if (user?.isSuperAdmin) {
    return { permitido: true, actual: 0, limite: -1, restantes: Infinity };
  }

  const targetEmpresaId = empresaId || user?.empresaId;
  let targetEmpresa: Partial<Empresa> | undefined;

  if (targetEmpresaId) {
    try {
      const empresas = await listarEmpresas();
      targetEmpresa = empresas.find((e) => e.id === targetEmpresaId);
    } catch {
      // noop
    }
  }

  const limites = obtenerLimitesEfectivosEmpresa(
    targetEmpresa || { plan: user?.empresaPlan || 'pro' }
  );

  if (limites.limite_cajas === -1) {
    return { permitido: true, actual: 0, limite: -1, restantes: Infinity };
  }

  const actual = await contarCajasActivas(targetEmpresaId);
  const restantes = Math.max(0, limites.limite_cajas - actual);

  if (actual >= limites.limite_cajas) {
    return {
      permitido: false,
      actual,
      limite: limites.limite_cajas,
      restantes: 0,
      mensaje: `Has alcanzado el límite de ${limites.limite_cajas} cajas registradoras permitidas (${actual}/${limites.limite_cajas}). Mejora el plan de suscripción para agregar más cajas.`,
    };
  }

  return {
    permitido: true,
    actual,
    limite: limites.limite_cajas,
    restantes,
  };
}

/**
 * ==============================================================================
 * SINCRONIZACIÓN EN LA NUBE CON SUPABASE (SaaS Plans & Modules Matrix)
 * ==============================================================================
 */

/**
 * Sincroniza en Supabase toda la matriz global de suscripciones:
 * 1. Módulos asignados por plan
 * 2. Cuotas y límites operativos por plan
 * 3. Precios, badges y nombres de los planes
 * 4. Nombres personalizados de módulos
 */
export async function sincronizarConfiguracionPlanesEnSupabase(): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;

  const modulos = obtenerConfiguracionModulosPlanes();
  const limites = obtenerConfiguracionLimitesPlanes();
  const info = obtenerInfoPlanes();
  const nombresModulos = obtenerNombresModulosPersonalizados();

  const planes: PlanEmpresa[] = ['free', 'starter', 'pro', 'enterprise'];

  try {
    // 1. Intentar guardar en tabla configuracion_planes_saas si ya existe
    const rows = planes.map((id) => ({
      id,
      nombre: info[id]?.name || DEFAULT_PLANS_INFO[id].name,
      precio: info[id]?.price || DEFAULT_PLANS_INFO[id].price,
      badge: info[id]?.badge || DEFAULT_PLANS_INFO[id].badge,
      descripcion: info[id]?.desc || DEFAULT_PLANS_INFO[id].desc,
      modulos: modulos[id] || DEFAULT_PLAN_MODULES[id],
      limites: limites[id] || DEFAULT_PLAN_LIMITES[id],
      actualizado_en: new Date().toISOString(),
    }));

    await sb.from('configuracion_planes_saas').upsert(rows);
  } catch {
    // Silencioso si la tabla no fue creada aún en el SQL Editor
  }

  // 2. Persistencia en la empresa matriz de la plataforma en Supabase
  try {
    const { data: emp } = await sb
      .from('empresas')
      .select('id, configuracion')
      .or('id.eq.a0000000-0000-0000-0000-000000000001,codigo.eq.koba-principal,codigo.eq.koba-flagship')
      .limit(1)
      .maybeSingle();

    if (emp) {
      const prevConfig = (emp.configuracion as any) || {};
      await sb
        .from('empresas')
        .update({
          configuracion: {
            ...prevConfig,
            planes_saas: {
              modulos,
              limites,
              info,
              nombresModulos,
              actualizado_en: new Date().toISOString(),
            },
          },
        })
        .eq('id', emp.id);
      return true;
    }
  } catch (err) {
    console.warn('Error sincronizando configuración de planes en Supabase:', err);
  }

  return false;
}

/**
 * Carga la configuración de planes y módulos desde Supabase.
 * Actualiza la memoria local y notifica a la interfaz para que todos los usuarios
 * vean los cambios efectuados por el SuperAdmin en tiempo real.
 */
export async function cargarConfiguracionPlanesDesdeSupabase(): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;

  try {
    // 1. Intentar desde tabla configuracion_planes_saas
    const { data: tablaData, error: tablaError } = await sb
      .from('configuracion_planes_saas')
      .select('*');

    if (!tablaError && Array.isArray(tablaData) && tablaData.length > 0) {
      const newModulos: Record<string, string[]> = {};
      const newLimites: Record<string, PlanLimites> = {};
      const newInfo: Record<string, PlanInfo> = {};

      for (const row of tablaData) {
        if (row.id) {
          if (row.modulos && Array.isArray(row.modulos)) newModulos[row.id] = row.modulos;
          if (row.limites && typeof row.limites === 'object') newLimites[row.id] = row.limites;
          if (row.nombre) {
            newInfo[row.id] = {
              id: row.id,
              name: row.nombre,
              price: row.precio,
              badge: row.badge,
              desc: row.descripcion || '',
            };
          }
        }
      }

      if (Object.keys(newModulos).length > 0) {
        localStorage.setItem(STORAGE_PLAN_MODULES, JSON.stringify(newModulos));
      }
      if (Object.keys(newLimites).length > 0) {
        localStorage.setItem(STORAGE_PLAN_LIMITES, JSON.stringify(newLimites));
      }
      if (Object.keys(newInfo).length > 0) {
        localStorage.setItem(STORAGE_PLANS_INFO, JSON.stringify(newInfo));
      }
      window.dispatchEvent(new Event('koba_subscription_config_changed'));
      return true;
    }

    // 2. Si la tabla no está creada, leer desde la configuración en Supabase
    const { data: emp } = await sb
      .from('empresas')
      .select('id, configuracion')
      .or('id.eq.a0000000-0000-0000-0000-000000000001,codigo.eq.koba-principal,codigo.eq.koba-flagship')
      .limit(1)
      .maybeSingle();

    if (emp && emp.configuracion && (emp.configuracion as any).planes_saas) {
      const remote = (emp.configuracion as any).planes_saas;
      if (remote.modulos) {
        localStorage.setItem(STORAGE_PLAN_MODULES, JSON.stringify(remote.modulos));
      }
      if (remote.limites) {
        localStorage.setItem(STORAGE_PLAN_LIMITES, JSON.stringify(remote.limites));
      }
      if (remote.info) {
        localStorage.setItem(STORAGE_PLANS_INFO, JSON.stringify(remote.info));
      }
      if (remote.nombresModulos) {
        localStorage.setItem(STORAGE_MODULES_CUSTOMIZATION, JSON.stringify(remote.nombresModulos));
      }
      window.dispatchEvent(new Event('koba_subscription_config_changed'));
      return true;
    }
  } catch (err) {
    console.warn('Error al cargar configuración de planes desde Supabase:', err);
  }

  return false;
}

// Carga inicial automática en segundo plano al arrancar la app
if (typeof window !== 'undefined') {
  void cargarConfiguracionPlanesDesdeSupabase();
}


