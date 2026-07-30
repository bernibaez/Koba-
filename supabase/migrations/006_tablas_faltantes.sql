-- MarketERP — Tablas faltantes para módulos ERP completos
-- Ejecutar después de 001–005

-- ============================================================
-- Catálogo / configuración
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupos_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    porcentaje_descuento NUMERIC(5, 2) DEFAULT 0.00,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos_clientes(id);

CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial TEXT NOT NULL,
    razon_social TEXT,
    rnc VARCHAR(20),
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    logo_url TEXT,
    moneda VARCHAR(10) DEFAULT 'DOP',
    itbis_porcentaje NUMERIC(5, 2) DEFAULT 18.00,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    sucursal_id UUID REFERENCES sucursales(id),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Compras
-- ============================================================

CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id),
    sucursal_id UUID REFERENCES sucursales(id),
    responsable_id UUID REFERENCES perfiles(id),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_impuesto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(20) DEFAULT 'credito'
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'cheque', 'mixto')),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'recibida', 'anulada')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    recibido_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    nombre_item TEXT NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    cantidad_recibida NUMERIC(10, 3) DEFAULT 0,
    precio_costo NUMERIC(12, 2) NOT NULL,
    precio_venta NUMERIC(12, 2) DEFAULT 0.00,
    porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS devoluciones_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    compra_id UUID REFERENCES compras(id),
    proveedor_id UUID REFERENCES proveedores(id),
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    responsable_id UUID REFERENCES perfiles(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Devoluciones de venta
-- ============================================================

CREATE TABLE IF NOT EXISTS devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    venta_id UUID REFERENCES ventas(id),
    numero_factura VARCHAR(50),
    cliente_id UUID REFERENCES clientes(id),
    cajero_id UUID REFERENCES perfiles(id),
    autorizado_por UUID REFERENCES perfiles(id),
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    motivo TEXT NOT NULL,
    metodo_reembolso VARCHAR(20) DEFAULT 'efectivo'
        CHECK (metodo_reembolso IN ('efectivo', 'tarjeta', 'nota_credito', 'cambio')),
    tipo VARCHAR(10) DEFAULT 'parcial'
        CHECK (tipo IN ('parcial', 'total')),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    motivo_rechazo TEXT,
    revisado_por UUID REFERENCES perfiles(id),
    revisado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    sku VARCHAR(50),
    nombre_item TEXT NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- Cotizaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    vendedor_id UUID REFERENCES perfiles(id),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_impuesto NUMERIC(12, 2) DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'convertida', 'vencida')),
    valida_hasta DATE,
    convertido_venta_id UUID REFERENCES ventas(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    nombre_item TEXT NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- Cuentas por cobrar / pagar
-- ============================================================

CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    venta_id UUID REFERENCES ventas(id),
    numero_factura VARCHAR(50),
    cliente_id UUID REFERENCES clientes(id),
    monto_total NUMERIC(12, 2) NOT NULL,
    monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(12, 2) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'vencida', 'pagada', 'anulada')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_cxc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'mixto')),
    nota TEXT,
    registrado_por UUID REFERENCES perfiles(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuentas_por_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    compra_id UUID REFERENCES compras(id),
    proveedor_id UUID REFERENCES proveedores(id),
    monto_total NUMERIC(12, 2) NOT NULL,
    monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(12, 2) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'vencida', 'pagada', 'anulada')),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_cxp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_por_pagar(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'mixto')),
    nota TEXT,
    registrado_por UUID REFERENCES perfiles(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Gastos
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    presupuesto_mensual NUMERIC(12, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    categoria_id UUID REFERENCES categorias_gasto(id),
    sucursal_id UUID REFERENCES sucursales(id),
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    responsable_id UUID REFERENCES perfiles(id),
    tiene_recibo BOOLEAN DEFAULT FALSE,
    recibo_url TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    caja_id UUID REFERENCES cajas(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Transferencias de stock
-- ============================================================

CREATE TABLE IF NOT EXISTS transferencias_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    sucursal_origen_id UUID REFERENCES sucursales(id),
    sucursal_destino_id UUID REFERENCES sucursales(id),
    responsable_id UUID REFERENCES perfiles(id),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_transito', 'recibida', 'anulada')),
    motivo TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    recibido_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS detalle_transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transferencia_id UUID NOT NULL REFERENCES transferencias_stock(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(10, 3) NOT NULL,
    cantidad_recibida NUMERIC(10, 3) DEFAULT 0
);

-- ============================================================
-- Caja / movimientos / ventas retenidas
-- ============================================================

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    caja_id UUID REFERENCES cajas(id),
    cierre_id UUID REFERENCES cierres_caja(id),
    cajero_id UUID REFERENCES perfiles(id),
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('entrada', 'salida', 'gasto', 'retiro', 'aporte')),
    monto NUMERIC(12, 2) NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas_retenidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etiqueta TEXT NOT NULL,
    cajero_id UUID REFERENCES perfiles(id),
    caja_id UUID REFERENCES cajas(id),
    cliente_id UUID REFERENCES clientes(id),
    payload_carrito JSONB NOT NULL DEFAULT '[]'::jsonb,
    descuento_global NUMERIC(5, 2) DEFAULT 0.00,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Fiscal / NCF historial
-- ============================================================

ALTER TABLE rangos_ncf
    ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

CREATE TABLE IF NOT EXISTS facturas_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id),
    ncf VARCHAR(30) NOT NULL,
    tipo_ncf VARCHAR(10) NOT NULL,
    rnc_cliente VARCHAR(20),
    nombre_cliente TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    itbis NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(30),
    cajero_id UUID REFERENCES perfiles(id),
    items JSONB DEFAULT '[]'::jsonb,
    emitida_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_facturas_fiscales_ncf ON facturas_fiscales(ncf);

-- ============================================================
-- Operación: balanzas, maleta, agentes, auditoría
-- ============================================================

CREATE TABLE IF NOT EXISTS balanzas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    puerto VARCHAR(50),
    protocolo VARCHAR(50),
    sucursal_id UUID REFERENCES sucursales(id),
    activo BOOLEAN DEFAULT TRUE,
    configuracion JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cortes_maleta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    producto_id UUID REFERENCES productos(id),
    nombre_producto TEXT NOT NULL,
    peso_bruto NUMERIC(10, 3) NOT NULL,
    peso_neto NUMERIC(10, 3) NOT NULL,
    merma NUMERIC(10, 3) DEFAULT 0,
    precio_por_libra NUMERIC(12, 2) DEFAULT 0,
    responsable_id UUID REFERENCES perfiles(id),
    sucursal_id UUID REFERENCES sucursales(id),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agentes_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID REFERENCES perfiles(id),
    nombre TEXT NOT NULL,
    correo TEXT,
    telefono VARCHAR(30),
    porcentaje_comision NUMERIC(5, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfiles(id),
    nombre_usuario TEXT,
    rol TEXT,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    detalle TEXT,
    datos_antes JSONB,
    datos_despues JSONB,
    ip VARCHAR(45),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_creado ON compras(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_detalle_compras_compra ON detalle_compras(compra_id);

CREATE INDEX IF NOT EXISTS idx_devoluciones_venta ON devoluciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_creado ON devoluciones(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_cxc_cliente ON cuentas_por_cobrar(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cxc_estado ON cuentas_por_cobrar(estado);
CREATE INDEX IF NOT EXISTS idx_cxc_vencimiento ON cuentas_por_cobrar(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_cxc_cuenta ON pagos_cxc(cuenta_id);

CREATE INDEX IF NOT EXISTS idx_cxp_proveedor ON cuentas_por_pagar(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_cxp_estado ON cuentas_por_pagar(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_cxp_cuenta ON pagos_cxp(cuenta_id);

CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_creado ON gastos(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_transferencias_estado ON transferencias_stock(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja ON movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_creado ON movimientos_caja(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_facturas_fiscales_venta ON facturas_fiscales(venta_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado ON auditoria(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_retenidas_cajero ON ventas_retenidas(cajero_id);

-- ============================================================
-- RLS
-- ============================================================

-- Helper requerido por políticas DELETE (también definido en 004_rls.sql)
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND rol IN ('admin', 'super_admin') AND activo = TRUE
  );
$$;

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_cxc ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_por_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_cxp ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_retenidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE balanzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes_maleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentes_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Lectura autenticada / escritura amplia (ajustar por rol después)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'categorias', 'grupos_clientes', 'configuracion_empresa', 'cajas',
        'compras', 'detalle_compras', 'devoluciones_compra',
        'devoluciones', 'detalle_devoluciones',
        'cotizaciones', 'detalle_cotizaciones',
        'cuentas_por_cobrar', 'pagos_cxc', 'cuentas_por_pagar', 'pagos_cxp',
        'categorias_gasto', 'gastos',
        'transferencias_stock', 'detalle_transferencias',
        'movimientos_caja', 'ventas_retenidas', 'facturas_fiscales',
        'balanzas', 'cortes_maleta', 'agentes_comerciales', 'auditoria'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_select', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);

        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (TRUE)',
            t || '_select', t
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (TRUE)',
            t || '_insert', t
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE)',
            t || '_update', t
        );
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (es_admin())',
            t || '_delete', t
        );
    END LOOP;
END $$;
