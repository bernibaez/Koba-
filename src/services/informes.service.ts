import { tryGetSupabase } from './clienteSupabase';

export type PeriodoInforme = {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

function rangoFin(hasta: string) {
  return `${hasta}T23:59:59.999`;
}

function fmtFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-DO');
  } catch {
    return iso.slice(0, 10);
  }
}

function labelPago(m: string | null | undefined) {
  const map: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    credito: 'Crédito',
    mixto: 'Mixto',
    cheque: 'Cheque',
  };
  return map[(m ?? '').toLowerCase()] ?? m ?? '—';
}

const PAY_COLORS: Record<string, string> = {
  Efectivo: '#16a34a',
  Tarjeta: '#2563eb',
  Transferencia: '#d97706',
  Crédito: '#dc2626',
  Mixto: '#7c3aed',
  Cheque: '#64748b',
};

export type InformeVentas = {
  totalVentas: number;
  tickets: number;
  ticketPromedio: number;
  itbis: number;
  daily: { day: string; ventas: number; tickets: number }[];
  payments: { name: string; value: number; color: string }[];
  rows: (string | number)[][];
};

export async function informeVentas(p: PeriodoInforme): Promise<InformeVentas> {
  const empty: InformeVentas = {
    totalVentas: 0,
    tickets: 0,
    ticketPromedio: 0,
    itbis: 0,
    daily: [],
    payments: [],
    rows: [],
  };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('ventas')
    .select(
      `
      id, numero_factura, creado_en, monto_total, monto_impuesto, metodo_pago, cliente_id,
      clientes ( nombre ),
      detalle_ventas ( id )
    `
    )
    .gte('creado_en', p.desde)
    .lte('creado_en', rangoFin(p.hasta))
    .neq('estado', 'anulada')
    .order('creado_en', { ascending: false })
    .limit(1000);

  if (error) throw error;
  const ventas = data ?? [];

  let totalVentas = 0;
  let itbis = 0;
  const byDay = new Map<string, { ventas: number; tickets: number }>();
  const byPay = new Map<string, number>();

  const rows = ventas.map((v: Record<string, unknown>) => {
    const total = Number(v.monto_total ?? 0);
    const tax = Number(v.monto_impuesto ?? 0);
    totalVentas += total;
    itbis += tax;
    const day = String(v.creado_en).slice(0, 10);
    const cur = byDay.get(day) ?? { ventas: 0, tickets: 0 };
    cur.ventas += total;
    cur.tickets += 1;
    byDay.set(day, cur);
    const pago = labelPago(v.metodo_pago as string);
    byPay.set(pago, (byPay.get(pago) ?? 0) + total);
    const cliente = v.clientes as { nombre?: string } | null;
    const items = (v.detalle_ventas as unknown[] | null)?.length ?? 0;
    return [
      String(v.numero_factura ?? ''),
      fmtFecha(String(v.creado_en)),
      cliente?.nombre ?? 'Cliente general',
      items,
      pago,
      '—',
      total,
    ];
  });

  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => ({ day: day.slice(5), ventas: d.ventas, tickets: d.tickets }));

  const payTotal = [...byPay.values()].reduce((s, n) => s + n, 0) || 1;
  const payments = [...byPay.entries()].map(([name, amount]) => ({
    name,
    value: Math.round((amount / payTotal) * 100),
    color: PAY_COLORS[name] ?? '#64748b',
  }));

  return {
    totalVentas,
    tickets: ventas.length,
    ticketPromedio: ventas.length ? totalVentas / ventas.length : 0,
    itbis,
    daily,
    payments,
    rows: rows.map((r) => [
      r[0],
      r[1],
      r[2],
      r[3],
      r[4],
      r[5],
      `RD$ ${Number(r[6]).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ]),
  };
}

export type InformeGanancias = {
  ventas: number;
  costo: number;
  gananciaBruta: number;
  itbis: number;
  gananciaNeta: number;
  qtySold: number;
  prodsSold: number;
  customers: number;
  payments: { name: string; value: number; color: string }[];
};

export async function informeGananciasPerdidas(p: PeriodoInforme): Promise<InformeGanancias> {
  const empty: InformeGanancias = {
    ventas: 0,
    costo: 0,
    gananciaBruta: 0,
    itbis: 0,
    gananciaNeta: 0,
    qtySold: 0,
    prodsSold: 0,
    customers: 0,
    payments: [],
  };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('ventas')
    .select('monto_total, monto_impuesto, costo_total, metodo_pago, cliente_id, detalle_ventas(cantidad, producto_id)')
    .gte('creado_en', p.desde)
    .lte('creado_en', rangoFin(p.hasta))
    .neq('estado', 'anulada')
    .limit(2000);

  if (error) throw error;
  const ventas = data ?? [];
  let ventasSum = 0;
  let costo = 0;
  let itbis = 0;
  let qtySold = 0;
  const prods = new Set<string>();
  const clients = new Set<string>();
  const byPay = new Map<string, number>();

  for (const v of ventas as Record<string, unknown>[]) {
    ventasSum += Number(v.monto_total ?? 0);
    costo += Number(v.costo_total ?? 0);
    itbis += Number(v.monto_impuesto ?? 0);
    if (v.cliente_id) clients.add(String(v.cliente_id));
    const pago = labelPago(v.metodo_pago as string);
    byPay.set(pago, (byPay.get(pago) ?? 0) + Number(v.monto_total ?? 0));
    for (const d of (v.detalle_ventas as { cantidad?: number; producto_id?: string }[]) ?? []) {
      qtySold += Number(d.cantidad ?? 0);
      if (d.producto_id) prods.add(d.producto_id);
    }
  }

  const gananciaBruta = ventasSum - costo;
  const payments = [...byPay.entries()].map(([name, value]) => ({
    name,
    value,
    color: PAY_COLORS[name] ?? '#64748b',
  }));

  return {
    ventas: ventasSum,
    costo,
    gananciaBruta,
    itbis,
    gananciaNeta: gananciaBruta - itbis * 0, // neto operativo ≈ bruta (ITBIS es passthrough)
    qtySold,
    prodsSold: prods.size,
    customers: clients.size,
    payments,
  };
}

export type ProductoGanancia = {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  unit?: string;
  saleType?: string;
  weightUnit?: string;
  isWeightProduct?: boolean;
  totalCost: number;
  totalSales: number;
  profit: number;
  margin: number;
};

export async function informeGananciasProducto(p: PeriodoInforme): Promise<ProductoGanancia[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('detalle_ventas')
    .select(
      `
      nombre_item, cantidad, precio_unitario, costo_unitario, subtotal, producto_id,
      ventas!inner ( creado_en, estado ),
      productos ( sku, categoria, nombre, unidad, sale_type, weight_unit, is_weight_product, es_pesado )
    `
    )
    .gte('ventas.creado_en', p.desde)
    .lte('ventas.creado_en', rangoFin(p.hasta))
    .neq('ventas.estado', 'anulada')
    .limit(5000);

  if (error) {
    // Fallback sin join estricto si la relación no está tipada
    const ventas = await informeVentas(p);
    void ventas;
    throw error;
  }

  const map = new Map<string, ProductoGanancia>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const prod = row.productos as {
      sku?: string;
      categoria?: string;
      nombre?: string;
      unidad?: string;
      sale_type?: string;
      weight_unit?: string;
      is_weight_product?: boolean;
      es_pesado?: boolean;
    } | null;
    const key = String(row.producto_id ?? row.nombre_item);
    const qty = Number(row.cantidad ?? 0);
    const sales = Number(row.subtotal ?? qty * Number(row.precio_unitario ?? 0));
    const cost = qty * Number(row.costo_unitario ?? 0);
    const isWeight = prod?.is_weight_product || prod?.es_pesado || prod?.sale_type === 'weight' || prod?.sale_type === 'both';
    const cur = map.get(key) ?? {
      id: key,
      name: prod?.nombre ?? String(row.nombre_item ?? 'Producto'),
      sku: prod?.sku ?? '—',
      category: prod?.categoria ?? 'General',
      qty: 0,
      unit: prod?.unidad ?? prod?.weight_unit ?? (isWeight ? 'lb' : 'Unidad'),
      saleType: prod?.sale_type ?? (isWeight ? 'weight' : 'unit'),
      weightUnit: prod?.weight_unit ?? 'lb',
      isWeightProduct: isWeight,
      totalCost: 0,
      totalSales: 0,
      profit: 0,
      margin: 0,
    };
    cur.qty += qty;
    cur.totalCost += cost;
    cur.totalSales += sales;
    cur.profit = cur.totalSales - cur.totalCost;
    cur.margin = cur.totalSales > 0 ? (cur.profit / cur.totalSales) * 100 : 0;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.profit - a.profit);
}

export type InformeCompras = {
  total: number;
  ordenes: number;
  pendientes: number;
  pendientesMonto: number;
  rows: (string | number)[][];
};

export async function informeCompras(p: PeriodoInforme): Promise<InformeCompras> {
  const empty: InformeCompras = { total: 0, ordenes: 0, pendientes: 0, pendientesMonto: 0, rows: [] };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('compras')
    .select(
      `
      codigo, creado_en, estado, monto_total,
      proveedores ( nombre ),
      detalle_compras ( cantidad )
    `
    )
    .gte('creado_en', p.desde)
    .lte('creado_en', rangoFin(p.hasta))
    .order('creado_en', { ascending: false })
    .limit(500);

  if (error) throw error;
  const rowsRaw = data ?? [];
  let total = 0;
  let pendientes = 0;
  let pendientesMonto = 0;

  const estadoLabel: Record<string, string> = {
    recibida: 'Recibida',
    pendiente: 'Pendiente',
    parcial: 'Parcial',
    anulada: 'Anulada',
  };

  const rows = rowsRaw.map((c: Record<string, unknown>) => {
    const monto = Number(c.monto_total ?? 0);
    total += monto;
    if (c.estado === 'pendiente' || c.estado === 'parcial') {
      pendientes += 1;
      pendientesMonto += monto;
    }
    const prov = c.proveedores as { nombre?: string } | null;
    const items = ((c.detalle_compras as { cantidad?: number }[]) ?? []).reduce(
      (s, d) => s + Number(d.cantidad ?? 0),
      0
    );
    return [
      String(c.codigo),
      fmtFecha(String(c.creado_en)),
      prov?.nombre ?? 'Sin proveedor',
      estadoLabel[String(c.estado)] ?? String(c.estado),
      items,
      `RD$ ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ];
  });

  return { total, ordenes: rowsRaw.length, pendientes, pendientesMonto, rows };
}

