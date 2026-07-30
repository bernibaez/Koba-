-- MarketERP — Esquema inicial (100% español)
-- Ejecutar en el SQL Editor de Supabase o vía CLI

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Sucursales (antes de perfiles por FK)
CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono VARCHAR(30),
    rnc VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proveedores (mínimo para productos.proveedor_id)
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Perfiles (vinculados a auth.users)
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    telefono VARCHAR(30),
    rol TEXT NOT NULL DEFAULT 'cajero'
        CHECK (rol IN ('admin', 'super_admin', 'cajero', 'almacen', 'contable', 'vendedor')),
    sucursal_id UUID REFERENCES sucursales(id),
    codigo_acceso VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    marca TEXT,
    unidad TEXT NOT NULL DEFAULT 'Unidad',
    proveedor_id UUID REFERENCES proveedores(id),
    precio_costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    precio_venta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    precio_mayorista NUMERIC(12, 2) DEFAULT 0.00,
    porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00,
    stock_minimo INT NOT NULL DEFAULT 10,
    stock_actual INT NOT NULL DEFAULT 0,
    es_pesado BOOLEAN DEFAULT FALSE,
    fecha_vencimiento DATE,
    garantia TEXT,
    imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo', 'descontinuado')),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Combos
CREATE TABLE IF NOT EXISTS combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(100) UNIQUE,
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
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ítems del combo
CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL DEFAULT 1,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 7. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rnc_cedula VARCHAR(20),
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'final'
        CHECK (tipo_cliente IN ('final', 'fiscal', 'credito')),
    limite_credito NUMERIC(12, 2) DEFAULT 0.00,
    balance_actual NUMERIC(12, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rangos NCF (soporte fiscal RD)
CREATE TABLE IF NOT EXISTS rangos_ncf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_ncf VARCHAR(10) NOT NULL,
    prefijo VARCHAR(10) NOT NULL,
    secuencia_actual BIGINT NOT NULL DEFAULT 0,
    secuencia_fin BIGINT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    ncf VARCHAR(30),
    tipo_ncf VARCHAR(10),
    sucursal_id UUID REFERENCES sucursales(id),
    cajero_id UUID REFERENCES perfiles(id),
    cliente_id UUID REFERENCES clientes(id),
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
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Detalle de venta
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    combo_id UUID REFERENCES combos(id),
    tipo_item VARCHAR(10) CHECK (tipo_item IN ('producto', 'combo')),
    nombre_item TEXT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    costo_unitario NUMERIC(12, 2) NOT NULL,
    cantidad NUMERIC(10, 3) NOT NULL,
    porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 11. Ajustes de stock
CREATE TABLE IF NOT EXISTS ajustes_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo_ajuste VARCHAR(20) CHECK (tipo_ajuste IN ('entrada', 'salida', 'perdida')),
    cantidad_anterior INT NOT NULL,
    cantidad_nueva INT NOT NULL,
    cantidad_variacion INT NOT NULL,
    motivo TEXT NOT NULL,
    responsable_id UUID REFERENCES perfiles(id),
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Cierres de caja
CREATE TABLE IF NOT EXISTS cierres_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    caja_id VARCHAR(50) NOT NULL,
    cajero_id UUID REFERENCES perfiles(id),
    sucursal_id UUID REFERENCES sucursales(id),
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

-- Vista de alertas de stock (para Realtime / dashboard)
CREATE OR REPLACE VIEW alertas_stock AS
SELECT
    id,
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
