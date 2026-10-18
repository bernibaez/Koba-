-- ==============================================================================
-- KOBA / Kob Cloud ERP — ESQUEMA COMPLETO MULTI-TENANT (TODO-EN-UNO)
-- ==============================================================================
-- Este script crea la base de datos completa de KOBA desde cero con arquitectura
-- Multi-Tenant, Row Level Security (RLS), procedimientos almacenados (RPCs) y
-- soporte para el panel Super-Admin de Kob Cloud.
--
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase (https://supabase.com/dashboard)
-- 2. Ve a SQL Editor -> New query
-- 3. Pega todo el contenido de este archivo y haz clic en RUN.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TENANTS: TABLA MAESTRA DE EMPRESAS / NEGOCIOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,               -- Slug único: 'koba-central', 'farmacia-norte'
    nombre TEXT NOT NULL,                             -- Nombre comercial
    razon_social TEXT,
    rnc VARCHAR(20),
    plan VARCHAR(20) DEFAULT 'pro'                    -- 'free', 'starter', 'pro', 'enterprise'
        CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    estado VARCHAR(20) DEFAULT 'activo'               -- 'activo', 'suspendido', 'trial', 'cancelado'
        CHECK (estado IN ('activo', 'suspendido', 'trial', 'cancelado')),
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    logo_url TEXT,
    limite_usuarios INT DEFAULT 10,
    limite_sucursales INT DEFAULT 3,
    limite_cajas INT DEFAULT 2,
    limite_facturas_mes INT DEFAULT 500,
    moneda VARCHAR(10) DEFAULT 'DOP',
    itbis_porcentaje NUMERIC(5, 2) DEFAULT 18.00,
    fecha_renovacion DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    configuracion JSONB DEFAULT '{
      "ncf_habilitado": true,
      "impresion_termica": true,
      "stock_negativo": false,
      "notificaciones_stock": true
    }'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. SUCURSALES (Multi-Tenant)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono VARCHAR(30),
    rnc VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_sucursal_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ==============================================================================
-- 3. PERFILES DE USUARIOS (Vinculados a auth.users y a su empresa)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    telefono VARCHAR(30),
    rol TEXT NOT NULL DEFAULT 'cajero'
        CHECK (rol IN ('admin', 'super_admin', 'cajero', 'almacen', 'contable', 'vendedor')),
    es_superadmin BOOLEAN DEFAULT FALSE,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    codigo_acceso VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ROLES Y MATRIZ DE PERMISOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE, -- NULL = Roles globales base
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. FUNCIONES DE SEGURIDAD (SECURITY DEFINER)
-- ==============================================================================

CREATE OR REPLACE FUNCTION obtener_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id 
  FROM perfiles 
  WHERE id = auth.uid() AND activo = TRUE 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION es_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT es_superadmin FROM perfiles WHERE id = auth.uid() AND activo = TRUE),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION es_admin_empresa()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() 
      AND (rol IN ('admin', 'super_admin') OR es_superadmin = TRUE)
      AND activo = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION obtener_rol_actual()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;

-- Trigger automático para inyectar empresa_id si viene nulo
CREATE OR REPLACE FUNCTION auto_asignar_empresa_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := obtener_empresa_id();
  END IF;
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 6. CATÁLOGOS BASE: PROVEEDORES, CATEGORÍAS, CLIENTES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_proveedor_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_categoria_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS grupos_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    porcentaje_descuento NUMERIC(5, 2) DEFAULT 0.00,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_grupo_cliente_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    rnc_cedula VARCHAR(20),
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    grupo_id UUID REFERENCES grupos_clientes(id) ON DELETE SET NULL,
    tipo_cliente VARCHAR(20) DEFAULT 'final'
        CHECK (tipo_cliente IN ('final', 'fiscal', 'credito')),
    limite_credito NUMERIC(12, 2) DEFAULT 0.00,
    balance_actual NUMERIC(12, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cliente_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ==============================================================================
-- 7. PRODUCTOS Y COMBOS (Soporte balanza, PLU, inventario decimal)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_barras VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    plu TEXT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    marca TEXT,
    unidad TEXT NOT NULL DEFAULT 'Unidad',
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    precio_costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    precio_venta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    precio_mayorista NUMERIC(12, 2) DEFAULT 0.00,
    porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00,
    stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 10.000,
    stock_actual NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    es_pesado BOOLEAN DEFAULT FALSE,
    sale_type VARCHAR(20) DEFAULT 'unit',
    weight_unit VARCHAR(10) DEFAULT 'lb',
    price_per_weight NUMERIC(12, 2) DEFAULT 0.00,
    allow_decimal BOOLEAN DEFAULT TRUE,
    min_weight NUMERIC(10, 3) DEFAULT 0.010,
    max_weight NUMERIC(10, 3) DEFAULT 100.000,
    generate_scale_barcode BOOLEAN DEFAULT FALSE,
    is_weight_product BOOLEAN DEFAULT FALSE,
    fecha_vencimiento DATE,
    garantia TEXT,
    imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo', 'descontinuado')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_producto_empresa_sku UNIQUE (empresa_id, sku),
    CONSTRAINT uq_producto_empresa_codigo_barras UNIQUE (empresa_id, codigo_barras)
);

