import React from 'react';
import {
  Wheat,
  Beef,
  Milk,
  CupSoda,
  Sparkles,
  Cookie,
  Apple,
  Package,
  Layers,
  ShoppingBag,
  Tag,
  Boxes,
  LucideIcon,
} from 'lucide-react';

interface CategoryIconProps {
  category?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isCombo?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { box: 'w-8 h-8 rounded-lg', icon: 16 },
  md: { box: 'w-10 h-10 rounded-xl', icon: 20 },
  lg: { box: 'w-12 h-12 rounded-2xl', icon: 24 },
  xl: { box: 'w-16 h-16 rounded-2xl', icon: 30 },
};

export function getCategoryIconInfo(category?: string, name?: string, isCombo?: boolean): { Icon: LucideIcon; colorCls: string } {
  if (isCombo) {
    return { Icon: Layers, colorCls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20' };
  }

  const text = `${category || ''} ${name || ''}`.toLowerCase();

  if (text.includes('grano') || text.includes('despensa') || text.includes('arroz') || text.includes('aceite') || text.includes('azúcar')) {
    return { Icon: Wheat, colorCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  }
  if (text.includes('carne') || text.includes('pollo') || text.includes('res') || text.includes('cerdo') || text.includes('pescado')) {
    return { Icon: Beef, colorCls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  }
  if (text.includes('lácteo') || text.includes('lacteo') || text.includes('leche') || text.includes('huevos') || text.includes('yogur') || text.includes('queso')) {
    return { Icon: Milk, colorCls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20' };
  }
  if (text.includes('bebida') || text.includes('jugo') || text.includes('licor') || text.includes('cola') || text.includes('agua')) {
    return { Icon: CupSoda, colorCls: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
  }
  if (text.includes('limpieza') || text.includes('hogar') || text.includes('detergente') || text.includes('papel')) {
    return { Icon: Sparkles, colorCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  }
  if (text.includes('pan') || text.includes('galleta') || text.includes('meriendas')) {
    return { Icon: Cookie, colorCls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20' };
  }
  if (text.includes('fruta') || text.includes('vegetal') || text.includes('verdura') || text.includes('plátano')) {
    return { Icon: Apple, colorCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  }
  if (text.includes('combo') || text.includes('oferta') || text.includes('paquete')) {
    return { Icon: Boxes, colorCls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20' };
  }

  return { Icon: Package, colorCls: 'bg-primary/15 text-primary border-primary/20' };
}

export default function CategoryIcon({ category, name, size = 'md', isCombo = false, className = '' }: CategoryIconProps) {
  const { Icon, colorCls } = getCategoryIconInfo(category, name, isCombo);
  const cfg = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`border flex items-center justify-center flex-shrink-0 font-bold select-none ${cfg.box} ${colorCls} ${className}`}
      aria-hidden="true"
      title={category || name}
    >
      <Icon size={cfg.icon} />
    </div>
  );
}
