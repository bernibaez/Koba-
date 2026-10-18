import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute, ROLE_HOME } from '@/lib/auth';
import {
  puedeUsuarioAccederModulo,
  obtenerPrimerModuloHabilitado,
} from '@/services/subscriptionModules.service';
import { PageLoader } from '@/components/ui/LoadingSkeleton';
import { Lock, ArrowLeft, Crown } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader message="Cargando sesión…" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(user.role, location.pathname)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  // Si la ruta solicitada no está incluida en los módulos del plan del usuario
  if (!puedeUsuarioAccederModulo(user, location.pathname)) {
    // Si entró a la raíz (/) pero el Dashboard no forma parte de sus módulos,
    // redirigir fluidamente al primer módulo que sí tiene contratado (ej. POS o Ventas)
    if (location.pathname === '/') {
      const primerModulo = obtenerPrimerModuloHabilitado(user);
      if (primerModulo && primerModulo.href !== '/') {
        return <Navigate to={primerModulo.href} replace />;
      }
    }

    const primerModulo = obtenerPrimerModuloHabilitado(user);
    const destinoFallback = primerModulo?.href || ROLE_HOME[user.role] || '/';

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Crown size={12} /> Plan No Incluye este Módulo
            </div>
            <h2 className="text-xl font-black text-foreground">Módulo Bloqueado</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Tu suscripción o plan actual no tiene activado este módulo. Comunícate con el administrador de la cuenta para ampliar tu plan o activar permisos de acceso.
            </p>
          </div>
          <Link
            to={destinoFallback}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Ir a {primerModulo?.label || 'Módulo Principal'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
