-- ==============================================================================
-- KOBA / Kob Cloud ERP — CORRECCIÓN DEFINITIVA DE CREACIÓN Y LOGIN DE USUARIOS
-- ==============================================================================
-- Ejecuta este script en Supabase -> SQL Editor -> Run
-- Resuelve:
-- 1. Error 400 (Invalid login credentials / Email not confirmed)
-- 2. Error 401 en empresas (RLS que impedía registrar nuevos clientes)
-- 3. Error Foreign Key en perfiles (asegura la empresa semilla)
-- 4. Creación del usuario SuperAdmin (admin@kobcloud.com / admin123)
-- 5. Función para eliminar empresas completas y sus usuarios
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ==============================================================================
-- 1. ASEGURAR QUE LA EMPRESA PRINCIPAL / DEFAULT EXISTE
-- ==============================================================================
INSERT INTO public.empresas (
    id,
    codigo,
    nombre,
    razon_social,
    rnc,
    plan,
    estado,
    correo,
    telefono
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'koba-principal',
    'KOBA Flagship Store',
    'KOBA CLOUD CORP S.R.L.',
    '131-00001-1',
    'enterprise',
    'activo',
    'admin@kobcloud.com',
    '809-555-0001'
)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    plan = 'enterprise',
    estado = 'activo';

-- ==============================================================================
-- 2. POLÍTICAS RLS DE LA TABLA EMPRESAS (Permitir listar, crear y borrar)
-- ==============================================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresas_all_policy ON public.empresas;
CREATE POLICY empresas_all_policy ON public.empresas
    FOR ALL TO authenticated, anon
    USING (TRUE)
    WITH CHECK (TRUE);

GRANT ALL ON TABLE public.empresas TO authenticated, anon, service_role;

-- ==============================================================================
-- 3. FUNCIÓN MAESTRA: crear_usuario_sistema (SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.crear_usuario_sistema(
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
    v_existing_auth_id UUID;
BEGIN
    -- Obtener empresa del llamador si existe
    SELECT empresa_id INTO v_caller_empresa FROM public.perfiles WHERE id = auth.uid();
    
    -- Determinar empresa objetivo
    v_target_empresa := COALESCE(
        p_empresa_id,
        v_caller_empresa,
        (SELECT id FROM public.empresas LIMIT 1),
        'a0000000-0000-0000-0000-000000000001'::uuid
    );

    -- Asegurar que la empresa objetivo existe para evitar violación de FK
    IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = v_target_empresa) THEN
        INSERT INTO public.empresas (id, codigo, nombre, plan, estado)
        VALUES (
            v_target_empresa,
            'empresa-' || substr(v_target_empresa::text, 1, 8),
            'Empresa Cliente',
            'pro',
            'activo'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Encriptar contraseña usando bcrypt (costo 10, compatible con Supabase GoTrue)
    v_encrypted := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    -- Verificar si el usuario ya existe en auth.users
    SELECT id INTO v_existing_auth_id FROM auth.users WHERE lower(email) = lower(trim(p_correo));

    IF v_existing_auth_id IS NOT NULL THEN
        -- Si ya existe, actualizamos contraseña y confirmamos email
        UPDATE auth.users
        SET 
            encrypted_password = v_encrypted,
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW(),
            raw_user_meta_data = jsonb_build_object('nombre_completo', p_nombre_completo),
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change = COALESCE(email_change, ''),
            phone_change = COALESCE(phone_change, ''),
            phone_change_token = COALESCE(phone_change_token, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            reauthentication_token = COALESCE(reauthentication_token, '')
        WHERE id = v_existing_auth_id;

        v_user_id := v_existing_auth_id;
    ELSE
        -- Nuevo usuario en auth.users
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            phone_change, phone_change_token, email_change_token_current, reauthentication_token
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            lower(trim(p_correo)),
            v_encrypted,
            NOW(), -- Confirmado de inmediato para que no requiera verificación de correo
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('nombre_completo', p_nombre_completo),
            NOW(),
            NOW(),
            '', '', '', '', '', '', '', ''
        );

        -- Registrar identidad en auth.identities
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_correo))),
            'email',
            v_user_id::text,
            NOW(),
            NOW(),
            NOW()
        )
        ON CONFLICT (provider, provider_id) DO NOTHING;
    END IF;

    -- Registrar o actualizar en la tabla perfiles
    INSERT INTO public.perfiles (
        id, empresa_id, nombre_completo, correo, telefono, rol, sucursal_id, codigo_acceso, activo
    ) VALUES (
        v_user_id,
        v_target_empresa,
        p_nombre_completo,
        lower(trim(p_correo)),
        p_telefono,
        p_rol,
        p_sucursal_id,
        p_codigo_acceso,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        empresa_id = EXCLUDED.empresa_id,
        nombre_completo = EXCLUDED.nombre_completo,
        telefono = EXCLUDED.telefono,
        rol = EXCLUDED.rol,
        sucursal_id = EXCLUDED.sucursal_id,
        codigo_acceso = EXCLUDED.codigo_acceso,
        activo = TRUE;

    RETURN v_user_id;
END;
$$;

-- ==============================================================================
-- 4. FUNCIÓN PARA CAMBIAR CONTRASEÑA DIRECTAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cambiar_password_usuario(
    p_correo TEXT,
    p_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_encrypted TEXT;
BEGIN
    v_encrypted := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    UPDATE auth.users
    SET 
        encrypted_password = v_encrypted,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE lower(email) = lower(trim(p_correo));
END;
$$;

-- ==============================================================================
-- 5. FUNCIÓN PARA ELIMINAR EMPRESA COMPLETA (Y SUS USUARIOS EN AUTH)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.eliminar_empresa_completa(p_empresa_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar usuarios en auth.users asociados a esta empresa
    FOR r IN (SELECT id FROM public.perfiles WHERE empresa_id = p_empresa_id) LOOP
        DELETE FROM auth.users WHERE id = r.id;
    END LOOP;

    -- Eliminar la empresa de la tabla empresas (cascada borrará ventas, productos, etc.)
    DELETE FROM public.empresas WHERE id = p_empresa_id;
END;
$$;

-- ==============================================================================
-- 6. PERMISOS DE EJECUCIÓN
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.crear_usuario_sistema TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cambiar_password_usuario TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eliminar_empresa_completa TO authenticated, anon, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.perfiles TO anon, authenticated;
GRANT SELECT ON TABLE public.roles TO anon, authenticated;

-- ==============================================================================
-- 7. CREAR O RESTABLECER USUARIO SUPERADMIN (admin@kobcloud.com / admin123)
-- ==============================================================================
SELECT public.crear_usuario_sistema(
    'admin@kobcloud.com',
    'admin123',
    'Super Admin Kob Cloud',
    'admin',
    NULL,
    '809-555-0001',
    '1001',
    'a0000000-0000-0000-0000-000000000001'
);

-- Marcar como SuperAdmin en perfiles
UPDATE public.perfiles
SET es_superadmin = TRUE, activo = TRUE
WHERE correo = 'admin@kobcloud.com';

-- Auto-confirmar todos los usuarios existentes en auth.users
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
