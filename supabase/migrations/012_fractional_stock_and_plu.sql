-- Migración 012: Soporte para inventario fraccionario (NUMERIC) y columna PLU independiente para balanza
-- Fecha: 2026-08-14

-- 1. Alterar stock_actual y stock_minimo a NUMERIC(12,3) para permitir decimales (ej. 97.954 lb)
ALTER TABLE productos 
  ALTER COLUMN stock_actual TYPE NUMERIC(12, 3) USING stock_actual::NUMERIC(12, 3),
  ALTER COLUMN stock_minimo TYPE NUMERIC(12, 3) USING stock_minimo::NUMERIC(12, 3);

-- 2. Agregar columna PLU independiente conservando ceros a la izquierda (ej. "00132")
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS plu TEXT;

-- 3. Crear índice para acelerar la búsqueda por PLU de balanza en POS
CREATE INDEX IF NOT EXISTS idx_productos_plu ON productos(plu);

-- 4. Actualizar procedimiento procesar_venta_pos para descontar inventario fraccionario sin ceil()
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
    v_qty NUMERIC(12, 3);
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

        v_qty := COALESCE((v_item->>'cantidad')::NUMERIC(12,3), 1);

        IF COALESCE(v_item->>'tipo_item', 'producto') = 'producto' THEN
            v_prod_id := NULLIF(v_item->>'producto_id', '')::UUID;
            IF v_prod_id IS NOT NULL THEN
                -- Descontar exactamente v_qty (soporta cantidades enteras y fraccionarias como 2.046 lb)
                UPDATE productos
                SET stock_actual = GREATEST(0, stock_actual - v_qty),
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
                            stock_actual - (v_combo_item.cantidad * v_qty)
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
