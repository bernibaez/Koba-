-- ==============================================================================
-- KOBA / Kob Cloud ERP — Migración 015: Límites de Suscripción por Tenant
-- ==============================================================================
-- Esta migración añade los controles de cuotas para:
-- 1. Límite de cajas registradoras activas por empresa (limite_cajas)
-- 2. Límite de facturas / ventas mensuales permitidas (limite_facturas_mes)
-- 3. Actualización de la vista vista_superadmin_empresas con las nuevas columnas.
-- ==============================================================================

-- 1. Agregar columnas a la tabla empresas si no existen
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS limite_cajas INT DEFAULT 2;

ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS limite_facturas_mes INT DEFAULT 500;

ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS limite_usuarios INT DEFAULT 5;

ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS limite_sucursales INT DEFAULT 2;

-- 2. Asignar cuotas por defecto a empresas existentes según su plan de suscripción
-- Plan Free: 100 facturas/mes, 2 usuarios, 1 caja
UPDATE empresas
SET 
    limite_facturas_mes = 100,
    limite_usuarios = 2,
    limite_cajas = 1,
    limite_sucursales = 1
WHERE plan = 'free';

-- Plan Starter: 500 facturas/mes, 5 usuarios, 2 cajas
UPDATE empresas
SET 
    limite_facturas_mes = 500,
    limite_usuarios = 5,
    limite_cajas = 2,
    limite_sucursales = 2
WHERE plan = 'starter';

-- Plan Pro: 2,500 facturas/mes, 15 usuarios, 5 cajas
UPDATE empresas
SET 
    limite_facturas_mes = 2500,
    limite_usuarios = 15,
    limite_cajas = 5,
    limite_sucursales = 5
WHERE plan = 'pro';

-- Plan Enterprise: Ilimitado (-1)
UPDATE empresas
SET 
    limite_facturas_mes = -1,
    limite_usuarios = -1,
    limite_cajas = -1,
    limite_sucursales = -1
WHERE plan = 'enterprise';

-- 3. Actualizar la vista de SuperAdmin con los nuevos límites
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

-- 4. Asegurar permisos de lectura en la vista para usuarios autenticados
GRANT SELECT ON vista_superadmin_empresas TO authenticated, anon;
