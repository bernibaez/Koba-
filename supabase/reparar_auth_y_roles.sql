-- ==============================================================================
-- KOBA / Kob Cloud ERP — SOLUCIÓN RÁPIDA: REPARAR ERROR 500 (AUTH) Y 401 (ROLES)
-- ==============================================================================
-- Ejecuta este script en Supabase -> SQL Editor -> Run
-- Corrige de inmediato:
-- 1. Error 500 en /auth/v1/token (Campos NULL en auth.users que GoTrue no tolera)
-- 2. Error 401 en /rest/v1/roles (Permitir lectura de roles al cliente anónimo)
-- 3. Confirma el usuario administrador para que no pida verificación de correo
-- ==============================================================================

-- 1. CORREGIR CAMPOS NULL EN auth.users (Elimina el Error 500 Database error querying schema)
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()) -- Auto-confirmar email
WHERE email = 'admin@kobcloud.com';

-- Si prefieres aplicar la corrección a todos los usuarios en auth.users:
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW());

-- 2. CORREGIR POLÍTICAS DE ROLES (Elimina el Error 401 en /rest/v1/roles)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE roles TO anon, authenticated;

DROP POLICY IF EXISTS roles_anon_select ON roles;
CREATE POLICY roles_anon_select ON roles
  FOR SELECT TO anon
  USING (TRUE);

-- 3. ASEGURAR QUE EL PERFIL ADMINISTRADOR EXISTE Y ES SUPERADMIN
INSERT INTO perfiles (
    id,
    empresa_id,
    nombre_completo,
    correo,
    telefono,
    rol,
    es_superadmin,
    activo
)
SELECT 
    id,
    'a0000000-0000-0000-0000-000000000001',
    'Super Admin Kob Cloud',
    email,
    '809-555-0001',
    'admin',
    TRUE,
    TRUE
FROM auth.users
WHERE email = 'admin@kobcloud.com'
ON CONFLICT (id) DO UPDATE SET
    empresa_id = 'a0000000-0000-0000-0000-000000000001',
    nombre_completo = 'Super Admin Kob Cloud',
    rol = 'admin',
    es_superadmin = TRUE,
    activo = TRUE;
