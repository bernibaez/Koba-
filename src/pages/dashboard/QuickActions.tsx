import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  ReceiptText,
  Lock,
  Package,
  BarChart2,
  Boxes,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  cardBg: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

const actionItems: QuickActionItem[] = [
  {
    id: 'qa-pos',
    label: 'Nueva Venta >',
    description: 'Punto de Venta',
    icon: <ShoppingCart size={20} />,
    href: '/pos',
    cardBg: 'bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50',
    borderColor: 'border-emerald-100 dark:border-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-900 dark:text-emerald-100',
  },
  {
    id: 'qa-purchases',
    label: 'Nueva Compra',
    description: 'Registrar compra',
    icon: <ReceiptText size={20} />,
    href: '/purchases',
    cardBg: 'bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-950/50',
    borderColor: 'border-sky-100 dark:border-sky-900/50',
    iconColor: 'text-sky-600 dark:text-sky-400',
    textColor: 'text-sky-900 dark:text-sky-100',
  },
  {
    id: 'qa-cash',
    label: 'Cierre de Caja',
    description: 'Cerrar turno',
    icon: <Lock size={20} />,
    href: '/cajas',
    cardBg: 'bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50',
    borderColor: 'border-amber-100 dark:border-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-900 dark:text-amber-100',
  },
  {
    id: 'qa-products',
    label: 'Productos',
    description: 'Ver catálogo',
    icon: <Package size={20} />,
    href: '/product-management',
    cardBg: 'bg-purple-50/80 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-950/50',
    borderColor: 'border-purple-100 dark:border-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-purple-900 dark:text-purple-100',
  },
  {
    id: 'qa-reports',
    label: 'Reportes',
    description: 'Ver análisis',
    icon: <BarChart2 size={20} />,
    href: '/reports',
    cardBg: 'bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50',
    borderColor: 'border-indigo-100 dark:border-indigo-900/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    textColor: 'text-indigo-900 dark:text-indigo-100',
  },
  {
    id: 'qa-inventory',
    label: 'Inventario >',
    description: 'Stock y existencias',
    icon: <Boxes size={20} />,
    href: '/stock-adjustments',
    cardBg: 'bg-teal-50/80 hover:bg-teal-100/80 dark:bg-teal-950/30 dark:hover:bg-teal-950/50',
    borderColor: 'border-teal-100 dark:border-teal-900/50',
    iconColor: 'text-teal-600 dark:text-teal-400',
    textColor: 'text-teal-900 dark:text-teal-100',
  },
];

export default function QuickActions() {
  const handleCustomize = () => {
    toast.info('Configuración de accesos rápidos próximamente.');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Acciones rápidas
        </h3>

        <button
          type="button"
          onClick={handleCustomize}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={13} />
          <span>Personalizar</span>
        </button>
      </div>

      {/* Grid of 6 pastel cards (3x2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 items-stretch">
        {actionItems.map((act) => (
          <Link
            key={act.id}
            to={act.href}
            className={`
              flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200
              ${act.cardBg} ${act.borderColor}
              hover:shadow-xs active:scale-[0.98] group cursor-pointer
            `}
          >
            <div className={`mb-3 ${act.iconColor}`}>
              {act.icon}
            </div>

            <div>
              <p className={`text-xs font-black leading-tight ${act.textColor}`}>
                {act.label}
              </p>
              <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                {act.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
