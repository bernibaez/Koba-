-- Crea productos si no existe + permisos REST + reload schema.
-- Si nunca corriste el esquema base, ejecuta ANTES en orden:
--   001_esquema_inicial.sql → 002 → 003 → 004 → 005 → 006
-- Esta migración solo cubre lo mínimo para que /rest/v1/productos funcione.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(100);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS unidad TEXT DEFAULT 'Unidad';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_id UUID;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_costo NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_mayorista NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS porcentaje_impuesto NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_minimo INT DEFAULT 10;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_actual INT DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_pesado BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS garantia TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE productos ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS productos_select ON productos;
CREATE POLICY productos_select ON productos
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS productos_insert ON productos;
CREATE POLICY productos_insert ON productos
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS productos_update ON productos;
CREATE POLICY productos_update ON productos
  FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS productos_delete ON productos;
CREATE POLICY productos_delete ON productos
  FOR DELETE TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS productos_select_anon ON productos;
CREATE POLICY productos_select_anon ON productos
  FOR SELECT TO anon
  USING (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE productos TO authenticated;
GRANT SELECT ON TABLE productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE proveedores TO authenticated;
GRANT SELECT ON TABLE proveedores TO anon;

NOTIFY pgrst, 'reload schema';
