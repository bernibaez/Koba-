import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  Printer,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  MoreVertical,
  Package,
  AlertTriangle,
  Calendar,
  Scale,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Product } from './ProductManagementScreen';
import CategoryIcon from '@/components/ui/CategoryIcon';
import WeightBadge from '@/components/weight/WeightBadge';
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

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: keyof Product;
  sortField: keyof Product;
  sortDir: 'asc' | 'desc';
}) {
  if (field !== sortField) return <ArrowUpDown size={12} className="text-slate-400" />;
  return sortDir === 'asc' ? (
    <ArrowUp size={12} className="text-primary" />
  ) : (
    <ArrowDown size={12} className="text-primary" />
  );
}

export default function ProductsTable({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onPrintLabel,
  onUpdateProduct,
}: ProductsTableProps) {
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination when product list or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const formatDate = (d: string | null) => {
    if (!d) return { text: '—', badge: false, color: 'text-slate-400 font-medium' };
    const parts = d.split('-');
    if (parts.length !== 3) return { text: d, badge: false, color: 'text-slate-600 font-medium' };
    const [yr, mo, day] = parts;
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const expiry = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(day));
    const today = new Date(2026, 6, 21);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = `${day} ${months[parseInt(mo) - 1]} ${yr}`;
    if (diffDays <= 0)
      return {
        text: `${formatted} (Vencido)`,
        badge: true,
        color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
      };
    if (diffDays <= 7)
      return {
        text: `${formatted} (${diffDays}d)`,
        badge: true,
        color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
      };
    if (diffDays <= 30)
      return {
        text: `${formatted} (${diffDays}d)`,
        badge: true,
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
      };
    return { text: formatted, badge: false, color: 'text-slate-600 dark:text-slate-300 font-medium' };
  };

  const handleToggleActions = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionsId === id) {
      setOpenActionsId(null);
      setMenuPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.max(10, rect.right - 192);
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 220;
    let top = rect.bottom + 6;

    if (spaceBelow < menuHeight && rect.top > menuHeight) {
      top = rect.top - menuHeight - 6;
    }

    setMenuPos({ top, left });
    setOpenActionsId(id);
  };

  if (products.length === 0) {
    return (
      <div className="card border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Package size={28} className="text-muted-foreground/40" />
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
    <div className="card border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
      <div className="overflow-x-auto scrollbar-thin rounded-2xl">
        <table className="w-full text-sm min-w-[1050px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3.5 w-10 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  aria-label="Seleccionar todos los productos"
                />
              </th>
              <th className="px-5 py-3.5 text-left cursor-pointer select-none" onClick={() => onSort('name')}>
                <div className="flex items-center gap-1.5">
                  <span>PRODUCTO / SKU</span>
                  <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-3 py-3.5 text-center cursor-pointer select-none" onClick={() => onSort('plu')}>
                <div className="flex items-center gap-1.5 justify-center">
                  <span>PLU</span>
                  <SortIcon field="plu" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => onSort('category')}>
                <div className="flex items-center gap-1.5">
                  <span>CATEGORÍA</span>
                  <SortIcon field="category" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => onSort('brand')}>
                <div className="flex items-center gap-1.5">
                  <span>MARCA</span>
                  <SortIcon field="brand" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3.5 text-right cursor-pointer select-none" onClick={() => onSort('costPrice')}>
                <div className="flex items-center gap-1.5 justify-end">
                  <span>COSTO</span>
                  <SortIcon field="costPrice" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-5 py-3.5 text-right cursor-pointer select-none" onClick={() => onSort('salePrice')}>
                <div className="flex items-center gap-1.5 justify-end">
                  <span>PRECIO VENTA</span>
                  <SortIcon field="salePrice" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-3 py-3.5 text-center select-none">
                <div className="flex items-center gap-1.5 justify-center">
                  <span>BALANZA</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => onSort('currentStock')}>
                <div className="flex items-center gap-1.5 justify-center">
                  <span>STOCK</span>
                  <SortIcon field="currentStock" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3.5 text-left cursor-pointer select-none" onClick={() => onSort('expiryDate')}>
                <div className="flex items-center gap-1.5">
                  <span>VENCIMIENTO</span>
                  <SortIcon field="expiryDate" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => onSort('status')}>
                <div className="flex items-center gap-1.5 justify-center">
                  <span>ESTADO</span>
                  <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                </div>
              </th>
              <th className="px-5 py-3.5 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedProducts.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const expiryInfo = formatDate(product.expiryDate);

              return (
                <tr
                  key={product.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      aria-label={`Seleccionar ${product.name}`}
                    />
                  </td>

                  {/* Producto / SKU */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <CategoryIcon category={product.category} name={product.name} size="sm" />
                      </div>
                      <div>
                        <div className="font-mono text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{product.name}</span>
                          <WeightBadge
                            saleType={product.saleType}
                            weightUnit={product.weightUnit}
                            isWeighted={product.isWeightProduct}
                            size="sm"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 inline-block" />
                          <span className="truncate max-w-[220px]">SKU: {product.sku}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* PLU */}
                  <td className="px-3 py-3.5 text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {product.plu ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold">
                        {product.plu}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Categoría */}
                  <td className="px-4 py-3.5 text-xs">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {product.category}
                    </span>
                  </td>

                  {/* Marca */}
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {product.brand}
                  </td>

                  {/* Costo */}
                  <td className="px-4 py-3.5 text-right text-xs">
                    <div className="font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                      RD$ {product.costPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                  </td>

                  {/* Precio Venta */}
                  <td className="px-5 py-3.5 text-right text-xs">
                    <div className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                      RD$ {product.salePrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      {(product.saleType === 'weight' || product.saleType === 'both') && (
                        <span className="text-[10px] text-emerald-600 font-bold ml-0.5">/{product.weightUnit || 'lb'}</span>
                      )}
                    </div>
                  </td>

                  {/* Balanza */}
                  <td className="px-3 py-3.5 text-center text-xs">
                    {product.generateScaleBarcode || (product.isWeightProduct && product.plu) ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs"
                        title="Producto identificado mediante etiqueta de balanza"
                      >
                        <Scale size={12} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Balanza</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        product.stockStatus === 'out'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                          : product.stockStatus === 'low'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                      }`}
                    >
                      {product.stockStatus === 'out' ? (
                        <AlertTriangle size={13} />
                      ) : product.stockStatus === 'low' ? (
                        <AlertTriangle size={13} />
                      ) : (
                        <Package size={13} />
                      )}
                      <span>
                        {product.stockStatus === 'out'
                          ? 'Sin Stock'
                          : product.stockStatus === 'low'
                            ? `Bajo (${product.currentStock})`
                            : `Normal (${product.currentStock})`}
                      </span>
                    </span>
                  </td>

                  {/* Vencimiento */}
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                    {expiryInfo.badge ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${expiryInfo.color}`}>
                        <Calendar size={12} />
                        {expiryInfo.text}
                      </span>
                    ) : (
                      <span className={expiryInfo.color}>{expiryInfo.text}</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                        product.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : product.status === 'inactive'
                            ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'
                      }`}
                    >
                      {product.status === 'active' ? (
                        <>
                          <CheckCircle size={13} />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span className="capitalize">{product.status === 'inactive' ? 'Inactivo' : 'Descontinuado'}</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleToggleActions(product.id, e)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs inline-flex"
                    >
                      <span>Acciones</span>
                      <MoreVertical size={14} className="text-slate-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Mostrando <span className="font-extrabold text-slate-900 dark:text-white">{startIndex + 1}</span> a{' '}
            <span className="font-extrabold text-slate-900 dark:text-white">
              {Math.min(startIndex + itemsPerPage, products.length)}
            </span>{' '}
            de <span className="font-extrabold text-slate-900 dark:text-white">{products.length}</span> productos
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-500 text-xs">Filas:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((pageNum, idx, arr) => (
                <React.Fragment key={`page-${pageNum}`}>
                  {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                    <span className="px-1 text-slate-400 font-bold">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Siguiente</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Action Menu Portal - Renders directly onto document.body above everything */}
      {openActionsId && menuPos && (() => {
        const product = products.find((p) => p.id === openActionsId);
        if (!product) return null;

        return createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => {
                setOpenActionsId(null);
                setMenuPos(null);
              }}
            />
            <div
              style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
              className="fixed w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-[9999] py-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs animate-in fade-in zoom-in-95"
            >
              <div className="py-1">
                {onView && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionsId(null);
                      setMenuPos(null);
                      onView(product);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                  >
                    <Eye size={15} className="text-emerald-600" />
                    <span>Ver Detalle</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onEdit(product);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Edit size={15} className="text-blue-600" />
                  <span>Editar Producto</span>
                </button>
                {onPrintLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionsId(null);
                      setMenuPos(null);
                      onPrintLabel([product]);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                  >
                    <Printer size={15} className="text-purple-600" />
                    <span>Imprimir Etiqueta</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onToggleStatus(product.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  {product.status === 'active' ? (
                    <>
                      <ToggleRight size={15} className="text-amber-600" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={15} className="text-emerald-600" />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenActionsId(null);
                    setMenuPos(null);
                    onDelete(product.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 size={15} className="text-rose-600" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        );
      })()}
    </div>
  );
}