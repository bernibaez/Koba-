import React from 'react';
import { X, Layers, Calendar, Store, CheckCircle, PackageCheck, AlertTriangle } from 'lucide-react';
import { Combo } from '@/lib/comboStore';
import { getStoredProducts } from '@/lib/productStore';

interface ComboDetailModalProps {
  combo: Combo | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (combo: Combo) => void;
}

export default function ComboDetailModal({
  combo,
  isOpen,
  onClose,
  onEdit,
}: ComboDetailModalProps) {
  if (!isOpen || !combo) return null;

  const products = getStoredProducts();
  const formatCurrency = (val: number) => `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-card w-full max-w-2xl rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-3">
            <img
              src={combo.image || 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=80&h=80&fit=crop'}
              alt={combo.name}
              className="w-12 h-12 rounded-xl object-cover border border-border/80"
            />
            <div>
              <h2 className="text-lg font-black text-foreground">{combo.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-bold text-muted-foreground">{combo.code}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {combo.category}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
          {/* Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-secondary/40 rounded-xl border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase">Precio Combo</span>
              <span className="text-base font-black text-primary">{formatCurrency(combo.price)}</span>
            </div>
            <div className="p-3 bg-secondary/40 rounded-xl border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground block uppercase">Precio Normal</span>
              <span className="text-sm font-extrabold line-through text-muted-foreground">
                {formatCurrency(combo.normalPrice)}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase">Ahorro Cliente</span>
              <span className="text-sm font-black text-emerald-600">
                {formatCurrency(combo.savingsAmount)} (-{combo.savingsPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <span className="text-[10px] font-bold text-purple-600 block uppercase">Margen Ganancia</span>
              <span className="text-sm font-black text-purple-600">{combo.marginPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Description */}
          {combo.description && (
            <div className="p-3.5 bg-secondary/30 rounded-xl border border-border/60">
              <span className="text-xs font-bold text-muted-foreground block mb-1">Descripción:</span>
              <p className="text-xs text-foreground font-medium">{combo.description}</p>
            </div>
          )}

          {/* Component Products Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PackageCheck size={16} className="text-primary" /> Productos Componentes ({combo.items.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground font-black uppercase">
                  <tr>
                    <th className="p-2.5">Producto</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5 text-center">Cantidad en Combo</th>
                    <th className="p-2.5 text-center">Stock Actual</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {combo.items.map((item) => {
                    const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
                    const stock = prod ? prod.currentStock : 0;
                    const isLow = stock < item.quantity;
                    return (
                      <tr key={item.id}>
                        <td className="p-2.5 font-bold text-foreground">{item.name}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">{item.sku}</td>
                        <td className="p-2.5 text-center font-extrabold text-primary">{item.quantity} unds</td>
                        <td className="p-2.5 text-center font-bold">
                          {isLow ? (
                            <span className="text-danger flex items-center justify-center gap-1">
                              <AlertTriangle size={12} /> {stock}
                            </span>
                          ) : (
                            <span className="text-emerald-600">{stock}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-black">RD$ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settings & Validity Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-card rounded-xl border border-border/80 space-y-2">
              <span className="font-extrabold text-foreground block border-b border-border/60 pb-1">
                Configuración
              </span>
              <div className="space-y-1.5 text-muted-foreground font-medium">
                <p>• Visible en POS: <strong className="text-foreground">{combo.visibleInPos ? 'Sí' : 'No'}</strong></p>
                <p>• Venta sin stock: <strong className="text-foreground">{combo.allowSaleWithoutStock ? 'Permitida' : 'Bloqueada'}</strong></p>
                <p>• Aplicar Impuestos: <strong className="text-foreground">{combo.applyTax ? 'Sí (ITBIS)' : 'No'}</strong></p>
              </div>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border/80 space-y-2">
              <span className="font-extrabold text-foreground block border-b border-border/60 pb-1">
                Vigencia & Sucursales
              </span>
              <div className="space-y-1.5 text-muted-foreground font-medium">
                <p>• Rango: <strong className="text-foreground">{combo.startDate} - {combo.endDate}</strong></p>
                <p>• Horario: <strong className="text-foreground">{combo.startTime} a {combo.endTime}</strong></p>
                <p>• Sucursales: <strong className="text-foreground">{combo.allBranches ? 'Todas' : combo.branches.join(', ')}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/80 bg-card">
          <span className="text-xs text-muted-foreground font-semibold">
            Ventas registradas: <strong className="text-foreground">{combo.salesCount || 0} veces</strong>
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(combo);
                }}
                className="btn-primary text-xs font-bold px-4 py-2"
              >
                Editar Combo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs font-bold px-4 py-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
