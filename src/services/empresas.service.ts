import { tryGetSupabase } from './clienteSupabase';
import type { Empresa, EstadoEmpresa, PlanEmpresa } from '@/types/database';

const LOCAL_EMPRESAS_KEY = 'koba_empresas_tenants';

const DEMO_EMPRESAS: Empresa[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    codigo: 'koba-flagship',
    nombre: 'KOBA Flagship Store',
    razon_social: 'KOBA COMERCIAL S.R.L.',
    rnc: '131-89472-1',
    plan: 'enterprise',
    estado: 'activo',
    telefono: '809-555-0199',
    correo: 'contacto@koba.cloud',
    direccion: 'Av. Winston Churchill #102, Santo Domingo',
    logo_url: null,
    limite_usuarios: 50,
    limite_sucursales: 10,
    limite_cajas: 10,
    limite_facturas_mes: -1,
    moneda: 'DOP',
    itbis_porcentaje: 18,
    fecha_renovacion: '2027-01-01',
    total_usuarios: 5,
    total_sucursales: 2,
    volumen_ventas_historico: 0,
    creado_en: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    codigo: 'farmacia-vida',
    nombre: 'Farmacia Vida Natural',
    razon_social: 'FARMACEUTICA DEL CARIBE S.A.S.',
    rnc: '101-54321-9',
    plan: 'pro',
    estado: 'activo',
    telefono: '809-555-4422',
    correo: 'admin@farmaciavida.com',
    direccion: 'Calle El Sol #45, Santiago',
    logo_url: null,
    limite_usuarios: 15,
    limite_sucursales: 3,
    limite_cajas: 5,
    limite_facturas_mes: 2500,
    moneda: 'DOP',
    itbis_porcentaje: 18,
    fecha_renovacion: '2026-12-15',
    total_usuarios: 8,
    total_sucursales: 3,
    volumen_ventas_historico: 0,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    codigo: 'minimarket-express',
    nombre: 'MiniMarket Express Bella Vista',
    razon_social: 'EXPRESS RETAIL E.I.RL.',
    rnc: '132-99881-2',
    plan: 'starter',
    estado: 'trial',
    telefono: '809-555-8811',
    correo: 'gerencia@minimarketexpress.do',
    direccion: 'Av. Rómulo Betancourt #700, D.N.',
    logo_url: null,
    limite_usuarios: 5,
    limite_sucursales: 1,
    limite_cajas: 2,
    limite_facturas_mes: 500,
    moneda: 'DOP',
    itbis_porcentaje: 18,
    fecha_renovacion: '2026-10-25',
    total_usuarios: 3,
    total_sucursales: 1,
    volumen_ventas_historico: 0,
    creado_en: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

function obtenerEmpresasLocales(): Empresa[] {
  try {
    const raw = localStorage.getItem(LOCAL_EMPRESAS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_EMPRESAS_KEY, JSON.stringify(DEMO_EMPRESAS));
      return DEMO_EMPRESAS;
    }
    const parsed = JSON.parse(raw) as Empresa[];
    return parsed.map((e) => ({ ...e, volumen_ventas_historico: 0 }));
  } catch {
    return DEMO_EMPRESAS;
  }
}

function guardarEmpresasLocales(lista: Empresa[]) {
  try {
    localStorage.setItem(LOCAL_EMPRESAS_KEY, JSON.stringify(lista));
  } catch {
    // noop
  }
}

export async function listarEmpresas(): Promise<Empresa[]> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      // Intentar primero vista agregada para superadmin
      const { data: vistaData, error: vistaError } = await sb
        .from('vista_superadmin_empresas')
        .select('*')
        .order('creado_en', { ascending: false });

      if (!vistaError && vistaData) {
        return vistaData as Empresa[];
      }

      // Fallback a tabla empresas directa
      const { data, error } = await sb
        .from('empresas')
        .select('*')
        .order('creado_en', { ascending: false });

      if (!error && data) {
        return data as Empresa[];
      }
    } catch {
      // fallback local
    }
  }

  return obtenerEmpresasLocales();
}

