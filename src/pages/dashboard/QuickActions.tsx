import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShoppingBag,
  Lock,
  BarChart2,
  Sliders,
  Users,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const actions: QuickAction[] = [
  {
    id: 'qa-pos',
    label: 'Nueva Venta',
    description: 'Punto de Venta',
    icon: <Store size={26} />,
    href: '/point-of-sale-pos',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10 hover:bg-primary/20',
    borderClass: 'border-primary/20 hover:border-primary/40',
  },
  {
    id: 'qa-purchases',
    label: 'Nueva Compra',
    description: 'Registrar compra',
    icon: <ShoppingBag size={26} />,
    href: '/purchases',
    colorClass: 'text-warning',
    bgClass: 'bg-warning-bg hover:bg-warning/15',
    borderClass: 'border-warning/20 hover:border-warning/40',
  },
  {
    id: 'qa-cash',
    label: 'Cierre de Caja',
    description: 'Cerrar turno',
    icon: <Lock size={26} />,
    href: '/cash-closure',
    colorClass: 'text-danger',
    bgClass: 'bg-danger-bg/60 hover:bg-danger/15',
    borderClass: 'border-danger/20 hover:border-danger/40',
  },
  {
    id: 'qa-reports',
    label: 'Informes',
    description: 'Ver análisis',
    icon: <BarChart2 size={26} />,
    href: '/reports',
    colorClass: 'text-info',
    bgClass: 'bg-info-bg hover:bg-info/15',
    borderClass: 'border-info/20 hover:border-info/40',
  },
  {
    id: 'qa-stock',
    label: 'Ajuste Stock',
    description: 'Inventario',
    icon: <Sliders size={26} />,
    href: '/stock-adjustments',
    colorClass: 'text-success',
    bgClass: 'bg-success-bg hover:bg-success/15',
    borderClass: 'border-success/20 hover:border-success/40',
  },
  {
    id: 'qa-contacts',
    label: 'Contactos',
    description: 'Clientes / Proveed.',
    icon: <Users size={26} />,
    href: '/contacts',
    colorClass: 'text-foreground/70',
    bgClass: 'bg-secondary hover:bg-secondary/80',
    borderClass: 'border-border hover:border-border/80',
  },
];

export default function QuickActions() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-0.5">
        Acciones Rápidas
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.href}
            className={`
              flex flex-col items-center justify-center gap-2.5 py-4 px-2
              rounded-2xl border transition-all duration-200
              ${action.bgClass} ${action.borderClass}
              hover:scale-[1.04] hover:shadow-md active:scale-[0.97]
              group select-none
            `}
          >
            <span className={`transition-transform duration-200 group-hover:scale-110 ${action.colorClass}`}>
              {action.icon}
            </span>
            <div className="text-center">
              <p className={`text-xs font-bold leading-tight ${action.colorClass}`}>{action.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
