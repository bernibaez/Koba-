/**
 * Tipos para el CRM Profesional de KOBA Cloud
 */

export type CRMLeadEtapa = 'nuevo' | 'contactado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';

export type CRMPrioridad = 'baja' | 'media' | 'alta' | 'urgente';

export type CRMLeadTemperatura = 'frio' | 'tibio' | 'caliente';

export type CRMCanalOrigen = 'whatsapp' | 'web' | 'visita' | 'referido' | 'redes' | 'telefono' | 'otro';

export type CRMTipoActividad = 'llamada' | 'whatsapp' | 'reunion' | 'nota' | 'correo' | 'tarea' | 'cobro';

export interface CRMLead {
  id: string;
  titulo: string;
  contacto_nombre: string;
  empresa_nombre?: string;
  telefono?: string;
  correo?: string;
  etapa: CRMLeadEtapa;
  valor_estimado: number;
  probabilidad: number; // 0-100
  prioridad: CRMPrioridad;
  temperatura?: CRMLeadTemperatura;
  canal_origen: CRMCanalOrigen;
  vendedor_asignado?: string;
  cliente_id?: string | null;
  notas?: string;
  ultimo_contacto_en?: string;
  fecha_cierre_esperada?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CRMActividad {
  id: string;
  lead_id?: string | null;
  lead_titulo?: string;
  cliente_id?: string | null;
  contacto_nombre?: string;
  telefono?: string;
  tipo: CRMTipoActividad;
  titulo: string;
  descripcion?: string;
  prioridad?: CRMPrioridad;
  fecha_programada?: string;
  hora_programada?: string;
  fecha_vencimiento?: string;
  completada: boolean;
  resultado_nota?: string;
  recordatorio_activo?: boolean;
  usuario_nombre: string;
  creado_en: string;
}

export interface CRMClienteTimeline {
  actividades: CRMActividad[];
  ventas_count: number;
  total_comprado: number;
  balance_pendiente: number;
  cotizaciones_count: number;
}

export type CRMSegmentoRFMTipo = 'campeon' | 'leal' | 'en_riesgo' | 'prometedor' | 'dormido';

export interface CRMSegmentoRFMCliente {
  cliente_id: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  empresa?: string;
  recencia_dias: number;
  frecuencia_compras: number;
  monto_total: number;
  ticket_promedio: number;
  segmento: CRMSegmentoRFMTipo;
  puntaje_rfm: string;
  accion_sugerida: string;
  ultima_compra_fecha?: string;
}

export interface CRMDashboardMetricas {
  total_leads: number;
  pipeline_valor_total: number;
  oportunidades_ganadas: number;
  monto_ganado_mes: number;
  tasa_conversion_pct: number;
  ticket_promedio: number;
  tiempo_ciclo_promedio_dias: number;
  meta_mes_monto: number;
  meta_mes_actual: number;
  actividad_semanal: {
    dia: string;
    label: string;
    valor: number;
    ganados: number;
    tareas: number;
    porcentaje: number;
  }[];
  top_vendedores: {
    nombre: string;
    rol: string;
    tratos_cerrados: number;
    monto_total: number;
    meta_pct: number;
  }[];
  resumen_rfm: {
    segmento: CRMSegmentoRFMTipo;
    label: string;
    color: string;
    total_clientes: number;
    total_facturado: number;
    porcentaje: number;
  }[];
}

export interface CRMFacturaPreload {
  cliente_id?: string;
  cliente_nombre?: string;
  rnc_cedula?: string;
  telefono?: string;
  lead_id?: string;
  cotizacion_id?: string;
  items?: {
    producto_id?: string;
    nombre_item: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  subtotal?: number;
  monto_total?: number;
}


