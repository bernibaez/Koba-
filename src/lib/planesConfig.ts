/**
 * Configuración y especificaciones de Planes en KOBA Cloud
 * Permite seleccionar: Solo POS, ERP, CRM, o Suite Completa (Full ERP+CRM)
 */

export type ModuloApp = 'pos' | 'erp' | 'crm' | 'full';

export interface PlanModuloConfig {
  id: ModuloApp;
  nombre: string;
  badge: string;
  descripcion: string;
  precioMes: string;
  modulosIncluidos: string[];
  rutasPermitidas: string[];
}

export const MODULOS_PLANES: Record<ModuloApp, PlanModuloConfig> = {
  pos: {
    id: 'pos',
    nombre: 'KOBA POS',
    badge: 'Punto de Venta Ágil',
    descripcion: 'Diseñado para cajas de cobro rápido, inventario en tienda, balanzas y cuadre de caja.',
    precioMes: '$19 USD/mes',
    modulosIncluidos: ['Punto de Venta (POS)', 'Ventas y Tickets', 'Apertura y Cierre de Caja', 'Catálogo Básico de Productos'],
    rutasPermitidas: ['/', '/point-of-sale-pos', '/sales', '/cash-closure', '/cajas', '/product-management', '/settings'],
  },
  erp: {
    id: 'erp',
    nombre: 'KOBA ERP',
    badge: 'Gestión Operativa Total',
    descripcion: 'Para empresas con compras, cuentas por pagar/cobrar, multialmacén, combos y finanzas.',
    precioMes: '$59 USD/mes',
    modulosIncluidos: ['Todo lo de POS', 'Compras y Proveedores', 'Cuentas por Cobrar (CxC)', 'Cuentas por Pagar (CxP)', 'Transferencias y Ajustes', 'Informes y Auditoría'],
    rutasPermitidas: [
      '/',
      '/point-of-sale-pos',
      '/sales',
      '/purchases',
      '/returns-history',
      '/product-management',
      '/combos',
      '/stock-transfers',
      '/stock-adjustments',
      '/cajas',
      '/cash-closure',
      '/maleta',
      '/expenses',
      '/accounts-receivable',
      '/accounts-payable',
      '/reports',
      '/audit',
      '/users',
      '/settings',
      '/contacts',
    ],
  },
  crm: {
    id: 'crm',
    nombre: 'KOBA CRM',
    badge: 'Ventas y Relaciones B2B',
    descripcion: 'Pipeline de ventas Kanban, gestión de prospectos/leads, seguimiento comercial y ficha 360° de clientes.',
    precioMes: '$39 USD/mes',
    modulosIncluidos: ['Pipeline Kanban de Oportunidades', 'Directorio 360° de Clientes', 'Bitácora y Tareas de Seguimiento', 'Cotizaciones y Propuestas', 'Grupos y Fidelización'],
    rutasPermitidas: ['/', '/contacts', '/sales', '/settings'],
  },
  full: {
    id: 'full',
    nombre: 'KOBA Suite Empresarial',
    badge: 'ERP + CRM Completo',
    descripcion: 'Acceso total a todos los módulos de KOBA Cloud: POS, ERP Financiero, Inventario avanzado y CRM empresarial.',
    precioMes: '$89 USD/mes',
    modulosIncluidos: ['Punto de Venta POS', 'ERP Operativo y Financiero', 'CRM Pipeline y Ficha 360°', 'SuperAdmin / Multi-Sucursal', 'Facturación NCF y Balanzas'],
    rutasPermitidas: ['*'],
  },
};

const LOCAL_PLAN_MODULO_KEY = 'koba_modulo_plan_activo';

export function getModuloPlanActivo(): ModuloApp {
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_MODULO_KEY);
    if (raw && (raw === 'pos' || raw === 'erp' || raw === 'crm' || raw === 'full')) {
      return raw as ModuloApp;
    }
  } catch {
    // fallback
  }
  return 'full'; // Por defecto la suite completa para no restringir sin previo aviso
}

export function setModuloPlanActivo(plan: ModuloApp): void {
  try {
    localStorage.setItem(LOCAL_PLAN_MODULO_KEY, plan);
    window.dispatchEvent(new CustomEvent('koba_plan_changed', { detail: plan }));
  } catch (err) {
    console.error('Error guardando plan módulo:', err);
  }
}