export type InformeInventario = {
  valor: number;
  skus: number;
  bajos: number;
  agotados: number;
  rows: (string | number)[][];
};

export async function informeInventario(): Promise<InformeInventario> {
  const empty: InformeInventario = { valor: 0, skus: 0, bajos: 0, agotados: 0, rows: [] };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('productos')
    .select('sku, nombre, categoria, stock_actual, stock_minimo, precio_costo, estado')
    .eq('estado', 'activo')
    .order('nombre')
    .limit(2000);

  if (error) throw error;
  const prods = data ?? [];
  let valor = 0;
  let bajos = 0;
  let agotados = 0;

  const rows = prods.map((p) => {
    const stock = Number(p.stock_actual ?? 0);
    const min = Number(p.stock_minimo ?? 0);
    const val = stock * Number(p.precio_costo ?? 0);
    valor += val;
    if (stock <= 0) agotados += 1;
    else if (stock <= min) bajos += 1;
    const estado = stock <= 0 ? 'Agotado' : stock <= min ? 'Bajo' : 'OK';
    return [
      p.sku,
      p.nombre,
      p.categoria,
      stock,
      min,
      `RD$ ${val.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      estado,
    ];
  });

  return { valor, skus: prods.length, bajos, agotados, rows };
}

export type InformeAjustes = {
  total: number;
  entradas: number;
  salidas: number;
  rows: {
    code: string;
    productName: string;
    sku: string;
    type: string;
    previousQty: number;
    newQty: number;
    reason: string;
    date: string;
  }[];
};

export async function informeAjustes(p: PeriodoInforme): Promise<InformeAjustes> {
  const empty: InformeAjustes = { total: 0, entradas: 0, salidas: 0, rows: [] };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('ajustes_stock')
    .select(
      `
      codigo, tipo_ajuste, cantidad_anterior, cantidad_nueva, motivo, creado_en,
      productos ( nombre, sku )
    `
    )
    .gte('creado_en', p.desde)
    .lte('creado_en', rangoFin(p.hasta))
    .order('creado_en', { ascending: false })
    .limit(500);

  if (error) throw error;
  const list = data ?? [];
  let entradas = 0;
  let salidas = 0;
  const rows = list.map((a: Record<string, unknown>) => {
    const tipo = String(a.tipo_ajuste);
    if (tipo === 'entrada') entradas += 1;
    else salidas += 1;
    const prod = a.productos as { nombre?: string; sku?: string } | null;
    return {
      code: String(a.codigo),
      productName: prod?.nombre ?? 'Producto',
      sku: prod?.sku ?? '—',
      type: tipo,
      previousQty: Number(a.cantidad_anterior),
      newQty: Number(a.cantidad_nueva),
      reason: String(a.motivo ?? ''),
      date: fmtFecha(String(a.creado_en)),
    };
  });
  return { total: list.length, entradas, salidas, rows };
}

export type InformeGastos = {
  aprobados: number;
  pendientes: number;
  total: number;
  rows: (string | number)[][];
};

export async function informeGastos(p: PeriodoInforme): Promise<InformeGastos> {
  const empty: InformeGastos = { aprobados: 0, pendientes: 0, total: 0, rows: [] };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const { data, error } = await sb
    .from('gastos')
    .select(
      `
      codigo, descripcion, monto, estado, creado_en,
      categorias_gasto ( nombre )
    `
    )
    .gte('creado_en', p.desde)
    .lte('creado_en', rangoFin(p.hasta))
    .order('creado_en', { ascending: false })
    .limit(500);

  if (error) throw error;
  const list = data ?? [];
  let aprobados = 0;
  let pendientes = 0;
  let total = 0;

  const rows = list.map((g: Record<string, unknown>) => {
    const monto = Number(g.monto ?? 0);
    total += monto;
    if (g.estado === 'aprobado') aprobados += monto;
    if (g.estado === 'pendiente') pendientes += monto;
    const cat = g.categorias_gasto as { nombre?: string } | null;
    return [
      String(g.codigo),
      fmtFecha(String(g.creado_en)),
      cat?.nombre ?? 'Sin categoría',
      String(g.descripcion),
      `RD$ ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      String(g.estado),
    ];
  });

  return { aprobados, pendientes, total, rows };
}