CREATE TABLE IF NOT EXISTS combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(100),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    precio_venta NUMERIC(12, 2) NOT NULL,
    precio_costo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    precio_normal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tipo_descuento VARCHAR(20) CHECK (tipo_descuento IN ('fijo', 'porcentaje', 'monto')),
    valor_descuento NUMERIC(12, 2) DEFAULT 0.00,
    porcentaje_margen NUMERIC(5, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    visible_en_pos BOOLEAN DEFAULT TRUE,
    permitir_venta_sin_stock BOOLEAN DEFAULT FALSE,
    fecha_inicio DATE,
    fecha_fin DATE,
    imagen_url TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_combo_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 3) NOT NULL DEFAULT 1,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ==============================================================================
-- 8. COMPROBANTES FISCALES (NCF - RD) & CONFIGURACIÓN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS rangos_ncf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_ncf VARCHAR(10) NOT NULL,
    prefijo VARCHAR(10) NOT NULL,
    secuencia_actual BIGINT NOT NULL DEFAULT 0,
    secuencia_fin BIGINT NOT NULL,
    fecha_vencimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
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

-- ==============================================================================
-- 9. CAJAS Y CIERRES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_caja_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    caja_id VARCHAR(50) NOT NULL,
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    monto_apertura NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_esperado NUMERIC(12, 2) NOT NULL,
    monto_real NUMERIC(12, 2) NOT NULL,
    monto_diferencia NUMERIC(12, 2) NOT NULL,
    total_ventas NUMERIC(12, 2) DEFAULT 0.00,
    total_efectivo NUMERIC(12, 2) DEFAULT 0.00,
    total_tarjeta NUMERIC(12, 2) DEFAULT 0.00,
    total_transferencia NUMERIC(12, 2) DEFAULT 0.00,
    estado VARCHAR(20) CHECK (estado IN ('abierta', 'cerrada')),
    abierta_en TIMESTAMPTZ DEFAULT NOW(),
    cerrada_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL,
    cierre_id UUID REFERENCES cierres_caja(id) ON DELETE SET NULL,
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('entrada', 'salida', 'gasto', 'retiro', 'aporte')),
    monto NUMERIC(12, 2) NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. VENTAS Y FACTURACIÓN POS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero_factura VARCHAR(50) NOT NULL,
    ncf VARCHAR(30),
    tipo_ncf VARCHAR(10),
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    caja_id VARCHAR(50),
    subtotal NUMERIC(12, 2) NOT NULL,
    monto_impuesto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_descuento NUMERIC(12, 2) DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL,
    costo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'mixto')),
    monto_pagado NUMERIC(12, 2) NOT NULL,
    monto_efectivo NUMERIC(12, 2) DEFAULT 0.00,
    monto_tarjeta NUMERIC(12, 2) DEFAULT 0.00,
    monto_transferencia NUMERIC(12, 2) DEFAULT 0.00,
    monto_credito NUMERIC(12, 2) DEFAULT 0.00,
    devuelta_entregada NUMERIC(12, 2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'completada'
        CHECK (estado IN ('completada', 'reembolsada', 'anulada')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_venta_empresa_factura UNIQUE (empresa_id, numero_factura)
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    combo_id UUID REFERENCES combos(id) ON DELETE SET NULL,
    tipo_item VARCHAR(10) CHECK (tipo_item IN ('producto', 'combo')),
    nombre_item TEXT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas_retenidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    etiqueta TEXT NOT NULL,
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    payload_carrito JSONB NOT NULL DEFAULT '[]'::jsonb,
    descuento_global NUMERIC(5, 2) DEFAULT 0.00,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturas_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
    ncf VARCHAR(30) NOT NULL,
    tipo_ncf VARCHAR(10) NOT NULL,
    rnc_cliente VARCHAR(20),
    nombre_cliente TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    itbis NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(30),
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb,
    emitida_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. COMPRAS Y PROVEEDORES
-- ============================================================

CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_impuesto NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(20) DEFAULT 'credito'
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'cheque', 'mixto')),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'recibida', 'anulada')),
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    recibido_en TIMESTAMPTZ,
    CONSTRAINT uq_compra_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
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
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_devcompra_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ============================================================
-- 12. DEVOLUCIONES DE VENTA
-- ============================================================

