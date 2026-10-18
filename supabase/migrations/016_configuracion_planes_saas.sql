-- ==============================================================================
-- KOBA / Kob Cloud ERP — Migración 016: Configuración Global de Planes SaaS
-- ==============================================================================
-- Esta migración crea la tabla para almacenar la configuración centralizada
-- de los planes de suscripción (módulos incluidos, límites operativos, precios y badges).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS configuracion_planes_saas (
    id VARCHAR(50) PRIMARY KEY, -- 'free', 'starter', 'pro', 'enterprise'
    nombre TEXT NOT NULL,
    precio TEXT NOT NULL,
    badge TEXT NOT NULL,
    descripcion TEXT,
    modulos JSONB NOT NULL DEFAULT '[]'::jsonb,
    limites JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE configuracion_planes_saas ENABLE ROW LEVEL SECURITY;

-- 1. Políticas RLS:
-- Lectura pública para cualquier usuario (permite renderizar permisos y barra lateral)
DROP POLICY IF EXISTS "Lectura de planes saas" ON configuracion_planes_saas;
CREATE POLICY "Lectura de planes saas" ON configuracion_planes_saas
    FOR SELECT TO authenticated, anon USING (true);

-- Escritura permitida para superadmins y rol de servicio
DROP POLICY IF EXISTS "Gestion de planes saas" ON configuracion_planes_saas;
CREATE POLICY "Gestion de planes saas" ON configuracion_planes_saas
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 2. Seed inicial con la matriz oficial de KOBA Cloud (Sincronizado con diseño Stitch)
INSERT INTO configuracion_planes_saas (id, nombre, precio, badge, descripcion, modulos, limites)
VALUES 
(
  'free',
  'Free',
  '0 $ USD/mes',
  '7 módulos',
  'Caja rápida, ventas básicas y catálogo indispensable',
  '["dashboard", "pos", "sales", "products", "cajas", "contacts", "cash-closure"]'::jsonb,
  '{"limite_facturas_mes": 100, "limite_usuarios": 2, "limite_sucursales": 1, "limite_cajas": 1}'::jsonb
),
(
  'starter',
  'Starter',
  '29 $ USD/mes',
  '13 módulos',
  'Compras, combos y control de gastos',
  '["dashboard", "pos", "sales", "purchases", "returns", "products", "combos", "cajas", "contacts", "cash-closure", "expenses", "users", "settings"]'::jsonb,
  '{"limite_facturas_mes": 500, "limite_usuarios": 5, "limite_sucursales": 2, "limite_cajas": 2}'::jsonb
),
(
  'pro',
  'Pro',
  '79 $ USD/mes',
  '20 módulos · Popular',
  'CRM, CxC, CxP, stock multi-sucursal y facturación',
  '["dashboard", "pos", "sales", "purchases", "returns", "products", "combos", "stock-transfers", "stock-adjustments", "cajas", "contacts", "crm", "cash-closure", "maleta", "expenses", "accounts-receivable", "accounts-payable", "reports", "users", "settings"]'::jsonb,
  '{"limite_facturas_mes": 2500, "limite_usuarios": 15, "limite_sucursales": 5, "limite_cajas": 5}'::jsonb
),
(
  'enterprise',
  'Enterprise',
  'Desde 199 $ USD/mes',
  '21 módulos',
  'Auditoría integral, integración API sin límites y soporte prioritario',
  '["dashboard", "pos", "sales", "purchases", "returns", "products", "combos", "stock-transfers", "stock-adjustments", "cajas", "contacts", "crm", "cash-closure", "maleta", "expenses", "accounts-receivable", "accounts-payable", "reports", "audit", "users", "settings"]'::jsonb,
  '{"limite_facturas_mes": -1, "limite_usuarios": -1, "limite_sucursales": -1, "limite_cajas": -1}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  modulos = EXCLUDED.modulos,
  limites = EXCLUDED.limites,
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  badge = EXCLUDED.badge,
  descripcion = EXCLUDED.descripcion,
  actualizado_en = NOW();
