-- RPCs transaccionales MarketERP

-- Helper: rol del usuario autenticado
CREATE OR REPLACE FUNCTION obtener_rol_actual()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;

-- ============================================================
-- crear_usuario_sistema: admin inserta usuario sin signup público
-- ============================================================
CREATE OR REPLACE FUNCTION crear_usuario_sistema(
    p_correo TEXT,
    p_password TEXT,
    p_nombre_completo TEXT,
    p_rol TEXT DEFAULT 'cajero',
    p_sucursal_id UUID DEFAULT NULL,
    p_telefono TEXT DEFAULT NULL,
    p_codigo_acceso TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_caller_rol TEXT;
    v_user_id UUID;
    v_encrypted TEXT;
BEGIN
    SELECT rol INTO v_caller_rol FROM perfiles WHERE id = auth.uid();

    -- Permitir bootstrap si no hay perfiles aún (primer admin vía service/SQL)
    IF EXISTS (SELECT 1 FROM perfiles LIMIT 1) THEN
        IF v_caller_rol IS NULL OR v_caller_rol NOT IN ('admin', 'super_admin') THEN
            RAISE EXCEPTION 'Solo admin/super_admin pueden crear usuarios';
        END IF;
    END IF;

    IF p_rol NOT IN ('admin', 'super_admin', 'cajero', 'almacen', 'contable', 'vendedor') THEN
        RAISE EXCEPTION 'Rol inválido: %', p_rol;
    END IF;

    IF EXISTS (SELECT 1 FROM perfiles WHERE correo = lower(p_correo)) THEN
        RAISE EXCEPTION 'Ya existe un usuario con ese correo';
    END IF;

    v_user_id := gen_random_uuid();
    v_encrypted := crypt(p_password, gen_salt('bf'));

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
        email_change
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        lower(p_correo),
        v_encrypted,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nombre_completo', p_nombre_completo),
        NOW(),
        NOW(),
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
        jsonb_build_object('sub', v_user_id::text, 'email', lower(p_correo)),
        'email',
        v_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );

    INSERT INTO perfiles (
        id, nombre_completo, correo, telefono, rol, sucursal_id, codigo_acceso, activo
    ) VALUES (
        v_user_id,
        p_nombre_completo,
        lower(p_correo),
        p_telefono,
        p_rol,
        p_sucursal_id,
        p_codigo_acceso,
        TRUE
    );

    RETURN v_user_id;
END;
$$;

-- ============================================================
-- procesar_venta_pos
-- ============================================================
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
    v_qty NUMERIC;
    v_combo_item RECORD;
    v_seq BIGINT;
BEGIN
    v_venta_id := gen_random_uuid();
    v_numero := COALESCE(
        p_payload->>'numero_factura',
        'FAC-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_venta_id::text, 1, 8)
    );
    v_tipo_ncf := p_payload->>'tipo_ncf';

    IF v_tipo_ncf IS NOT NULL AND length(v_tipo_ncf) > 0 THEN
        UPDATE rangos_ncf
        SET secuencia_actual = secuencia_actual + 1
        WHERE tipo_ncf = v_tipo_ncf AND activo = TRUE AND secuencia_actual < secuencia_fin
        RETURNING secuencia_actual, prefijo INTO v_seq, v_ncf;

        IF v_seq IS NULL THEN
            RAISE EXCEPTION 'No hay rango NCF disponible para tipo %', v_tipo_ncf;
        END IF;
        v_ncf := v_ncf || lpad(v_seq::text, 8, '0');
    ELSE
        v_ncf := p_payload->>'ncf';
    END IF;

    INSERT INTO ventas (
        id, numero_factura, ncf, tipo_ncf, sucursal_id, cajero_id, cliente_id, caja_id,
        subtotal, monto_impuesto, monto_descuento, monto_total, costo_total,
        metodo_pago, monto_pagado, monto_efectivo, monto_tarjeta, monto_transferencia,
        monto_credito, devuelta_entregada, estado
    ) VALUES (
        v_venta_id,
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
                SET stock_actual = GREATEST(0, stock_actual - ceil(v_qty)::INT),
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
                    SET stock_actual = GREATEST(
                            0,
                            stock_actual - ceil(v_combo_item.cantidad * v_qty)::INT
                        ),
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

-- ============================================================
-- procesar_ajuste_stock_bloque
-- ============================================================
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
    v_nueva INT;
    v_anterior INT;
    v_codigo TEXT;
    v_count INT := 0;
    v_ids UUID[] := ARRAY[]::UUID[];
    v_ajuste_id UUID;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
    LOOP
        v_prod_id := (v_item->>'producto_id')::UUID;
        v_tipo := v_item->>'tipo_ajuste';
        v_nueva := (v_item->>'cantidad_nueva')::INT;

        SELECT stock_actual INTO v_anterior FROM productos WHERE id = v_prod_id FOR UPDATE;
        IF v_anterior IS NULL THEN
            RAISE EXCEPTION 'Producto no encontrado: %', v_prod_id;
        END IF;

        IF v_item ? 'cantidad_nueva' THEN
            v_nueva := (v_item->>'cantidad_nueva')::INT;
        ELSIF v_tipo = 'entrada' THEN
            v_nueva := v_anterior + COALESCE((v_item->>'cantidad_variacion')::INT, 0);
        ELSIF v_tipo IN ('salida', 'perdida') THEN
            v_nueva := GREATEST(0, v_anterior - ABS(COALESCE((v_item->>'cantidad_variacion')::INT, 0)));
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

-- ============================================================
-- obtener_metricas_dashboard
-- ============================================================
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
BEGIN
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
    WHERE estado = 'completada' AND creado_en >= v_desde AND creado_en <= v_hasta;

    SELECT COUNT(*)::INT INTO v_productos_bajos
    FROM productos
    WHERE estado = 'activo' AND stock_actual <= stock_minimo;

    SELECT COUNT(*)::INT INTO v_productos_total
    FROM productos WHERE estado = 'activo';

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

GRANT EXECUTE ON FUNCTION crear_usuario_sistema TO authenticated;
GRANT EXECUTE ON FUNCTION procesar_venta_pos TO authenticated;
GRANT EXECUTE ON FUNCTION procesar_ajuste_stock_bloque TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_metricas_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_rol_actual TO authenticated;
