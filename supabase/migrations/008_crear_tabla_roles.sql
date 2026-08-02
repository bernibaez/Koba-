-- MarketERP — Migración para crear la tabla de roles
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → New query → Run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar seguridad de nivel de fila (RLS)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS roles_select ON roles;
CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS roles_insert ON roles;
CREATE POLICY roles_insert ON roles
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS roles_update ON roles;
CREATE POLICY roles_update ON roles
  FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS roles_delete ON roles;
CREATE POLICY roles_delete ON roles
  FOR DELETE TO authenticated
  USING (TRUE);

-- Conceder permisos de uso a roles de Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE roles TO authenticated;
GRANT SELECT ON TABLE roles TO anon;

-- Sembrar roles por defecto alineados con los permisos existentes en permissionsCatalog.ts
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
  'Ventas, clientes y cuentas por cobrar', 
  '{"dashboard":{"ver":true},"ventas":{"ver":true,"crear":true,"editar":true,"exportar":true},"pos":{"ver":true,"crear":true},"combos":{"ver":true},"contactos":{"ver":true,"crear":true,"editar":true},"cxc":{"ver":true,"crear":true,"editar":true,"exportar":true},"cierre_caja":{"ver":true},"configuracion":{"ver":true}}'::jsonb
),
(
  'almacen', 
  'Almacenista', 
  'Inventario, compras y transferencias', 
  '{"dashboard":{"ver":true},"productos":{"ver":true,"crear":true,"editar":true,"eliminar":true,"exportar":true},"combos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"transferencias":{"ver":true,"crear":true,"aprobar":true},"ajustes_stock":{"ver":true,"crear":true,"aprobar":true,"exportar":true},"balanzas":{"ver":true,"editar":true},"compras":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"configuracion":{"ver":true}}'::jsonb
),
(
  'contable', 
  'Contador / Finanzas', 
  'Finanzas, informes y auditoría', 
  '{"dashboard":{"ver":true},"informes":{"ver":true,"exportar":true},"gastos":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"cxc":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"cxp":{"ver":true,"crear":true,"editar":true,"aprobar":true,"exportar":true},"ventas":{"ver":true,"exportar":true},"compras":{"ver":true,"exportar":true},"cierre_caja":{"ver":true,"aprobar":true,"exportar":true},"auditoria":{"ver":true,"exportar":true},"configuracion":{"ver":true}}'::jsonb
)
ON CONFLICT (codigo) DO NOTHING;

-- Notificar recarga de esquema a PostgREST
NOTIFY pgrst, 'reload schema';
