import type { UserRole } from '@/types/roles';

export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar' | 'aprobar';

export type PermissionModule = {
  id: string;
  label: string;
  group: string;
  href?: string;
  description: string;
  actions: PermissionAction[];
};

export const PERMISSION_ACTIONS: { id: PermissionAction; label: string; short: string }[] = [
  { id: 'ver', label: 'Ver', short: 'Ver' },
  { id: 'crear', label: 'Crear', short: 'Crear' },
  { id: 'editar', label: 'Editar', short: 'Edit' },
  { id: 'eliminar', label: 'Eliminar', short: 'Elim' },
  { id: 'exportar', label: 'Exportar', short: 'Exp' },
  { id: 'aprobar', label: 'Aprobar', short: 'Apr' },
];

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Principal',
    href: '/',
    description: 'KPIs y resumen operativo',
    actions: ['ver', 'exportar'],
  },
  {
    id: 'pos',
    label: 'Punto de Venta',
    group: 'Principal',
    href: '/point-of-sale-pos',
    description: 'Cobro, carrito y terminal POS',
    actions: ['ver', 'crear', 'editar'],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    group: 'Operaciones',
    href: '/sales',
    description: 'Historial, cotizaciones y facturas',
    actions: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
  },
  {
    id: 'compras',
    label: 'Compras',
    group: 'Operaciones',
    href: '/purchases',
    description: 'Órdenes de compra y recepción',
    actions: ['ver', 'crear', 'editar', 'eliminar', 'aprobar', 'exportar'],
  },
  {
    id: 'devoluciones',
    label: 'Devoluciones',
    group: 'Operaciones',
    href: '/returns-history',
    description: 'Devoluciones de venta',
    actions: ['ver', 'crear', 'aprobar', 'exportar'],
  },
  {
    id: 'productos',
    label: 'Productos',
    group: 'Inventario',
    href: '/product-management',
    description: 'Catálogo y precios',
    actions: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
  },
  {
    id: 'combos',
    label: 'Combos',
    group: 'Inventario',
    href: '/combos',
    description: 'Ofertas combinadas',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'transferencias',
    label: 'Transferencias',
    group: 'Inventario',
    href: '/stock-transfers',
    description: 'Traslados entre sucursales',
    actions: ['ver', 'crear', 'aprobar'],
  },
  {
    id: 'ajustes_stock',
    label: 'Ajustes de Stock',
    group: 'Inventario',
    href: '/stock-adjustments',
    description: 'Entradas, salidas y pérdidas',
    actions: ['ver', 'crear', 'aprobar', 'exportar'],
  },
  {
    id: 'cajas',
    label: 'Cajas Registradoras',
    group: 'Finanzas',
    href: '/cajas',
    description: 'Registro y administración de cajas del POS',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'contactos',
    label: 'Contactos',
    group: 'CRM',
    href: '/contacts',
    description: 'Clientes, proveedores y grupos',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'cierre_caja',
    label: 'Cierre de Caja',
    group: 'Finanzas',
    href: '/cash-closure',
    description: 'Apertura y cierre de turnos',
    actions: ['ver', 'crear', 'aprobar', 'exportar'],
  },
  {
    id: 'maleta',
    label: 'Maleta / Detalles',
    group: 'Finanzas',
    href: '/maleta',
    description: 'Cortes y merma de carne',
    actions: ['ver', 'crear', 'editar'],
  },
  {
    id: 'gastos',
    label: 'Gastos',
    group: 'Finanzas',
    href: '/expenses',
    description: 'Gastos operativos',
    actions: ['ver', 'crear', 'editar', 'aprobar', 'exportar'],
  },
  {
    id: 'cxc',
    label: 'Cuentas por Cobrar',
    group: 'Finanzas',
    href: '/accounts-receivable',
    description: 'Créditos a clientes',
    actions: ['ver', 'crear', 'editar', 'aprobar', 'exportar'],
  },
  {
    id: 'cxp',
    label: 'Cuentas por Pagar',
    group: 'Finanzas',
    href: '/accounts-payable',
    description: 'Deudas a proveedores',
    actions: ['ver', 'crear', 'editar', 'aprobar', 'exportar'],
  },
  {
    id: 'informes',
    label: 'Informes',
    group: 'Análisis',
    href: '/reports',
    description: 'Reportes gerenciales',
    actions: ['ver', 'exportar'],
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    group: 'Configuración',
    href: '/audit',
    description: 'Bitácora de acciones',
    actions: ['ver', 'exportar'],
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    group: 'Configuración',
    href: '/users',
    description: 'Cuentas y roles de acceso',
    actions: ['ver', 'crear', 'editar', 'eliminar'],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    group: 'Configuración',
    href: '/settings',
    description: 'Empresa, NCF, permisos y preferencias',
    actions: ['ver', 'editar'],
  },
];

