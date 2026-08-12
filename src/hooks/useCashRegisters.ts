import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CASH_REGISTERS, type CashRegisterId, type CashRegisterSession } from '@/lib/cashRegisters';
import { obtenerCierresCaja } from '@/services/cierresCaja.service';
import { obtenerUsuarios } from '@/services/usuarios.service';
import { obtenerCajas } from '@/services/cajas.service';
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
      const [usuarios, cierres, cajasDb] = await Promise.all([
        obtenerUsuarios().catch(() => []),
        obtenerCierresCaja().catch(() => []),
        obtenerCajas({ soloActivas: true }).catch(() => []),
      ]);

      setDbUsers(usuarios);

      const abiertasMap = new Map<string, CierreCaja>();
      for (const c of cierres) {
        if (c.estado === 'abierta' && !abiertasMap.has(c.caja_id)) {
          abiertasMap.set(c.caja_id, c);
        }
      }

      const cajerosReales = usuarios.filter(
        (u) => u.activo && (u.rol === 'cajero' || u.rol === 'vendedor' || u.rol === 'admin')
      );

      const baseCajasList = cajasDb.length > 0 ? cajasDb : CASH_REGISTERS.map((r) => ({
        id: r.id,
        codigo: r.id,
        nombre: r.label,
        es_caja_principal: r.isAdminBox ?? false,
        activa: true,
      }));

      const nextRegisters: CashRegisterSession[] = baseCajasList.map((caja, idx) => {
        const cajaId = (caja.codigo || caja.id) as CashRegisterId;
        const sessionAbierta = abiertasMap.get(cajaId) || abiertasMap.get(caja.id);
        const isAdminBox = Boolean(caja.es_caja_principal);

        if (sessionAbierta) {
          const matchedUser = usuarios.find((u) => u.id === sessionAbierta.cajero_id);
          const rawCajeroNombre = (sessionAbierta as CierreCaja & { cajero_nombre?: string })?.cajero_nombre;
          const cashierName = matchedUser?.nombre_completo || rawCajeroNombre || user?.name || 'Cajero Activo';
          const userRole = matchedUser ? (ROL_DB_A_UI[matchedUser.rol] || 'Cajero') : (user?.role || 'Cajero');
          const horaApertura = sessionAbierta.abierta_en
            ? new Date(sessionAbierta.abierta_en).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
            : 'Hoy';

          return {
            id: cajaId,
            label: caja.nombre,
            cashier: cashierName,
            role: userRole,
            isAdminBox,
            open: true,
            openedAt: horaApertura,
            salesToday: sessionAbierta.total_ventas || 0,
            tickets: 0,
            cartItems: 0,
            currentTotal: 0,
            movements: [],
          };
        }

        // Si es la caja del admin / principal y no hay sesión explícita en DB
        if (isAdminBox) {
          return {
            id: cajaId,
            label: caja.nombre,
            cashier: user?.name || 'Administrador General',
            role: user?.role || 'Administrador General',
            isAdminBox: true,
            open: false,
            openedAt: '—',
            salesToday: 0,
            tickets: 0,
            cartItems: 0,
            currentTotal: 0,
            movements: [],
          };
        }

        // Para otras cajas asignamos usuarios reales de la base de datos si existen
        const assignedRealUser = cajerosReales[idx % (cajerosReales.length || 1)];
        if (assignedRealUser) {
          return {
            id: cajaId,
            label: caja.nombre,
            cashier: assignedRealUser.nombre_completo,
            role: ROL_DB_A_UI[assignedRealUser.rol] || 'Cajero',
            isAdminBox: false,
            open: false,
            openedAt: '—',
            salesToday: 0,
            tickets: 0,
            cartItems: 0,
            currentTotal: 0,
            movements: [],
          };
        }

        return {
          id: cajaId,
          label: caja.nombre,
          cashier: 'Disponible / Sin asignar',
          role: 'Sin asignar',
          isAdminBox: false,
          open: false,
          openedAt: '—',
          salesToday: 0,
          tickets: 0,
          cartItems: 0,
          currentTotal: 0,
          movements: [],
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
