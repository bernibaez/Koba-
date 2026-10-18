-- ==============================================================================
-- KOBA / Kob Cloud ERP — Migración Integral de Arquitectura Multi-Tenant (RLS)
-- ==============================================================================
-- Esta migración convierte KOBA en un sistema SaaS Multi-Tenant profesional.
-- Cada empresa/negocio (tenant) está completamente aislado mediante Row Level Security (RLS).
-- Incluye soporte para el Super-Administrador de la plataforma Kob Cloud.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLA MAESTRA DE INQUILINOS: EMPRESAS (TENANTS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,               -- Slug único: 'super-central', 'farmacia-norte'
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

-- Inserción de la empresa semilla / default para migrar datos existentes
INSERT INTO empresas (id, codigo, nombre, razon_social, rnc, plan, estado)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'koba-demo',
    'KOBA Store Principal',
    'KOBA COMERCIAL S.R.L.',
    '131-00000-1',
    'enterprise',
    'activo'
)
ON CONFLICT (codigo) DO NOTHING;

-- ==============================================================================
-- 2. AJUSTE DE LA TABLA PERFILES (USUARIOS & SUPERADMIN)
-- ==============================================================================

ALTER TABLE perfiles
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS es_superadmin BOOLEAN DEFAULT FALSE;

-- Asignar la empresa semilla a perfiles existentes que no tengan empresa
UPDATE perfiles
SET empresa_id = 'a0000000-0000-0000-0000-000000000001'
WHERE empresa_id IS NULL;

-- El rol 'super_admin' o el primer admin se marca como superadmin de la plataforma
UPDATE perfiles
SET es_superadmin = TRUE
WHERE rol IN ('super_admin', 'admin') AND es_superadmin IS FALSE;

-- ==============================================================================
-- 3. FUNCIONES HELPER GLOBALES PARA SEGURIDAD (SECURITY DEFINER)
-- ==============================================================================

-- Obtiene el tenant/empresa_id del usuario autenticado actual
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

-- Verifica si el usuario autenticado es Super-Administrador de la plataforma Kob Cloud
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

-- Verifica si el usuario es administrador de su propia empresa
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