export type InformeClientes = {
  total: number;
  cxcPendiente: number;
  ticketPromedio: number;
  rows: (string | number)[][];
  pendingRows: (string | number)[][];
};

export async function informeClientes(p: PeriodoInforme): Promise<InformeClientes> {
  const empty: InformeClientes = {
    total: 0,
    cxcPendiente: 0,
    ticketPromedio: 0,
    rows: [],
    pendingRows: [],
  };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const [cliRes, cxcRes, ventRes] = await Promise.all([
    sb.from('clientes').select('id, codigo, nombre, telefono, balance_actual, activo').eq('activo', true).order('nombre').limit(500),
    sb
      .from('cuentas_por_cobrar')
      .select('codigo, numero_factura, saldo, fecha_vencimiento, estado, clientes(nombre)')
      .in('estado', ['pendiente', 'parcial', 'vencida'])
      .limit(200),
    sb
      .from('ventas')
      .select('cliente_id, monto_total, creado_en, numero_factura, clientes(nombre)')
      .gte('creado_en', p.desde)
      .lte('creado_en', rangoFin(p.hasta))
      .neq('estado', 'anulada')
      .limit(1000),
  ]);

  if (cliRes.error) throw cliRes.error;
  const clientes = cliRes.data ?? [];
  const cxc = cxcRes.data ?? [];
  const ventas = ventRes.data ?? [];

  const cxcPendiente = cxc.reduce((s, c) => s + Number(c.saldo ?? 0), 0);
  const ventasSum = ventas.reduce((s, v) => s + Number(v.monto_total ?? 0), 0);

  const byClient = new Map<string, { nombre: string; total: number; last: string; factura: string }>();
  for (const v of ventas as Record<string, unknown>[]) {
    const id = String(v.cliente_id ?? 'sin');
    const cli = v.clientes as { nombre?: string } | null;
    const cur = byClient.get(id) ?? {
      nombre: cli?.nombre ?? 'Cliente general',
      total: 0,
      last: String(v.creado_en),
      factura: String(v.numero_factura ?? ''),
    };
    cur.total += Number(v.monto_total ?? 0);
    if (String(v.creado_en) > cur.last) {
      cur.last = String(v.creado_en);
      cur.factura = String(v.numero_factura ?? '');
    }
    byClient.set(id, cur);
  }

  const rows = clientes.map((c) => {
    const stats = byClient.get(c.id);
    return [
      c.codigo,
      c.nombre,
      c.telefono ?? '—',
      `RD$ ${Number(c.balance_actual ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      stats ? `RD$ ${stats.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : 'RD$ 0.00',
    ];
  });

  const pendingRows = cxc.map((c: Record<string, unknown>) => {
    const cli = c.clientes as { nombre?: string } | null;
    return [
      String(c.codigo),
      cli?.nombre ?? '—',
      String(c.numero_factura ?? '—'),
      String(c.fecha_vencimiento ?? ''),
      `RD$ ${Number(c.saldo).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      String(c.estado),
    ];
  });

  return {
    total: clientes.length,
    cxcPendiente,
    ticketPromedio: ventas.length ? ventasSum / ventas.length : 0,
    rows,
    pendingRows,
  };
}

export type InformeProveedores = {
  total: number;
  cxpPendiente: number;
  rows: (string | number)[][];
  purchaseRows: (string | number)[][];
};

export async function informeProveedores(p: PeriodoInforme): Promise<InformeProveedores> {
  const empty: InformeProveedores = { total: 0, cxpPendiente: 0, rows: [], purchaseRows: [] };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const [provRes, cxpRes, compRes] = await Promise.all([
    sb.from('proveedores').select('id, codigo, nombre, telefono, activo').eq('activo', true).order('nombre').limit(500),
    sb
      .from('cuentas_por_pagar')
      .select('codigo, saldo, estado, proveedores(nombre)')
      .in('estado', ['pendiente', 'parcial', 'vencida'])
      .limit(200),
    sb
      .from('compras')
      .select('codigo, creado_en, monto_total, estado, proveedores(nombre)')
      .gte('creado_en', p.desde)
      .lte('creado_en', rangoFin(p.hasta))
      .order('creado_en', { ascending: false })
      .limit(200),
  ]);

  if (provRes.error) throw provRes.error;
  const proveedores = provRes.data ?? [];
  const cxp = cxpRes.data ?? [];
  const compras = compRes.data ?? [];
  const cxpPendiente = cxp.reduce((s, c) => s + Number(c.saldo ?? 0), 0);

  const rows = proveedores.map((p) => [
    p.codigo,
    p.nombre,
    p.telefono ?? '—',
    p.activo ? 'Activo' : 'Inactivo',
  ]);

  const purchaseRows = compras.map((c: Record<string, unknown>) => {
    const prov = c.proveedores as { nombre?: string } | null;
    return [
      String(c.codigo),
      fmtFecha(String(c.creado_en)),
      prov?.nombre ?? '—',
      `RD$ ${Number(c.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      String(c.estado),
    ];
  });

  return { total: proveedores.length, cxpPendiente, rows, purchaseRows };
}

export type InformeAgentes = {
  activos: number;
  rows: (string | number)[][];
};

export async function informeAgentes(): Promise<InformeAgentes> {
  const sb = tryGetSupabase();
  if (!sb) return { activos: 0, rows: [] };

  const { data, error } = await sb
    .from('agentes_comerciales')
    .select('nombre, correo, telefono, porcentaje_comision, activo')
    .order('nombre')
    .limit(200);

  if (error) throw error;
  const list = data ?? [];
  return {
    activos: list.filter((a) => a.activo).length,
    rows: list.map((a) => [
      a.nombre,
      a.correo ?? '—',
      a.telefono ?? '—',
      `${Number(a.porcentaje_comision).toFixed(2)}%`,
      a.activo ? 'Activo' : 'Inactivo',
    ]),
  };
}

export type InformeCaja = {
  efectivo: number;
  tarjeta: number;
  diferencia: number;
  fondo: number;
  sessions: (string | number)[][];
  movements: (string | number)[][];
};

export async function informeCaja(p: PeriodoInforme): Promise<InformeCaja> {
  const empty: InformeCaja = {
    efectivo: 0,
    tarjeta: 0,
    diferencia: 0,
    fondo: 0,
    sessions: [],
    movements: [],
  };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const [cierresRes, ventasRes] = await Promise.all([
    sb
      .from('cierres_caja')
      .select('*')
      .gte('abierta_en', p.desde)
      .lte('abierta_en', rangoFin(p.hasta))
      .order('abierta_en', { ascending: false })
      .limit(100),
    sb
      .from('ventas')
      .select('numero_factura, creado_en, metodo_pago, monto_total, monto_efectivo, monto_tarjeta')
      .gte('creado_en', p.desde)
      .lte('creado_en', rangoFin(p.hasta))
      .neq('estado', 'anulada')
      .order('creado_en', { ascending: false })
      .limit(200),
  ]);

  if (cierresRes.error) throw cierresRes.error;
  const cierres = cierresRes.data ?? [];
  const ventas = ventasRes.data ?? [];

  const efectivo = cierres.reduce((s, c) => s + Number(c.total_efectivo ?? 0), 0);
  const tarjeta = cierres.reduce((s, c) => s + Number(c.total_tarjeta ?? 0), 0);
  const diferencia = cierres.reduce((s, c) => s + Number(c.monto_diferencia ?? 0), 0);
  const fondo = cierres.reduce((s, c) => s + Number(c.monto_apertura ?? 0), 0);

  const sessions = cierres.map((c) => [
    c.codigo,
    fmtFecha(c.abierta_en),
    c.caja_id,
    `RD$ ${Number(c.total_ventas).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${Number(c.total_efectivo).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${Number(c.monto_esperado).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${Number(c.monto_real).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${Number(c.monto_diferencia).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
  ]);

  const movements = ventas.slice(0, 50).map((v) => [
    new Date(v.creado_en).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    'Venta',
    `${v.numero_factura} · ${labelPago(v.metodo_pago)}`,
    `RD$ ${Number(v.monto_efectivo ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    `RD$ ${Number(v.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
  ]);

  return { efectivo, tarjeta, diferencia, fondo, sessions, movements };
}

export type InformeFiscal = {
  ventasGravadas: number;
  itbisCobrado: number;
  itbisCredito: number;
  itbisNeto: number;
  ncfRows: (string | number)[][];
  form606: (string | number)[][];
  form607: (string | number)[][];
};

export async function informeFiscal(p: PeriodoInforme): Promise<InformeFiscal> {
  const empty: InformeFiscal = {
    ventasGravadas: 0,
    itbisCobrado: 0,
    itbisCredito: 0,
    itbisNeto: 0,
    ncfRows: [],
    form606: [],
    form607: [],
  };
  const sb = tryGetSupabase();
  if (!sb) return empty;

  const [fiscalRes, comprasRes, ventasRes] = await Promise.all([
    sb
      .from('facturas_fiscales')
      .select('ncf, tipo_ncf, rnc_cliente, nombre_cliente, subtotal, itbis, monto_total, emitida_en')
      .gte('emitida_en', p.desde)
      .lte('emitida_en', rangoFin(p.hasta))
      .order('emitida_en', { ascending: false })
      .limit(500),
    sb
      .from('compras')
      .select('codigo, monto_total, monto_impuesto, creado_en, proveedores(nombre, rnc)')
      .gte('creado_en', p.desde)
      .lte('creado_en', rangoFin(p.hasta))
      .limit(500),
    sb
      .from('ventas')
      .select('numero_factura, ncf, tipo_ncf, subtotal, monto_impuesto, monto_total, creado_en, clientes(nombre, rnc_cedula)')
      .gte('creado_en', p.desde)
      .lte('creado_en', rangoFin(p.hasta))
      .neq('estado', 'anulada')
      .limit(500),
  ]);

  const fiscales = fiscalRes.data ?? [];
  const compras = comprasRes.data ?? [];
  const ventas = ventasRes.data ?? [];

  const itbisCobrado =
    fiscales.reduce((s, f) => s + Number(f.itbis ?? 0), 0) ||
    ventas.reduce((s, v) => s + Number(v.monto_impuesto ?? 0), 0);
  const ventasGravadas =
    fiscales.reduce((s, f) => s + Number(f.subtotal ?? 0), 0) ||
    ventas.reduce((s, v) => s + Number(v.subtotal ?? 0), 0);
  const itbisCredito = compras.reduce((s, c) => s + Number(c.monto_impuesto ?? 0), 0);

  const ncfRows = (fiscales.length ? fiscales : ventas).map((f: Record<string, unknown>) => {
    const cli = f.clientes as { nombre?: string; rnc_cedula?: string } | null;
    return [
      String(f.ncf ?? f.numero_factura ?? '—'),
      String(f.tipo_ncf ?? '—'),
      fmtFecha(String(f.emitida_en ?? f.creado_en)),
      String(f.nombre_cliente ?? cli?.nombre ?? '—'),
      String(f.rnc_cliente ?? cli?.rnc_cedula ?? '—'),
      `RD$ ${Number(f.monto_total ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ];
  });

  const form606 = compras.map((c: Record<string, unknown>) => {
    const prov = c.proveedores as { nombre?: string; rnc?: string } | null;
    return [
      String(c.codigo),
      fmtFecha(String(c.creado_en)),
      prov?.rnc ?? '—',
      prov?.nombre ?? '—',
      `RD$ ${Number(c.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `RD$ ${Number(c.monto_impuesto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ];
  });

  const form607 = ventas.map((v: Record<string, unknown>) => {
    const cli = v.clientes as { nombre?: string; rnc_cedula?: string } | null;
    return [
      String(v.ncf ?? v.numero_factura ?? '—'),
      fmtFecha(String(v.creado_en)),
      cli?.rnc_cedula ?? '—',
      cli?.nombre ?? 'Consumidor final',
      `RD$ ${Number(v.monto_total).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `RD$ ${Number(v.monto_impuesto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ];
  });

  return {
    ventasGravadas,
    itbisCobrado,
    itbisCredito,
    itbisNeto: itbisCobrado - itbisCredito,
    ncfRows,
    form606,
    form607,
  };
}

export type InformeCombos = {
  totalCombos: number;
  vendidos: number;
  ingreso: number;
  rows: (string | number)[][];
};

export async function informeCombos(p: PeriodoInforme): Promise<InformeCombos> {
  const sb = tryGetSupabase();
  if (!sb) return { totalCombos: 0, vendidos: 0, ingreso: 0, rows: [] };

  const [combosRes, detRes] = await Promise.all([
    sb.from('combos').select('id, codigo, nombre, precio_venta, activo').order('nombre').limit(200),
    sb
      .from('detalle_ventas')
      .select('combo_id, nombre_item, cantidad, subtotal, ventas!inner(creado_en, estado)')
      .not('combo_id', 'is', null)
      .gte('ventas.creado_en', p.desde)
      .lte('ventas.creado_en', rangoFin(p.hasta))
      .neq('ventas.estado', 'anulada')
      .limit(2000),
  ]);

  if (combosRes.error) throw combosRes.error;
  const combos = combosRes.data ?? [];
  const dets = detRes.data ?? [];

  const byCombo = new Map<string, { qty: number; ingreso: number; name: string }>();
  for (const d of dets as Record<string, unknown>[]) {
    const id = String(d.combo_id);
    const cur = byCombo.get(id) ?? { qty: 0, ingreso: 0, name: String(d.nombre_item) };
    cur.qty += Number(d.cantidad ?? 0);
    cur.ingreso += Number(d.subtotal ?? 0);
    byCombo.set(id, cur);
  }

  let vendidos = 0;
  let ingreso = 0;
  const rows = combos.map((c) => {
    const stats = byCombo.get(c.id) ?? { qty: 0, ingreso: 0, name: c.nombre };
    vendidos += stats.qty;
    ingreso += stats.ingreso;
    return [
      c.codigo,
      c.nombre,
      c.activo ? 'Activo' : 'Inactivo',
      stats.qty,
      `RD$ ${Number(c.precio_venta).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `RD$ ${stats.ingreso.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
    ];
  });

  return { totalCombos: combos.length, vendidos, ingreso, rows };
}

export type StockDetalleItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min: number;
  value: number;
};

export async function informeStockDetalle(): Promise<StockDetalleItem[]> {
  const inv = await informeInventario();
  // Re-fetch structured
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('productos')
    .select('id, sku, nombre, categoria, stock_actual, stock_minimo, precio_costo')
    .eq('estado', 'activo')
    .order('nombre')
    .limit(2000);
  if (error) throw error;
  void inv;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.nombre,
    sku: p.sku,
    category: p.categoria,
    stock: Number(p.stock_actual),
    min: Number(p.stock_minimo),
    value: Number(p.stock_actual) * Number(p.precio_costo),
  }));
}
