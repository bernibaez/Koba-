import React, { useState } from 'react';
import type { Product } from './ProductManagementScreen';
import { Eye, Edit2, MoreVertical } from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { productDrawerSchema } from './ProductDrawer';

interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView?: (p: Product) => void;
  onEdit: (p: Product) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onPrintLabel?: (p: Product) => void;
  onToggleActionsMenu: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  onInlineUpdate?: (id: string, field: 'salePrice' | 'currentStock', value: number, previous: Product) => Promise<void>;
}

export default function ProductRow({
  product,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onToggleActionsMenu,
  onInlineUpdate,
}: ProductRowProps) {
  const [editingField, setEditingField] = useState<'salePrice' | 'currentStock' | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const isWeighed = Boolean(
    product.isWeightProduct || product.saleType === 'weight' || product.saleType === 'both'
  );

  const weightUnit = product.weightUnit || 'lb';
  const unitLabel = isWeighed ? `Peso · ${weightUnit}` : 'Unidad';

  // Stock Dot calculation
  const reorderPoint = product.minStock ?? 0;
  let stockDotColor = 'var(--ok)';
  let stockText = `${product.currentStock} ${isWeighed ? weightUnit : 'un.'}`;

  if (product.currentStock === 0) {
    stockDotColor = 'var(--bad)';
    stockText = 'Agotado';
  } else if (product.currentStock <= reorderPoint) {
    stockDotColor = 'var(--warn)';
    stockText = `${product.currentStock} ${isWeighed ? weightUnit : 'un.'}`;
  }

  // Status Dot calculation
  let statusDotColor = 'var(--ok)';
  let statusLabel = 'Activo';

  if (product.status === 'inactive') {
    statusDotColor = 'var(--ink3)';
    statusLabel = 'Inactivo';
  } else if (product.status === 'discontinued') {
    statusDotColor = 'var(--bad)';
    statusLabel = 'Descontinuado';
  }

  // Metadata items: SKU, PLU, Barcode
  const metaParts: string[] = [];
  if (product.sku) metaParts.push(`SKU ${product.sku}`);
  if (product.plu) metaParts.push(`PLU ${product.plu}`);
  if (product.barcode && product.barcode !== product.plu) metaParts.push(product.barcode);

  // Iniciar edición en línea
  const startEditing = (field: 'salePrice' | 'currentStock', initialVal: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingField(field);
    setInlineValue(String(initialVal));
    setInlineError(null);
  };

  // Guardar edición en línea
  const handleInlineSave = async (field: 'salePrice' | 'currentStock') => {
    const num = parseFloat(inlineValue);
    if (isNaN(num)) {
      setInlineError('Debe ser un número válido');
      return;
    }

    if (field === 'salePrice') {
      const result = productDrawerSchema.shape.salePrice.safeParse(num);
      if (!result.success) {
        setInlineError(result.error.errors[0]?.message || 'El precio debe ser mayor que 0');
        return;
      }
    } else {
      const result = productDrawerSchema.shape.currentStock.safeParse(num);
      if (!result.success) {
        setInlineError(result.error.errors[0]?.message || 'El stock no puede ser negativo');
        return;
      }
    }

    setEditingField(null);
    setInlineError(null);

    if (onInlineUpdate && num !== product[field]) {
      await onInlineUpdate(product.id, field, num, product);
    }
  };

  // Cancelar edición en línea
  const cancelInlineEdit = () => {
    setEditingField(null);
    setInlineError(null);
  };

  return (
    <tr
      onClick={() => onView?.(product)}
      className={`group transition-colors duration-150 border-b border-[var(--line)] cursor-pointer select-none ${
        isSelected ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--hover)]'
      }`}
    >
      {/* Checkbox */}
      <td className="w-12 px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="w-4 h-4 rounded border-[var(--line)] accent-[var(--accent)] cursor-pointer"
          aria-label={`Seleccionar ${product.name}`}
        />
      </td>

      {/* Producto (Miniatura 40px radio 10px + Nombre + Tag + Metadatos) */}
      <td className="px-3.5 py-3">
        <div className="flex items-center gap-3">
          {/* Miniatura 40px con radio 10px */}
          <div className="w-10 h-10 rounded-[10px] bg-[var(--chip)] border border-[var(--line)] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <CategoryIcon category={product.category} name={product.name} size="sm" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onView?.(product)}
                className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors text-left cursor-pointer truncate max-w-xs sm:max-w-md"
              >
                {product.name}
              </button>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--chip)] text-[var(--ink2)] font-normal whitespace-nowrap">
                {unitLabel}
              </span>
            </div>

            {/* Metadatos en 12px gris */}
            <p className="text-xs text-[var(--ink2)] mt-0.5 font-normal truncate">
              {metaParts.join(' · ') || 'Sin código registrado'}
            </p>
          </div>
        </div>
      </td>

      {/* Categoría (oculta en < 760px) */}
      <td className="px-3.5 py-3 text-xs text-[var(--ink2)] font-normal hidden md:table-cell">
        {product.category || '—'}
      </td>

      {/* Precio (Edición en línea con doble clic) */}
      <td
        className="px-3.5 py-3 text-right"
        onDoubleClick={(e) => startEditing('salePrice', product.salePrice, e)}
        title="Doble clic para editar precio"
      >
        {editingField === 'salePrice' ? (
          <div className="inline-flex flex-col items-end" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleInlineSave('salePrice');
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelInlineEdit();
                }
              }}
              onBlur={() => cancelInlineEdit()}
              className="w-24 h-7 text-xs font-medium text-right text-[var(--ink)] bg-[var(--surface)] border border-[var(--accent)] rounded-md px-1.5 outline-none tabular-nums shadow-xs focus:ring-1 focus:ring-[var(--accent)]"
            />
            {inlineError && (
              <span className="text-[10px] text-[var(--bad)] mt-0.5">{inlineError}</span>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-[var(--ink)] tabular-nums">
            RD$ {product.salePrice.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-[var(--ink2)] font-normal ml-0.5">
              {isWeighed ? `/${weightUnit}` : ''}
            </span>
          </div>
        )}
      </td>

      {/* Stock (Edición en línea con doble clic, alineado a la izquierda) */}
      <td
        className="px-3.5 py-3 text-left"
        onDoubleClick={(e) => startEditing('currentStock', product.currentStock, e)}
        title="Doble clic para editar stock"
      >
        {editingField === 'currentStock' ? (
          <div className="inline-flex flex-col items-start" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              step={isWeighed ? '0.01' : '1'}
              autoFocus
              value={inlineValue}
              onChange={(e) => setInlineValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleInlineSave('currentStock');
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelInlineEdit();
                }
              }}
              onBlur={() => cancelInlineEdit()}
              className="w-20 h-7 text-xs font-medium text-left text-[var(--ink)] bg-[var(--surface)] border border-[var(--accent)] rounded-md px-1.5 outline-none tabular-nums shadow-xs focus:ring-1 focus:ring-[var(--accent)]"
            />
            {inlineError && (
              <span className="text-[10px] text-[var(--bad)] mt-0.5">{inlineError}</span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{ backgroundColor: stockDotColor }}
              aria-hidden="true"
            />
            <span className="text-sm font-normal text-[var(--ink)] tabular-nums">
              {stockText}
            </span>
          </div>
        )}
      </td>

      {/* Estado (punto de color de 7px + texto, oculto en < 760px) */}
      <td className="px-3.5 py-3 text-left hidden md:table-cell">
        <div className="inline-flex items-center gap-1.5">
          <span
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{ backgroundColor: statusDotColor }}
            aria-hidden="true"
          />
          <span className="text-xs font-normal text-[var(--ink)]">
            {statusLabel}
          </span>
        </div>
      </td>

      {/* Acciones (visibles siempre de forma sutil, destacadas en hover) */}
      <td className="px-3 py-3 text-right w-24" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 opacity-65 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-150">
          {onView && (
            <button
              type="button"
              onClick={() => onView(product)}
              className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label={`Ver detalles de ${product.name}`}
              title="Ver detalle"
            >
              <Eye size={15} strokeWidth={1.8} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(product)}
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label={`Editar ${product.name}`}
            title="Editar producto"
          >
            <Edit2 size={15} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={(e) => onToggleActionsMenu(product.id, e)}
            className="p-1.5 rounded-lg text-[var(--ink2)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label={`Más opciones para ${product.name}`}
            title="Más opciones"
          >
            <MoreVertical size={15} strokeWidth={1.8} />
          </button>
        </div>
      </td>
    </tr>
  );
}