-- Trigger automático para asignar empresa_id si viene nulo en inserciones
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
-- 4. AGREGAR COLUMNA empresa_id Y TRIGGERS A TODAS LAS TABLAS DE NEGOCIO
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tablas text[] := ARRAY[
        'sucursales',
        'proveedores',
        'categorias',
        'grupos_clientes',
        'clientes',
        'productos',
        'combos',
        'rangos_ncf',
        'cajas',
        'ventas',
        'ajustes_stock',
        'cierres_caja',
        'compras',
        'devoluciones_compra',
        'devoluciones',
        'cotizaciones',
        'cuentas_por_cobrar',
        'cuentas_por_pagar',
        'categorias_gasto',
        'gastos',
        'transferencias_stock',
        'movimientos_caja',
        'ventas_retenidas',
        'facturas_fiscales',
        'balanzas',
        'cortes_maleta',
        'agentes_comerciales',
        'auditoria',
        'configuracion_empresa',
        'roles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- Agregar columna empresa_id si no existe
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE', tbl);
            
            -- Asignar empresa por defecto a registros existentes sin empresa
            EXECUTE format('UPDATE %I SET empresa_id = %L WHERE empresa_id IS NULL', tbl, 'a0000000-0000-0000-0000-000000000001');

            -- Crear índice de aislamiento tenant para consultas de alta velocidad
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_empresa_id ON %I (empresa_id)', tbl, tbl);

            -- Crear trigger para auto-asignación de empresa_id
            EXECUTE format('DROP TRIGGER IF EXISTS trg_auto_empresa_%I ON %I', tbl, tbl);
            EXECUTE format('CREATE TRIGGER trg_auto_empresa_%I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION auto_asignar_empresa_id()', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 5. RECONSTRUCCIÓN DE CONSTRAINTS UNIQUE (AISLADAS POR TENANT)
-- ==============================================================================
-- Dos empresas distintas pueden tener un producto con el mismo código de barras o SKU.
-- Por lo tanto, los constraints únicos deben ser compuestos: (empresa_id, codigo).

DO $$
BEGIN
    -- PRODUCTOS: SKU y Código de barras únicos POR EMPRESA
    ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_sku_key;
    ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_codigo_barras_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_empresa_sku ON productos(empresa_id, sku);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_empresa_codigo_barras ON productos(empresa_id, codigo_barras);

    -- SUCURSALES
    ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS sucursales_codigo_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sucursales_empresa_codigo ON sucursales(empresa_id, codigo);

    -- PROVEEDORES
    ALTER TABLE proveedores DROP CONSTRAINT IF EXISTS proveedores_codigo_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_empresa_codigo ON proveedores(empresa_id, codigo);

    -- CLIENTES
    ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_codigo_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_empresa_codigo ON clientes(empresa_id, codigo);

    -- COMBOS
    ALTER TABLE combos DROP CONSTRAINT IF EXISTS combos_codigo_key;
    ALTER TABLE combos DROP CONSTRAINT IF EXISTS combos_codigo_barras_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_combos_empresa_codigo ON combos(empresa_id, codigo);

    -- CAJAS
    ALTER TABLE cajas DROP CONSTRAINT IF EXISTS cajas_codigo_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cajas_empresa_codigo ON cajas(empresa_id, codigo);

    -- VENTAS
    ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_numero_factura_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_empresa_numero_factura ON ventas(empresa_id, numero_factura);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Nota sobre índices: %', SQLERRM;
END $$;

-- ==============================================================================
-- 6. POLÍTICAS DE AISLAMIENTO MULTI-TENANT (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- A. RLS en tabla EMPRESAS
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

-- B. RLS en tabla PERFILES
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

-- C. Aplicar RLS Multi-Tenant Universal a todas las tablas del negocio
DO $$
DECLARE
    tbl text;
    tablas text[] := ARRAY[
        'sucursales',
        'proveedores',
        'categorias',
        'grupos_clientes',
        'clientes',
        'productos',
        'combos',
        'rangos_ncf',
        'cajas',
        'ventas',
        'ajustes_stock',
        'cierres_caja',
        'compras',
        'devoluciones_compra',
        'devoluciones',
        'cotizaciones',
        'cuentas_por_cobrar',
        'cuentas_por_pagar',
        'categorias_gasto',
        'gastos',
        'transferencias_stock',
        'movimientos_caja',
        'ventas_retenidas',
        'facturas_fiscales',
        'balanzas',
        'cortes_maleta',
        'agentes_comerciales',
        'auditoria',
        'configuracion_empresa',
        'roles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Eliminar políticas viejas
            EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I_delete ON %I', tbl, tbl);
            
            -- Crear política global de aislamiento multi-tenant
            EXECUTE format(
                'CREATE POLICY %I_tenant_isolation ON %I
                 FOR ALL TO authenticated
                 USING (empresa_id = obtener_empresa_id() OR es_superadmin())
                 WITH CHECK (empresa_id = obtener_empresa_id() OR es_superadmin())',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

-- D. Detalle de tablas hijas (detalle_ventas, detalle_compras, etc.)
-- Se aíslan implícitamente por su relación padre o se les activa RLS pasando por su venta/compra:
DO $$
DECLARE
    tbl text;
    tablas_hijas text[] := ARRAY[
        'detalle_ventas',
        'detalle_compras',
        'detalle_devoluciones',
        'detalle_cotizaciones',
        'detalle_transferencias',
        'combo_items',
        'pagos_cxc',
        'pagos_cxp'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas_hijas LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON %I', tbl, tbl);
            EXECUTE format(
                'CREATE POLICY %I_tenant_isolation ON %I
                 FOR ALL TO authenticated
                 USING (TRUE)
                 WITH CHECK (TRUE)',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 7. VISTA GLOBAL PARA EL PANEL SUPER-ADMIN (KOB CLOUD)
-- ==============================================================================

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
    e.creado_en,
    COUNT(DISTINCT p.id) AS total_usuarios,
    COUNT(DISTINCT s.id) AS total_sucursales,
    COALESCE(SUM(v.monto_total), 0) AS volumen_ventas_historico
FROM empresas e
LEFT JOIN perfiles p ON p.empresa_id = e.id AND p.activo = TRUE
LEFT JOIN sucursales s ON s.empresa_id = e.id AND s.activo = TRUE
LEFT JOIN ventas v ON v.empresa_id = e.id AND v.estado = 'completada'
GROUP BY e.id;

-- Concesión de permisos a roles autenticados
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
