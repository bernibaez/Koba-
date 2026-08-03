import { getSupabase, isSupabaseConfigured, tryGetSupabase } from './clienteSupabase';
import type { AuditActionType, AuditLog } from '@/lib/auditStore';

function mapRow(row: Record<string, unknown>): AuditLog {
  const creado = row.creado_en ? new Date(String(row.creado_en)) : new Date();
  return {
    id: String(row.id),
    user: String(row.nombre_usuario ?? 'Sistema'),
    role: String(row.rol ?? ''),
    timestamp: creado.toISOString(),
    date: creado.toISOString().slice(0, 10),
    time: creado.toLocaleTimeString('es-DO', { hour12: false }),
    action: String(row.accion) as AuditActionType,
    module: String(row.modulo ?? ''),
    details: String(row.detalle ?? ''),
    before: (row.datos_antes as AuditLog['before']) ?? null,
    after: (row.datos_despues as AuditLog['after']) ?? null,
    ip: String(row.ip ?? ''),
  };
}

export async function obtenerAuditoria(params?: {
  limite?: number;
  busqueda?: string;
  accion?: string;
  signal?: AbortSignal;
}): Promise<AuditLog[]> {
  const sb = tryGetSupabase();
  if (!sb) {
    const { getAuditLogsLocal } = await import('@/lib/auditStore');
    return getAuditLogsLocal();
  }

  let query = sb
    .from('auditoria')
    .select('id, nombre_usuario, rol, accion, modulo, detalle, datos_antes, datos_despues, ip, creado_en')
    .order('creado_en', { ascending: false })
    .limit(params?.limite ?? 200);
  if (params?.accion) query = query.eq('accion', params.accion);
  if (params?.busqueda?.trim()) {
    const q = params.busqueda.trim();
    query = query.or(`nombre_usuario.ilike.%${q}%,modulo.ilike.%${q}%,detalle.ilike.%${q}%`);
  }
  if (params?.signal) query = query.abortSignal(params.signal);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function registrarAuditoria(params: {
  usuario_id?: string | null;
  user: string;
  role: string;
  action: AuditActionType | string;
  module: string;
  details: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}): Promise<AuditLog> {
  const now = new Date();
  const localLike: AuditLog = {
    id: `log-${Date.now()}`,
    user: params.user,
    role: params.role,
    timestamp: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString('es-DO', { hour12: false }),
    action: params.action as AuditActionType,
    module: params.module,
    details: params.details,
    before: (params.before as AuditLog['before']) ?? null,
    after: (params.after as AuditLog['after']) ?? null,
    ip: params.ip || '127.0.0.1',
  };

  if (!isSupabaseConfigured()) {
    const { appendAuditLogLocal } = await import('@/lib/auditStore');
    return appendAuditLogLocal(localLike);
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from('auditoria')
    .insert({
      usuario_id: params.usuario_id ?? null,
      nombre_usuario: params.user,
      rol: params.role,
      accion: params.action,
      modulo: params.module,
      detalle: params.details,
      datos_antes: params.before ?? null,
      datos_despues: params.after ?? null,
      ip: params.ip || null,
    })
    .select('id, nombre_usuario, rol, accion, modulo, detalle, datos_antes, datos_despues, ip, creado_en')
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
