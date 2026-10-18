import type { Sale } from '../types';

export type SaleActionType = 'print' | 'edit' | 'return' | 'void' | 'delete' | 'detail';

export interface SaleActionItem {
  id: SaleActionType;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface SaleActionsConfig {
  direct: SaleActionItem[];
  menu: SaleActionItem[];
}

export interface SalePermissions {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

/**
 * Retorna las acciones disponibles para una venta según su estado y permisos del usuario.
 *
 * Reglas de negocio y fiscales:
 * - completed:
 *     - directa: print ('Imprimir')
 *     - en menú: detail ('Ver detalle'), return ('Registrar devolución'), void ('Anular factura' si canDelete)
 * - draft:
 *     - directa: edit ('Editar' si canEdit)
 *     - en menú: detail ('Ver detalle'), delete ('Eliminar borrador' si canDelete)
 * - voided:
 *     - directa: print ('Imprimir copia')
 *     - en menú: detail ('Ver detalle')
 * - Regla fiscal DGII: Factura con NCF emitido nunca se edita ni se elimina, solo se anula.
 */
export function getSaleActions(
  sale: Sale,
  permissions: SalePermissions = {}
): SaleActionsConfig {
  const direct: SaleActionItem[] = [];
  const menu: SaleActionItem[] = [];

  // Verificamos si tiene NCF fiscal formal emitido (no es un identificador de borrador temporal)
  const isDraftIdentifier =
    !sale.ncf ||
    sale.ncf.startsWith('BOR-') ||
    sale.ncf.startsWith('DRAFT-') ||
    sale.kind === 'Borrador';

  const hasFiscalNcf = Boolean(sale.ncf && !isDraftIdentifier);

  if (sale.status === 'completed') {
    // Acción directa: Imprimir
    direct.push({
      id: 'print',
      label: 'Imprimir',
    });

    // Menú desplegable
    menu.push({
      id: 'detail',
      label: 'Ver detalle',
    });

    menu.push({
      id: 'return',
      label: 'Registrar devolución',
    });

    if (permissions.canDelete) {
      menu.push({
        id: 'void',
        label: 'Anular factura',
        danger: true,
      });
    }
  } else if (sale.status === 'draft') {
    // Si es borrador y el usuario tiene permisos de edición
    if (permissions.canEdit && !hasFiscalNcf) {
      direct.push({
        id: 'edit',
        label: 'Editar',
      });
    }

    menu.push({
      id: 'detail',
      label: 'Ver detalle',
    });

    if (permissions.canDelete && !hasFiscalNcf) {
      menu.push({
        id: 'delete',
        label: 'Eliminar borrador',
        danger: true,
      });
    }
  } else if (sale.status === 'voided') {
    // Anulada: solo permite imprimir comprobante y ver detalle
    direct.push({
      id: 'print',
      label: 'Imprimir',
    });

    menu.push({
      id: 'detail',
      label: 'Ver detalle',
    });
  }

  // Garantía fiscal inquebrantable:
  // Factura con NCF formal emitido nunca se edita ni se elimina en ningún caso.
  if (hasFiscalNcf) {
    return {
      direct: direct.filter((a) => a.id !== 'edit' && a.id !== 'delete'),
      menu: menu.filter((a) => a.id !== 'edit' && a.id !== 'delete'),
    };
  }

  return { direct, menu };
}