CREATE TABLE IF NOT EXISTS devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
    numero_factura VARCHAR(50),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cajero_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    autorizado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    motivo TEXT NOT NULL,
    metodo_reembolso VARCHAR(20) DEFAULT 'efectivo'
        CHECK (metodo_reembolso IN ('efectivo', 'tarjeta', 'nota_credito', 'cambio')),
    tipo VARCHAR(10) DEFAULT 'parcial'
        CHECK (tipo IN ('parcial', 'total')),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    motivo_rechazo TEXT,
    revisado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    revisado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_devolucion_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS detalle_devoluciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    sku VARCHAR(50),
    nombre_item TEXT NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- 13. COTIZACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_impuesto NUMERIC(12, 2) DEFAULT 0.00,
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'convertida', 'vencida')),
    valida_hasta DATE,
    convertido_venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cotizacion_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS detalle_cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    nombre_item TEXT NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- 14. CUENTAS POR COBRAR (CxC) Y CUENTAS POR PAGAR (CxP)
-- ============================================================

CREATE TABLE IF NOT EXISTS cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
    numero_factura VARCHAR(50),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    monto_total NUMERIC(12, 2) NOT NULL,
    monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(12, 2) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'vencida', 'pagada', 'anulada')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cxc_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS pagos_cxc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'mixto')),
    nota TEXT,
    registrado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cuentas_por_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    compra_id UUID REFERENCES compras(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    monto_total NUMERIC(12, 2) NOT NULL,
    monto_pagado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(12, 2) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'vencida', 'pagada', 'anulada')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cxp_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS pagos_cxp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas_por_pagar(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'mixto')),
    nota TEXT,
    registrado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. GASTOS OPERATIVOS
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias_gasto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    presupuesto_mensual NUMERIC(12, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_catgasto_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    categoria_id UUID REFERENCES categorias_gasto(id) ON DELETE SET NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    tiene_recibo BOOLEAN DEFAULT FALSE,
    recibo_url TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    caja_id UUID REFERENCES cajas(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_gasto_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ============================================================
-- 16. INVENTARIO: TRANSFERENCIAS Y AJUSTES
-- ============================================================

CREATE TABLE IF NOT EXISTS transferencias_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    sucursal_origen_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    sucursal_destino_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_transito', 'recibida', 'anulada')),
    motivo TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    recibido_en TIMESTAMPTZ,
    CONSTRAINT uq_transf_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS detalle_transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transferencia_id UUID NOT NULL REFERENCES transferencias_stock(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 3) NOT NULL,
    cantidad_recibida NUMERIC(10, 3) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ajustes_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo_ajuste VARCHAR(20) CHECK (tipo_ajuste IN ('entrada', 'salida', 'perdida')),
    cantidad_anterior NUMERIC(12, 3) NOT NULL,
    cantidad_nueva NUMERIC(12, 3) NOT NULL,
    cantidad_variacion NUMERIC(12, 3) NOT NULL,
    motivo TEXT NOT NULL,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ajuste_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- ============================================================
-- 17. HARDWARE, MALETA Y AUDITORÍA
-- ============================================================

CREATE TABLE IF NOT EXISTS balanzas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    nombre TEXT NOT NULL,
    puerto VARCHAR(50),
    protocolo VARCHAR(50),
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    configuracion JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_balanza_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS cortes_maleta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto TEXT NOT NULL,
    peso_bruto NUMERIC(10, 3) NOT NULL,
    peso_neto NUMERIC(10, 3) NOT NULL,
    merma NUMERIC(10, 3) DEFAULT 0,
    precio_por_libra NUMERIC(12, 2) DEFAULT 0,
    responsable_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_maleta_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS agentes_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    perfil_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    correo TEXT,
    telefono VARCHAR(30),
    porcentaje_comision NUMERIC(5, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
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

-- ==============================================================================
-- 18. TRIGGERS AUTOMÁTICOS PARA AISLAMIENTO MULTI-TENANT
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tablas text[] := ARRAY[
        'sucursales', 'proveedores', 'categorias', 'grupos_clientes', 'clientes',
        'productos', 'combos', 'rangos_ncf', 'cajas', 'ventas', 'ajustes_stock',
        'cierres_caja', 'compras', 'devoluciones_compra', 'devoluciones', 'cotizaciones',
        'cuentas_por_cobrar', 'cuentas_por_pagar', 'categorias_gasto', 'gastos',
        'transferencias_stock', 'movimientos_caja', 'ventas_retenidas', 'facturas_fiscales',
        'balanzas', 'cortes_maleta', 'agentes_comerciales', 'auditoria', 'configuracion_empresa', 'roles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_auto_empresa_%I ON %I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_auto_empresa_%I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION auto_asignar_empresa_id()', tbl, tbl);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_empresa_id ON %I (empresa_id)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 19. ACTIVACIÓN Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- A. Empresas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS empresas_select_policy ON empresas;
CREATE POLICY empresas_select_policy ON empresas
    FOR SELECT TO authenticated
    USING (id = obtener_empresa_id() OR es_superadmin());

DROP POLICY IF EXISTS empresas_update_policy ON empresas;
CREATE POLICY empresas_update_policy ON empresas
    FOR UPDATE TO authenticated
    USING (id = obtener_empresa_id() OR es_superadmin())
    WITH CHECK (id = obtener_empresa_id() OR es_superadmin());

DROP POLICY IF EXISTS empresas_superadmin_all ON empresas;
CREATE POLICY empresas_superadmin_all ON empresas
    FOR ALL TO authenticated
    USING (es_superadmin())
    WITH CHECK (es_superadmin());

-- B. Perfiles
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS perfiles_select_policy ON perfiles;
CREATE POLICY perfiles_select_policy ON perfiles
    FOR SELECT TO authenticated
    USING (empresa_id = obtener_empresa_id() OR id = auth.uid() OR es_superadmin());

DROP POLICY IF EXISTS perfiles_modify_policy ON perfiles;
CREATE POLICY perfiles_modify_policy ON perfiles
    FOR ALL TO authenticated
    USING (
      (empresa_id = obtener_empresa_id() AND es_admin_empresa())
      OR id = auth.uid()
      OR es_superadmin()
    )
    WITH CHECK (
      (empresa_id = obtener_empresa_id() AND es_admin_empresa())
      OR id = auth.uid()
      OR es_superadmin()
    );

-- C. Políticas de todas las entidades de negocio
DO $$
DECLARE
    tbl text;
    tablas text[] := ARRAY[
        'sucursales', 'proveedores', 'categorias', 'grupos_clientes', 'clientes',
        'productos', 'combos', 'rangos_ncf', 'cajas', 'ventas', 'ajustes_stock',
        'cierres_caja', 'compras', 'devoluciones_compra', 'devoluciones', 'cotizaciones',
        'cuentas_por_cobrar', 'cuentas_por_pagar', 'categorias_gasto', 'gastos',
        'transferencias_stock', 'movimientos_caja', 'ventas_retenidas', 'facturas_fiscales',
        'balanzas', 'cortes_maleta', 'agentes_comerciales', 'auditoria', 'configuracion_empresa', 'roles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY %I_tenant_isolation ON %I
             FOR ALL TO authenticated
             USING (empresa_id = obtener_empresa_id() OR es_superadmin())
             WITH CHECK (empresa_id = obtener_empresa_id() OR es_superadmin())',
            tbl, tbl
        );
    END LOOP;

    -- Permitir lectura pública/anónima de los roles base (necesario en pantalla de login/registro)
    DROP POLICY IF EXISTS roles_anon_select ON roles;
    CREATE POLICY roles_anon_select ON roles FOR SELECT TO anon USING (TRUE);
    GRANT SELECT ON TABLE roles TO anon;
END $$;

-- D. Tablas dependientes (detalle_*)
DO $$
DECLARE
    tbl text;
    tablas_hijas text[] := ARRAY[
        'detalle_ventas', 'detalle_compras', 'detalle_devoluciones',
        'detalle_cotizaciones', 'detalle_transferencias', 'combo_items',
        'pagos_cxc', 'pagos_cxp'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas_hijas LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I_open_auth ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_open_auth ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 20. PROCEDIMIENTOS ALMACENADOS (RPCS TRANSACCIONALES)
-- ==============================================================================

-- A. Crear usuario del sistema
CREATE OR REPLACE FUNCTION crear_usuario_sistema(
    p_correo TEXT,
    p_password TEXT,
    p_nombre_completo TEXT,
    p_rol TEXT DEFAULT 'cajero',
    p_sucursal_id UUID DEFAULT NULL,
    p_telefono TEXT DEFAULT NULL,
    p_codigo_acceso TEXT DEFAULT NULL,
    p_empresa_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_caller_empresa UUID;
    v_target_empresa UUID;
    v_user_id UUID;
    v_encrypted TEXT;
BEGIN
    v_target_empresa := COALESCE(
        p_empresa_id,
        v_caller_empresa,
        (SELECT id FROM public.empresas LIMIT 1),
        'a0000000-0000-0000-0000-000000000001'::uuid
    );

    IF EXISTS (SELECT 1 FROM perfiles WHERE correo = lower(p_correo)) THEN
        RAISE EXCEPTION 'Ya existe un usuario con ese correo';
    END IF;

    v_user_id := gen_random_uuid();
    v_encrypted := crypt(p_password, gen_salt('bf'));

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        phone_change, phone_change_token, email_change_token_current, reauthentication_token
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        lower(p_correo), v_encrypted, NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nombre_completo', p_nombre_completo), NOW(), NOW(),
        '', '', '', '', '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', lower(p_correo)),
        'email', v_user_id::text, NOW(), NOW(), NOW()
    );

    INSERT INTO perfiles (
        id, empresa_id, nombre_completo, correo, telefono, rol, sucursal_id, codigo_acceso, activo
    ) VALUES (
        v_user_id, v_target_empresa, p_nombre_completo, lower(p_correo), p_telefono, p_rol,
        p_sucursal_id, p_codigo_acceso, TRUE
    );

    RETURN v_user_id;
END;
$$;

-- B. Procesar venta POS (con soporte fraccionario de inventario y multi-tenant)
CREATE OR REPLACE FUNCTION procesar_venta_pos(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_venta_id UUID;
    v_numero TEXT;
    v_ncf TEXT;
    v_tipo_ncf TEXT;
    v_item JSONB;
    v_prod_id UUID;
    v_combo_id UUID;
    v_qty NUMERIC(12, 3);
    v_combo_item RECORD;
    v_seq BIGINT;
    v_empresa_id UUID;
BEGIN
    v_empresa_id := COALESCE(
        NULLIF(p_payload->>'empresa_id', '')::UUID,
        obtener_empresa_id()
    );

    v_venta_id := gen_random_uuid();
    v_numero := COALESCE(
        p_payload->>'numero_factura',
        'FAC-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_venta_id::text, 1, 8)
    );
    v_tipo_ncf := p_payload->>'tipo_ncf';

    IF v_tipo_ncf IS NOT NULL AND length(v_tipo_ncf) > 0 THEN
        UPDATE rangos_ncf
        SET secuencia_actual = secuencia_actual + 1
        WHERE tipo_ncf = v_tipo_ncf AND activo = TRUE 
          AND empresa_id = v_empresa_id
          AND secuencia_actual < secuencia_fin
        RETURNING secuencia_actual, prefijo INTO v_seq, v_ncf;

        IF v_seq IS NULL THEN
            RAISE EXCEPTION 'No hay rango NCF disponible para tipo %', v_tipo_ncf;
        END IF;
        v_ncf := v_ncf || lpad(v_seq::text, 8, '0');
    ELSE
        v_ncf := p_payload->>'ncf';
    END IF;

    INSERT INTO ventas (
        id, empresa_id, numero_factura, ncf, tipo_ncf, sucursal_id, cajero_id, cliente_id, caja_id,
        subtotal, monto_impuesto, monto_descuento, monto_total, costo_total,
        metodo_pago, monto_pagado, monto_efectivo, monto_tarjeta, monto_transferencia,
        monto_credito, devuelta_entregada, estado
    ) VALUES (
        v_venta_id,
        v_empresa_id,
        v_numero,
        v_ncf,
        v_tipo_ncf,
        NULLIF(p_payload->>'sucursal_id', '')::UUID,
        COALESCE(NULLIF(p_payload->>'cajero_id', '')::UUID, auth.uid()),
        NULLIF(p_payload->>'cliente_id', '')::UUID,
        p_payload->>'caja_id',
        COALESCE((p_payload->>'subtotal')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_impuesto')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_descuento')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_total')::NUMERIC, 0),
        COALESCE((p_payload->>'costo_total')::NUMERIC, 0),
        COALESCE(p_payload->>'metodo_pago', 'efectivo'),
        COALESCE((p_payload->>'monto_pagado')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_efectivo')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_tarjeta')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_transferencia')::NUMERIC, 0),
        COALESCE((p_payload->>'monto_credito')::NUMERIC, 0),
        COALESCE((p_payload->>'devuelta_entregada')::NUMERIC, 0),
        'completada'
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'items', '[]'::jsonb))
    LOOP
        INSERT INTO detalle_ventas (
            venta_id, producto_id, combo_id, tipo_item, nombre_item,
            precio_unitario, costo_unitario, cantidad, porcentaje_impuesto, subtotal
        ) VALUES (
            v_venta_id,
            NULLIF(v_item->>'producto_id', '')::UUID,
            NULLIF(v_item->>'combo_id', '')::UUID,
            COALESCE(v_item->>'tipo_item', 'producto'),
            v_item->>'nombre_item',
            COALESCE((v_item->>'precio_unitario')::NUMERIC, 0),
            COALESCE((v_item->>'costo_unitario')::NUMERIC, 0),
            COALESCE((v_item->>'cantidad')::NUMERIC, 1),
            COALESCE((v_item->>'porcentaje_impuesto')::NUMERIC, 0),
            COALESCE((v_item->>'subtotal')::NUMERIC, 0)
        );

        v_qty := COALESCE((v_item->>'cantidad')::NUMERIC, 1);

        IF COALESCE(v_item->>'tipo_item', 'producto') = 'producto' THEN
            v_prod_id := NULLIF(v_item->>'producto_id', '')::UUID;
            IF v_prod_id IS NOT NULL THEN
                UPDATE productos
                SET stock_actual = GREATEST(0, stock_actual - v_qty),
                    actualizado_en = NOW()
                WHERE id = v_prod_id;
            END IF;
        ELSIF COALESCE(v_item->>'tipo_item', '') = 'combo' THEN
            v_combo_id := NULLIF(v_item->>'combo_id', '')::UUID;
            IF v_combo_id IS NOT NULL THEN
                FOR v_combo_item IN
                    SELECT producto_id, cantidad FROM combo_items WHERE combo_id = v_combo_id
                LOOP
                    UPDATE productos
                    SET stock_actual = GREATEST(0, stock_actual - (v_combo_item.cantidad * v_qty)),
                        actualizado_en = NOW()
                    WHERE id = v_combo_item.producto_id;
                END LOOP;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'venta_id', v_venta_id,
        'numero_factura', v_numero,
        'ncf', v_ncf
    );
END;
$$;

-- C. Anular Venta POS y Restaurar Stock
CREATE OR REPLACE FUNCTION anular_venta_pos(
    p_venta_id UUID,
    p_motivo TEXT DEFAULT 'Anulación de venta'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_venta RECORD;
    v_item RECORD;
    v_combo_item RECORD;
BEGIN
    SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id FOR UPDATE;
    IF v_venta.id IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada';
    END IF;

    IF v_venta.estado = 'anulada' THEN
        RAISE EXCEPTION 'La venta ya se encuentra anulada';
    END IF;

    UPDATE ventas SET estado = 'anulada' WHERE id = p_venta_id;

    FOR v_item IN SELECT * FROM detalle_ventas WHERE venta_id = p_venta_id
    LOOP
        IF v_item.tipo_item = 'producto' AND v_item.producto_id IS NOT NULL THEN
            UPDATE productos
            SET stock_actual = stock_actual + v_item.cantidad,
                actualizado_en = NOW()
            WHERE id = v_item.producto_id;
        ELSIF v_item.tipo_item = 'combo' AND v_item.combo_id IS NOT NULL THEN
            FOR v_combo_item IN
                SELECT producto_id, cantidad FROM combo_items WHERE combo_id = v_item.combo_id
            LOOP
                UPDATE productos
                SET stock_actual = stock_actual + (v_combo_item.cantidad * v_item.cantidad),
                    actualizado_en = NOW()
                WHERE id = v_combo_item.producto_id;
            END LOOP;
        END IF;
    END LOOP;

    UPDATE cuentas_por_cobrar SET estado = 'anulada' WHERE venta_id = p_venta_id;

    RETURN jsonb_build_object(
        'exito', true,
        'venta_id', p_venta_id,
        'numero_factura', v_venta.numero_factura
    );
END;
$$;

-- D. Procesar ajuste de stock en bloque
CREATE OR REPLACE FUNCTION procesar_ajuste_stock_bloque(p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item JSONB;
    v_prod_id UUID;
    v_tipo TEXT;
    v_nueva NUMERIC(12, 3);
    v_anterior NUMERIC(12, 3);
    v_codigo TEXT;
    v_count INT := 0;
    v_ids UUID[] := ARRAY[]::UUID[];
    v_ajuste_id UUID;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
    LOOP
        v_prod_id := (v_item->>'producto_id')::UUID;
        v_tipo := v_item->>'tipo_ajuste';

        SELECT stock_actual INTO v_anterior FROM productos WHERE id = v_prod_id FOR UPDATE;
        IF v_anterior IS NULL THEN
            RAISE EXCEPTION 'Producto no encontrado: %', v_prod_id;
        END IF;

        IF v_item ? 'cantidad_nueva' THEN
            v_nueva := (v_item->>'cantidad_nueva')::NUMERIC;
        ELSIF v_tipo = 'entrada' THEN
            v_nueva := v_anterior + COALESCE((v_item->>'cantidad_variacion')::NUMERIC, 0);
        ELSIF v_tipo IN ('salida', 'perdida') THEN
            v_nueva := GREATEST(0, v_anterior - ABS(COALESCE((v_item->>'cantidad_variacion')::NUMERIC, 0)));
        ELSE
            RAISE EXCEPTION 'tipo_ajuste inválido';
        END IF;

        UPDATE productos
        SET stock_actual = v_nueva, actualizado_en = NOW()
        WHERE id = v_prod_id;

        v_ajuste_id := gen_random_uuid();
        v_codigo := COALESCE(
            v_item->>'codigo',
            'AJ-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_ajuste_id::text, 1, 6)
        );

        INSERT INTO ajustes_stock (
            id, codigo, producto_id, tipo_ajuste,
            cantidad_anterior, cantidad_nueva, cantidad_variacion,
            motivo, responsable_id
        ) VALUES (
            v_ajuste_id,
            v_codigo,
            v_prod_id,
            v_tipo,
            v_anterior,
            v_nueva,
            v_nueva - v_anterior,
            COALESCE(v_item->>'motivo', 'Ajuste de inventario'),
            COALESCE(NULLIF(v_item->>'responsable_id', '')::UUID, auth.uid())
        );

        v_ids := array_append(v_ids, v_ajuste_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('ajustes', v_count, 'ids', to_jsonb(v_ids));
END;
$$;

-- E. Métricas Dashboard (Aisladas por tenant)
CREATE OR REPLACE FUNCTION obtener_metricas_dashboard(p_periodo TEXT DEFAULT 'hoy')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_desde TIMESTAMPTZ;
    v_hasta TIMESTAMPTZ := NOW();
    v_ventas_total NUMERIC;
    v_ventas_count INT;
    v_ticket_promedio NUMERIC;
    v_costo_total NUMERIC;
    v_productos_bajos INT;
    v_productos_total INT;
    v_empresa_id UUID;
    v_is_super BOOLEAN;
BEGIN
    v_empresa_id := obtener_empresa_id();
    v_is_super := es_superadmin();

    CASE lower(p_periodo)
        WHEN 'semana' THEN v_desde := date_trunc('week', NOW());
        WHEN 'mes' THEN v_desde := date_trunc('month', NOW());
        ELSE v_desde := date_trunc('day', NOW());
    END CASE;

    SELECT
        COALESCE(SUM(monto_total), 0),
        COUNT(*)::INT,
        COALESCE(AVG(monto_total), 0),
        COALESCE(SUM(costo_total), 0)
    INTO v_ventas_total, v_ventas_count, v_ticket_promedio, v_costo_total
    FROM ventas
    WHERE estado = 'completada' 
      AND creado_en >= v_desde AND creado_en <= v_hasta
      AND (empresa_id = v_empresa_id OR v_is_super);

    SELECT COUNT(*)::INT INTO v_productos_bajos
    FROM productos
    WHERE estado = 'activo' AND stock_actual <= stock_minimo
      AND (empresa_id = v_empresa_id OR v_is_super);

    SELECT COUNT(*)::INT INTO v_productos_total
    FROM productos 
    WHERE estado = 'activo'
      AND (empresa_id = v_empresa_id OR v_is_super);

    RETURN jsonb_build_object(
        'periodo', p_periodo,
        'desde', v_desde,
        'ventas_total', v_ventas_total,
        'ventas_count', v_ventas_count,
        'ticket_promedio', round(v_ticket_promedio, 2),
        'costo_total', v_costo_total,
        'ganancia_bruta', v_ventas_total - v_costo_total,
        'productos_stock_bajo', v_productos_bajos,
        'productos_activos', v_productos_total
    );
END;
$$;

-- ==============================================================================
-- 21. VISTAS DE ALTO RENDIMIENTO
-- ==============================================================================

CREATE OR REPLACE VIEW alertas_stock AS
SELECT
    id,
    empresa_id,
    sku,
    nombre,
    stock_actual,
    stock_minimo,
    CASE
        WHEN stock_actual = 0 THEN 'agotado'
        WHEN stock_actual <= stock_minimo THEN 'bajo'
        ELSE 'normal'
    END AS nivel_alerta
FROM productos
WHERE estado = 'activo' AND stock_actual <= stock_minimo;

DROP VIEW IF EXISTS vista_superadmin_empresas CASCADE;

CREATE OR REPLACE VIEW vista_superadmin_empresas AS
SELECT 
    e.id,
    e.codigo,
    e.nombre,
    e.razon_social,
    e.rnc,
    e.plan,
    e.estado,
    e.telefono,
    e.correo,
    e.moneda,
    e.limite_usuarios,
    e.limite_sucursales,
    e.limite_cajas,
    e.limite_facturas_mes,
    e.creado_en,
    COUNT(DISTINCT p.id) AS total_usuarios,
    COUNT(DISTINCT s.id) AS total_sucursales,
    COALESCE(SUM(v.monto_total), 0) AS volumen_ventas_historico
FROM empresas e
LEFT JOIN perfiles p ON p.empresa_id = e.id AND p.activo = TRUE
LEFT JOIN sucursales s ON s.empresa_id = e.id AND s.activo = TRUE
LEFT JOIN ventas v ON v.empresa_id = e.id AND v.estado = 'completada'
GROUP BY e.id;

-- ==============================================================================
-- 22. SEED INICIAL: EMPRESA POR DEFECTO Y ROLES DEL SISTEMA
-- ==============================================================================

INSERT INTO empresas (id, codigo, nombre, razon_social, rnc, plan, estado)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'koba-demo',
    'KOBA Flagship Store',
    'KOBA COMERCIAL S.R.L.',
    '131-00000-1',
    'enterprise',
    'activo'
)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO sucursales (id, empresa_id, codigo, nombre, direccion, telefono, rnc, activo)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SUC-01',
    'Sucursal Principal Churchill',
    'Av. Winston Churchill #102',
    '809-555-0199',
    '131-00000-1',
    TRUE
)
ON CONFLICT (empresa_id, codigo) DO NOTHING;

INSERT INTO roles (codigo, nombre, descripcion, permisos) VALUES
(
  'admin', 
  'Administrador', 
  'Acceso total al sistema y configuración', 
  '{"dashboard":{"ver":true,"exportar":true},"pos":{"ver":true,"crear":true,"editar":true},"ventas":{"ver":true,"crear":true,"editar":true,"eliminar":true,"exportar":true},"compras":{"ver":true,"crear":true,"editar":true,"eliminar":true,"aprobar":true,"exportar":true},"devoluciones":{"ver":true,"crear":true,"aprobar":true,"exportar":true},"productos":{"ver":true,"crear":true,"editar":true,"eliminar":true,"exportar":true},"combos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"transferencias":{"ver":true,"crear":true,"aprobar":true},"ajustes_stock":{"ver":true,"crear":true,"aprobar":true,"exportar":true},"balanzas":{"ver":true,"editar":true},"contactos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"cierre_caja":{"ver":true,"crear":true,"aprobar":true,"exportar":true},"maleta":{"ver":true,"crear":true,"editar":true},"gastos":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"cxc":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"cxp":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"informes":{"ver":true,"exportar":true},"auditoria":{"ver":true,"exportar":true},"usuarios":{"ver":true,"crear":true,"editar":true,"eliminar":true},"configuracion":{"ver":true,"editar":true}}'::jsonb
),
(
  'cajero', 
  'Cajero', 
  'POS, ventas rápidas y cierre de caja', 
  '{"pos":{"ver":true,"crear":true,"editar":true},"ventas":{"ver":true,"exportar":true},"combos":{"ver":true},"devoluciones":{"ver":true,"crear":true},"cierre_caja":{"ver":true,"aprobar":true},"contactos":{"ver":true,"crear":true,"editar":true},"configuracion":{"ver":true}}'::jsonb
),
(
  'vendedor', 
  'Vendedor', 
  'Atención al cliente, ventas, cotizaciones y catálogo', 
  '{"dashboard":{"ver":true},"ventas":{"ver":true,"crear":true},"combos":{"ver":true},"contactos":{"ver":true,"crear":true},"cxc":{"ver":true},"pos":{"ver":true}}'::jsonb
),
(
  'almacen', 
  'Almacenista', 
  'Gestión física de inventario, traslados y recepciones', 
  '{"productos":{"ver":true,"crear":true,"editar":true},"combos":{"ver":true},"transferencias":{"ver":true,"crear":true,"aprobar":true},"ajustes_stock":{"ver":true,"crear":true},"compras":{"ver":true}}'::jsonb
),
(
  'contable', 
  'Contador', 
  'Auditoría financiera, compras, cuentas e informes', 
  '{"dashboard":{"ver":true,"exportar":true},"informes":{"ver":true,"exportar":true},"gastos":{"ver":true,"aprobar":true,"exportar":true},"cxc":{"ver":true,"exportar":true},"cxp":{"ver":true,"exportar":true},"ventas":{"ver":true,"exportar":true},"compras":{"ver":true,"exportar":true},"auditoria":{"ver":true,"exportar":true}}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Permisos de acceso
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
