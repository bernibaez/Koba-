import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { ConfiguracionEmpresa } from '@/types/database';

export async function obtenerConfiguracionEmpresa(): Promise<ConfiguracionEmpresa | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('configuracion_empresa')
    .select(
      'id, nombre_comercial, razon_social, rnc, telefono, correo, direccion, logo_url, moneda, itbis_porcentaje, actualizado_en'
    )
    .order('actualizado_en', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ConfiguracionEmpresa) ?? null;
}

export async function guardarLogoEmpresa(logoUrl: string | null): Promise<string | null> {
  if (!isSupabaseConfigured()) return logoUrl;

  const sb = getSupabase();
  const existing = await obtenerConfiguracionEmpresa();

  if (existing?.id) {
    const { error } = await sb
      .from('configuracion_empresa')
      .update({ logo_url: logoUrl, actualizado_en: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return logoUrl;
  }

  const { error } = await sb.from('configuracion_empresa').insert({
    nombre_comercial: 'Mercato',
    logo_url: logoUrl,
    moneda: 'DOP',
    itbis_porcentaje: 18,
  });
  if (error) throw error;
  return logoUrl;
}

export async function obtenerLogoEmpresa(): Promise<string | null> {
  const cfg = await obtenerConfiguracionEmpresa();
  return cfg?.logo_url ?? null;
}

export type DatosEmpresaInput = {
  nombre_comercial: string;
  razon_social?: string | null;
  rnc?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  moneda?: string | null;
  itbis_porcentaje?: number | null;
};

export async function guardarConfiguracionEmpresa(datos: DatosEmpresaInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado');
  }
  if (!datos.nombre_comercial.trim()) {
    throw new Error('El nombre de la empresa es obligatorio');
  }

  const sb = getSupabase();
  const existing = await obtenerConfiguracionEmpresa();
  const payload = {
    nombre_comercial: datos.nombre_comercial.trim(),
    razon_social: datos.razon_social?.trim() || null,
    rnc: datos.rnc?.trim() || null,
    telefono: datos.telefono?.trim() || null,
    correo: datos.correo?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    moneda: datos.moneda?.trim() || 'DOP',
    itbis_porcentaje: datos.itbis_porcentaje ?? 18,
    actualizado_en: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from('configuracion_empresa').update(payload).eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await sb.from('configuracion_empresa').insert({
    ...payload,
    logo_url: null,
  });
  if (error) throw error;
}
