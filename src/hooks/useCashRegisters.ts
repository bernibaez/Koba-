import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CASH_REGISTERS, type CashRegisterSession } from '@/lib/cashRegisters';
import { obtenerCierresCaja } from '@/services/cierresCaja.service';
import { obtenerUsuarios } from '@/services/usuarios.service';
import { ROL_DB_A_UI } from '@/services/auth.service';
import type { CierreCaja, Perfil } from '@/types/database';

export function useCashRegisters() {
  const { user } = useAuth();
  const [registers, setRegisters] = useState<CashRegisterSession[]>(CASH_REGISTERS);
  const [dbUsers, setDbUsers] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDynamicRegisters = useCallback(async () => {
    setLoading(true);
    try {
      const [usuarios, cierres] = await Promise.all([
        obtenerUsuarios().catch(() => []),
        obtenerCierresCaja().catch(() => []),
      ]);

      setDbUsers(usuarios);

      const abiertasMap = new Map<string, CierreCaja>();
      for (const c of cierres) {
        if (c.estado === 'abierta' && !abiertasMap.has(c.caja_id)) {
          abiertasMap.set(c.caja_id, c);
        }
      }

      const cajerosReales = usuarios.filter((u) => u.activo && (u.rol === 'cajero' || u.rol === 'vendedor' || u.rol === 'admin'));

      const nextRegisters = CASH_REGISTERS.map((base, idx) => {
        const sessionAbierta = abiertasMap.get(base.id);

        if (sessionAbierta) {
          const matchedUser = usuarios.find((u) => u.id === sessionAbierta.cajero_id);
          const rawCajeroNombre = (sessionAbierta as CierreCaja & { cajero_nombre?: string })?.cajero_nombre;
          const cashierName = matchedUser?.nombre_completo || rawCajeroNombre || user?.name || base.cashier;
          const userRole = matchedUser ? (ROL_DB_A_UI[matchedUser.rol] || 'Cajero') : (user?.role || base.role);
          const horaApertura = sessionAbierta.abierta_en
            ? new Date(sessionAbierta.abierta_en).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
            : 'Hoy';

          return {
            ...base,
            cashier: cashierName,
            role: userRole,
            open: true,
            openedAt: horaApertura,
            salesToday: sessionAbierta.total_ventas || base.salesToday,
          };
        }

        // Si es la caja del admin / caja actual y no hay sesión explícita en DB
        if (base.isAdminBox || base.id === '1') {
          return {
            ...base,
            cashier: user?.name || 'Administrador General',
            role: user?.role || 'Administrador General',
          };
        }

        // Para cajas 2, 3, 4 asignar usuarios reales de la base de datos si están disponibles
        const assignedRealUser = cajerosReales[idx % cajerosReales.length];
        if (assignedRealUser) {
          return {
            ...base,
            cashier: assignedRealUser.nombre_completo,
            role: ROL_DB_A_UI[assignedRealUser.rol] || 'Cajero',
          };
        }

        return {
          ...base,
          cashier: 'Disponible / Sin asignar',
          role: 'Sin asignar',
        };
      });

      setRegisters(nextRegisters);
    } catch {
      setRegisters(CASH_REGISTERS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDynamicRegisters();
  }, [fetchDynamicRegisters]);

  return { registers, dbUsers, loading, refetch: fetchDynamicRegisters };
}
