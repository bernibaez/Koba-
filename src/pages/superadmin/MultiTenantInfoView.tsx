import React from 'react';
import { ShieldCheck, Layers, CheckCircle2, Lock, Database } from 'lucide-react';

export default function MultiTenantInfoView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* RLS Security Card */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 text-foreground pb-3 border-b border-border/50">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Aislamiento Estricto por Row Level Security (RLS)
            </h2>
            <p className="text-xs text-muted-foreground">
              Separación total de bases de datos por tenant_id a nivel de PostgreSQL
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Cada consulta ejecutada por un usuario evalúa automáticamente la función{' '}
          <code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded font-mono text-foreground">
            obtener_empresa_id()
          </code>
          . Ninguna organización puede consultar, alterar o eliminar registros de otra empresa bajo ninguna circunstancia.
        </p>

        <div className="space-y-2.5 pt-1 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Restricciones de unicidad (códigos de barra, facturas NCF, comprobantes) aisladas por cada empresa.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Triggers automáticos en Supabase para la inyección e integridad segura de <code className="font-mono">empresa_id</code>.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              El rol SuperAdmin gestiona planes, cuotas y licencias de la plataforma sin tener acceso a las ventas operacionales ni a los clientes finales de cada empresa.
            </span>
          </div>
        </div>
      </div>

      {/* Escalabilidad & Planes Card */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 text-foreground pb-3 border-b border-border/50">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Niveles de Servicio & Monetización
            </h2>
            <p className="text-xs text-muted-foreground">
              Capacidad y escalabilidad de planes SaaS en Kob Cloud
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Estructura de escalamiento diseñada para negocios en crecimiento:
        </p>

        <div className="space-y-2 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground">Free:</span>
              <span className="text-muted-foreground ml-1.5">100 facturas/mes, 1 terminal, 2 cuentas</span>
            </div>
            <span className="font-bold text-muted-foreground">Gratis</span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground">Starter:</span>
              <span className="text-muted-foreground ml-1.5">500 facturas/mes, 2 cajas, hasta 5 usuarios</span>
            </div>
            <span className="font-bold text-primary">$29 USD / mes</span>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground">Pro:</span>
              <span className="text-muted-foreground ml-1.5">2,500 facturas/mes, 5 cajas, 15 usuarios</span>
            </div>
            <span className="font-bold text-primary">$79 USD / mes</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground">Enterprise:</span>
              <span className="text-muted-foreground ml-1.5">Facturas, cajas y usuarios ilimitados, API</span>
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">$199 USD / mes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