export async function crearEmpresa(datos: {
  nombre: string;
  codigo: string;
  razon_social?: string;
  rnc?: string;
  plan: PlanEmpresa;
  telefono?: string;
  correo?: string;
  direccion?: string;
  limite_usuarios?: number;
  limite_sucursales?: number;
  limite_cajas?: number;
  limite_facturas_mes?: number;
}): Promise<Empresa> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('empresas')
        .insert({
          nombre: datos.nombre,
          codigo: datos.codigo.toLowerCase().trim().replace(/\s+/g, '-'),
          razon_social: datos.razon_social || null,
          rnc: datos.rnc || null,
          plan: datos.plan,
          estado: 'activo',
          telefono: datos.telefono || null,
          correo: datos.correo || null,
          direccion: datos.direccion || null,
          limite_usuarios: datos.limite_usuarios || 10,
          limite_sucursales: datos.limite_sucursales || 3,
          limite_cajas: datos.limite_cajas || 2,
          limite_facturas_mes: datos.limite_facturas_mes !== undefined ? datos.limite_facturas_mes : 500,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Empresa;
      }
    } catch {
      // fallback local
    }
  }

  const locales = obtenerEmpresasLocales();
  const nueva: Empresa = {
    id: `emp-${Date.now()}`,
    codigo: datos.codigo.toLowerCase().trim().replace(/\s+/g, '-'),
    nombre: datos.nombre,
    razon_social: datos.razon_social || null,
    rnc: datos.rnc || null,
    plan: datos.plan,
    estado: 'activo',
    telefono: datos.telefono || null,
    correo: datos.correo || null,
    direccion: datos.direccion || null,
    logo_url: null,
    limite_usuarios: datos.limite_usuarios || 10,
    limite_sucursales: datos.limite_sucursales || 3,
    limite_cajas: datos.limite_cajas || 2,
    limite_facturas_mes: datos.limite_facturas_mes !== undefined ? datos.limite_facturas_mes : 500,
    moneda: 'DOP',
    itbis_porcentaje: 18,
    total_usuarios: 1,
    total_sucursales: 1,
    volumen_ventas_historico: 0,
    creado_en: new Date().toISOString(),
  };

  const listaActualizada = [nueva, ...locales];
  guardarEmpresasLocales(listaActualizada);
  return nueva;
}

export async function actualizarEstadoEmpresa(
  id: string,
  estado: EstadoEmpresa
): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('empresas').update({ estado }).eq('id', id);
      if (!error) return;
    } catch {
      // fallback
    }
  }

  const locales = obtenerEmpresasLocales();
  const modificados = locales.map((e) => (e.id === id ? { ...e, estado } : e));
  guardarEmpresasLocales(modificados);
}

export async function actualizarPlanEmpresa(
  id: string,
  plan: PlanEmpresa
): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('empresas').update({ plan }).eq('id', id);
      if (!error) {
        const rawUser = localStorage.getItem('mercato_auth_user');
        if (rawUser) {
          try {
            const u = JSON.parse(rawUser);
            if (u && u.empresaId === id) {
              u.empresaPlan = plan;
              localStorage.setItem('mercato_auth_user', JSON.stringify(u));
            }
          } catch {
            // noop
          }
        }
        window.dispatchEvent(new Event('koba_subscription_config_changed'));
        return;
      }
    } catch {
      // fallback
    }
  }

  const locales = obtenerEmpresasLocales();
  const modificados = locales.map((e) => (e.id === id ? { ...e, plan } : e));
  guardarEmpresasLocales(modificados);

  const rawUser = localStorage.getItem('mercato_auth_user');
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser);
      if (u && u.empresaId === id) {
        u.empresaPlan = plan;
        localStorage.setItem('mercato_auth_user', JSON.stringify(u));
      }
    } catch {
      // noop
    }
  }
  window.dispatchEvent(new Event('koba_subscription_config_changed'));
}

export async function actualizarLimitesEmpresa(
  id: string,
  limites: {
    limite_usuarios?: number;
    limite_sucursales?: number;
    limite_cajas?: number;
    limite_facturas_mes?: number;
  }
): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('empresas').update(limites).eq('id', id);
      if (!error) return;
    } catch {
      // fallback
    }
  }

  const locales = obtenerEmpresasLocales();
  const modificados = locales.map((e) => (e.id === id ? { ...e, ...limites } : e));
  guardarEmpresasLocales(modificados);
}

/** Elimina una empresa y sus datos relacionados de la base de datos */
export async function eliminarEmpresa(id: string): Promise<void> {
  const sb = tryGetSupabase();
  if (sb) {
    // 1. Intentar RPC seguro que también limpia cuentas en auth.users
    const res = await sb.rpc('eliminar_empresa_completa', { p_empresa_id: id });
    if (res.error) {
      // 2. Si el RPC no existe aún, borrado directo en cascada
      const { error: delErr } = await sb.from('empresas').delete().eq('id', id);
      if (delErr) {
        console.error('[eliminarEmpresa] Error en Supabase:', delErr);
        throw new Error(delErr.message || 'Error al eliminar la empresa de la base de datos');
      }
    }
  }

  // 3. Limpiar de modo local
  const locales = obtenerEmpresasLocales();
  const filtrados = locales.filter((e) => e.id !== id);
  guardarEmpresasLocales(filtrados);
}