export const PERMISSION_GROUPS = [
  'Principal',
  'Operaciones',
  'Inventario',
  'CRM',
  'Finanzas',
  'Análisis',
  'Configuración',
] as const;

export type RolePermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

export type PermissionsMatrix = Record<UserRole, RolePermissionMap>;

const ALL_TRUE = (actions: PermissionAction[]): Partial<Record<PermissionAction, boolean>> =>
  Object.fromEntries(actions.map((a) => [a, true]));

/** Valores por defecto alineados con ROLE_ROUTES actuales */
export function buildDefaultMatrix(): PermissionsMatrix {
  const empty = (): RolePermissionMap =>
    Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, Object.fromEntries(m.actions.map((a) => [a, false]))]));

  const admin = empty();
  for (const m of PERMISSION_MODULES) {
    admin[m.id] = ALL_TRUE(m.actions);
  }

  const cajero = empty();
  for (const id of ['pos', 'cierre_caja']) {
    const mod = PERMISSION_MODULES.find((m) => m.id === id)!;
    cajero[id] = {
      ...Object.fromEntries(mod.actions.map((a) => [a, false])),
      ver: true,
      crear: id === 'pos' || id === 'cierre_caja',
      editar: id === 'pos',
      aprobar: id === 'cierre_caja',
    };
  }

  const vendedor = empty();
  for (const id of ['dashboard', 'ventas', 'pos', 'combos', 'contactos', 'cxc', 'cierre_caja', 'configuracion']) {
    const mod = PERMISSION_MODULES.find((m) => m.id === id)!;
    vendedor[id] = {
      ...Object.fromEntries(mod.actions.map((a) => [a, false])),
      ver: true,
      crear: ['ventas', 'pos', 'contactos', 'cxc'].includes(id),
      editar: ['ventas', 'contactos', 'cxc'].includes(id),
      exportar: ['ventas', 'cxc'].includes(id),
    };
  }

  const almacen = empty();
  for (const id of [
    'dashboard',
    'productos',
    'combos',
    'transferencias',
    'ajustes_stock',
    'balanzas',
    'compras',
    'configuracion',
  ]) {
    const mod = PERMISSION_MODULES.find((m) => m.id === id)!;
    almacen[id] = {
      ...Object.fromEntries(mod.actions.map((a) => [a, false])),
      ver: true,
      crear: !['dashboard', 'configuracion', 'balanzas'].includes(id),
      editar: !['dashboard', 'configuracion'].includes(id),
      eliminar: ['productos', 'combos'].includes(id),
      aprobar: ['transferencias', 'ajustes_stock', 'compras'].includes(id),
      exportar: ['productos', 'ajustes_stock', 'compras'].includes(id),
    };
  }

  const contador = empty();
  for (const id of [
    'dashboard',
    'informes',
    'gastos',
    'cxc',
    'cxp',
    'ventas',
    'compras',
    'cierre_caja',
    'auditoria',
    'configuracion',
  ]) {
    const mod = PERMISSION_MODULES.find((m) => m.id === id)!;
    contador[id] = {
      ...Object.fromEntries(mod.actions.map((a) => [a, false])),
      ver: true,
      crear: ['gastos', 'cxc', 'cxp'].includes(id),
      editar: ['gastos', 'cxc', 'cxp'].includes(id),
      aprobar: ['gastos', 'cxc', 'cxp', 'cierre_caja'].includes(id),
      exportar: true,
    };
  }

  return {
    Administrador: admin,
    Cajero: cajero,
    Vendedor: vendedor,
    Almacenista: almacen,
    Contador: contador,
  };
}

export const ROLE_META: Record<
  UserRole,
  { description: string; color: string; accent: string }
> = {
  Administrador: {
    description: 'Acceso total al sistema y configuración',
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    accent: 'border-emerald-500/40',
  },
  Cajero: {
    description: 'Acceso exclusivo al Punto de Venta (POS) y Cierre de Caja',
    color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    accent: 'border-sky-500/40',
  },
  Vendedor: {
    description: 'Ventas, clientes y cuentas por cobrar',
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    accent: 'border-amber-500/40',
  },
  Almacenista: {
    description: 'Inventario, compras y transferencias',
    color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
    accent: 'border-violet-500/40',
  },
  Contador: {
    description: 'Finanzas, informes y auditoría',
    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    accent: 'border-rose-500/40',
  },
};
