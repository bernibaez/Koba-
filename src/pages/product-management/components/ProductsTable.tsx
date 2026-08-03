import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye, Printer, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import type { Product } from './ProductManagementScreen';
import StatusBadge from '@/components/ui/StatusBadge';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { generateUniqueBarcode } from '@/lib/barcodeUtils';
import { toast } from 'sonner';

interface ProductsTableProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  sortField: keyof Product;
  sortDir: 'asc' | 'desc';
  onSort: (field: keyof Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onView?: (p: Product) => void;
  onPrintLabel?: (products: Product[]) => void;
  onUpdateProduct?: (product: Product) => void;
}

const stockBadge = (status: Product['stockStatus'], stock: number) => {
  if (status === 'out') return <span className="badge-danger">Sin Stock</span>;
  if (status === 'low') return <span className="badge-warning">Bajo ({stock})</span>;
  return <span className="badge-success">Normal ({stock})</span>;
};

const statusBadge = (status: Product['status']) => {
  if (status === 'active') return <StatusBadge variant="success" label="Activo" />;
  if (status === 'inactive') return <StatusBadge variant="neutral" label="Inactivo" />;
  return <StatusBadge variant="danger" label="Descontinuado" />;
};

function SortIcon({ field, sortField, sortDir }: { field: keyof Product; sortField: keyof Product; sortDir: 'asc' | 'desc' }) {
  if (field !== sortField) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="text-primary" />
    : <ArrowDown size={12} className="text-primary" />;
}

const columns: { key: keyof Product; label: string; sortable?: boolean; align?: string }[] = [
  { key: 'name', label: 'Producto', sortable: true },
  { key: 'barcode', label: 'Código', sortable: false },
  { key: 'category', label: 'Categoría', sortable: true },
  { key: 'brand', label: 'Marca', sortable: true },
  { key: 'costPrice', label: 'Costo', sortable: true, align: 'right' },
  { key: 'salePrice', label: 'Precio Venta', sortable: true, align: 'right' },
  { key: 'currentStock', label: 'Stock', sortable: true, align: 'center' },
  { key: 'expiryDate', label: 'Vencimiento', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
];

export default function ProductsTable({
  products, selectedIds, onToggleSelect, onSelectAll,
  sortField, sortDir, onSort, onEdit, onDelete, onToggleStatus,
  onView, onPrintLabel, onUpdateProduct
}: ProductsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    const [yr, mo, day] = parts;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const expiry = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(day));
    const today = new Date(2026, 6, 21);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = `${day} ${months[parseInt(mo) - 1]} ${yr}`;
    if (diffDays <= 0) return { text: formatted, color: 'text-danger font-semibold' };
    if (diffDays <= 7) return { text: `${formatted} (${diffDays}d)`, color: 'text-danger font-semibold' };
    if (diffDays <= 30) return { text: `${formatted} (${diffDays}d)`, color: 'text-warning font-medium' };
    return { text: formatted, color: 'text-muted-foreground' };
  };

  const handleGenerateBarcode = (product: Product) => {
    const code = generateUniqueBarcode();
    const updated = { ...product, barcode: code };
    if (onUpdateProduct) {
      onUpdateProduct(updated);
    }
    toast.success(`Código generado para "${product.name}": ${code}`);
  };

  if (products.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Eye size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-foreground">No se encontraron productos</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Ajusta los filtros de búsqueda o crea un nuevo producto para comenzar a gestionar tu inventario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Seleccionar todos los productos"
                />
              </th>
              <th className="px-3 py-3 w-12" />
              {columns.map((col) => (
                <th
                  key={`th-${col.key}`}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}
                  `}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 w-28 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, rowIdx) => {
              const isSelected = selectedIds.has(product.id);
              const dateResult = formatDate(product.expiryDate);
              const dateText = typeof dateResult === 'string' ? dateResult : dateResult.text;
              const dateColor = typeof dateResult === 'string' ? 'text-muted-foreground' : dateResult.color;

              return (
                <tr
                  key={product.id}
                  onMouseEnter={() => setHoveredRow(product.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-border/50 transition-colors
                    ${isSelected ? 'bg-primary/5' : rowIdx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'}
                    ${hoveredRow === product.id ? 'bg-muted/40' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      aria-label={`Seleccionar ${product.name}`}
                    />
                  </td>

                  {/* Icon */}
                  <td className="px-3 py-2">
                    <CategoryIcon category={product.category} name={product.name} size="sm" />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-foreground truncate max-w-40">{product.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
                    </div>
                  </td>

                  {/* Barcode */}
                  <td className="px-4 py-3">
                    {product.barcode ? (
                      <span className="font-mono text-xs text-muted-foreground">{product.barcode}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateBarcode(product)}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        title="Generar código de barras"
                      >
                        <Sparkles size={12} /> Generar
                      </button>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="badge-neutral">{product.category}</span>
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{product.brand}</td>

                  {/* Cost */}
                  <td className="px-4 py-3 text-right">
                    <span className="tabular-nums text-sm text-muted-foreground">
                      RD$ {product.costPrice.toLocaleString('es-DO')}
                    </span>
                  </td>

                  {/* Sale Price */}
                  <td className="px-4 py-3 text-right">
                    <span className="tabular-nums text-sm font-semibold text-foreground">
                      RD$ {product.salePrice.toLocaleString('es-DO')}
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-center">
                    {stockBadge(product.stockStatus, product.currentStock)}
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3">
                    <span className={`text-xs whitespace-nowrap ${dateColor}`}>{dateText}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {statusBadge(product.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onView?.(product)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={`Ver ${product.name}`}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={`Editar ${product.name}`}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onToggleStatus(product.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={product.status === 'active' ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {product.status === 'active'
                          ? <ToggleRight size={14} className="text-success" />
                          : <ToggleLeft size={14} />
                        }
                      </button>
                      <button
                        onClick={() => onPrintLabel?.([product])}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Imprimir etiqueta con código de barras"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
                        title={`Eliminar ${product.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}