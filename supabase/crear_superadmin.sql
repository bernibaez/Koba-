-- ==============================================================================
-- KOBA / Kob Cloud ERP — CREAR USUARIO SUPERADMINISTRADOR
-- ==============================================================================
-- Ejecuta este script en Supabase SQL Editor para crear o restablecer tu usuario
-- Super-Administrador con acceso omnisciente al panel /superadmin y a todas las empresas.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_correo TEXT := 'admin@kobcloud.com';
    v_password TEXT := 'admin123'; -- Cambia tu contraseña si lo deseas
    v_nombre TEXT := 'Super Admin Kob Cloud';
    v_empresa_id UUID := 'a0000000-0000-0000-0000-000000000001';
    v_encrypted TEXT;
BEGIN
    -- Asegurar que la empresa principal existe
    INSERT INTO empresas (id, codigo, nombre, razon_social, rnc, plan, estado)
    VALUES (
        v_empresa_id,
        'koba-demo',
        'KOBA Flagship Store',
        'KOBA COMERCIAL S.R.L.',
        '131-00000-1',
        'enterprise',
        'activo'
    )
    ON CONFLICT (codigo) DO NOTHING;

    -- Generar hash bcrypt de la contraseña
    v_encrypted := crypt(v_password, gen_salt('bf'));

    -- 1. Insertar o actualizar en auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(v_correo)) THEN
        UPDATE auth.users
        SET encrypted_password = v_encrypted,
            raw_user_meta_data = jsonb_build_object('nombre_completo', v_nombre),
            updated_at = NOW()
        WHERE email = lower(v_correo);

        SELECT id INTO v_user_id FROM auth.users WHERE email = lower(v_correo);
    ELSE
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            phone_change,
            phone_change_token,
            email_change_token_current,
            reauthentication_token
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            lower(v_correo),
            v_encrypted,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('nombre_completo', v_nombre),
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', lower(v_correo)),
            'email',
            v_user_id::text,
            NOW(),
            NOW(),
            NOW()
        )
        ON CONFLICT (provider, provider_id) DO NOTHING;
    END IF;

    -- 2. Insertar o actualizar en perfiles con bandera es_superadmin = TRUE
    INSERT INTO perfiles (
        id,
        empresa_id,
        nombre_completo,
        correo,
        telefono,
        rol,
        es_superadmin,
        activo
    ) VALUES (
        v_user_id,
        v_empresa_id,
        v_nombre,
        lower(v_correo),
        '809-555-0001',
        'admin',
        TRUE,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        empresa_id = v_empresa_id,
        nombre_completo = v_nombre,
        rol = 'admin',
        es_superadmin = TRUE,
        activo = TRUE;

    RAISE NOTICE '¡SuperAdmin % creado exitosamente con contraseña %!', v_correo, v_password;
END $$;
