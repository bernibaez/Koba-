-- Migration 010: RPCs avanzadas para el Módulo de Ventas (Anulaciones, Cotizaciones y Devoluciones)

-- ============================================================
-- 1. Anular Venta y Restaurar Inventario
-- ============================================================
CREATE OR REPLACE FUNCTION anular_venta_pos(
    p_venta_id UUID,
    p_motivo TEXT DEFAULT 'Anulación de venta'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_venta RECORD;
    v_item RECORD;
    v_combo_item RECORD;
BEGIN
    SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id FOR UPDATE;
    IF v_venta.id IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada';
    END IF;

    IF v_venta.estado = 'anulada' THEN
        RAISE EXCEPTION 'La venta ya se encuentra anulada';
    END IF;

    -- Actualizar estado de la venta
    UPDATE ventas
    SET estado = 'anulada'
    WHERE id = p_venta_id;

    -- Restaurar stock para productos y combos de la venta
    FOR v_item IN SELECT * FROM detalle_ventas WHERE venta_id = p_venta_id
    LOOP
        IF v_item.tipo_item = 'producto' AND v_item.producto_id IS NOT NULL THEN
            UPDATE productos
            SET stock_actual = stock_actual + ceil(v_item.cantidad)::INT,
                actualizado_en = NOW()
            WHERE id = v_item.producto_id;
        ELSIF v_item.tipo_item = 'combo' AND v_item.combo_id IS NOT NULL THEN
            FOR v_combo_item IN
                SELECT producto_id, cantidad FROM combo_items WHERE combo_id = v_item.combo_id
            LOOP
                UPDATE productos
                SET stock_actual = stock_actual + ceil(v_combo_item.cantidad * v_item.cantidad)::INT,
                    actualizado_en = NOW()
                WHERE id = v_combo_item.producto_id;
            END LOOP;
        END IF;
    END LOOP;

    -- Actualizar estado de CxC si existe
    UPDATE cuentas_por_cobrar
    SET estado = 'anulada'
    WHERE venta_id = p_venta_id;

    RETURN jsonb_build_object(
        'exito', true,
        'venta_id', p_venta_id,
        'numero_factura', v_venta.numero_factura
    );
END;
$$;

-- ============================================================
-- 2. Convertir Cotización a Venta
-- ============================================================
CREATE OR REPLACE FUNCTION convertir_cotizacion_pos(
    p_cotizacion_id UUID,
    p_metodo_pago TEXT DEFAULT 'efectivo',
    p_monto_pagado NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cot RECORD;
    v_item RECORD;
    v_items_array JSONB := '[]'::jsonb;
    v_payload JSONB;
    v_resultado JSONB;
BEGIN
    SELECT * INTO v_cot FROM cotizaciones WHERE id = p_cotizacion_id FOR UPDATE;
    IF v_cot.id IS NULL THEN
        RAISE EXCEPTION 'Cotización no encontrada';
    END IF;

    IF v_cot.estado = 'convertida' THEN
        RAISE EXCEPTION 'La cotización ya fue convertida a venta';
    END IF;

    -- Construir array de ítems para procesar_venta_pos
    FOR v_item IN SELECT * FROM detalle_cotizaciones WHERE cotizacion_id = p_cotizacion_id
    LOOP
        v_items_array := v_items_array || jsonb_build_object(
            'producto_id', v_item.producto_id,
            'tipo_item', 'producto',
            'nombre_item', v_item.nombre_item,
            'precio_unitario', v_item.precio_unitario,
            'costo_unitario', 0,
            'cantidad', v_item.cantidad,
            'porcentaje_impuesto', 18,
            'subtotal', v_item.subtotal
        );
    END LOOP;

    v_payload := jsonb_build_object(
        'cliente_id', v_cot.cliente_id,
        'cajero_id', v_cot.vendedor_id,
        'subtotal', v_cot.subtotal,
        'monto_impuesto', v_cot.monto_impuesto,
        'monto_descuento', 0,
        'monto_total', v_cot.monto_total,
        'costo_total', 0,
        'metodo_pago', p_cotizacion_id,
        'monto_pagado', COALESCE(p_monto_pagado, v_cot.monto_total),
        'items', v_items_array
    );

    v_resultado := procesar_venta_pos(v_payload);

    -- Marcar cotización como convertida
    UPDATE cotizaciones
    SET estado = 'convertida',
        convertido_venta_id = (v_resultado->>'venta_id')::UUID
    WHERE id = p_cotizacion_id;

    RETURN v_resultado;
END;
$$;

-- ============================================================
-- 3. Procesar Estado de Devolución (Aprobar / Rechazar)
-- ============================================================
CREATE OR REPLACE FUNCTION procesar_devolucion_pos(
    p_devolucion_id UUID,
    p_nuevo_estado TEXT,
    p_revisado_por UUID DEFAULT NULL,
    p_motivo_rechazo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_dev RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_dev FROM devoluciones WHERE id = p_devolucion_id FOR UPDATE;
    IF v_dev.id IS NULL THEN
        RAISE EXCEPTION 'Devolución no encontrada';
    END IF;

    IF p_nuevo_estado NOT IN ('aprobada', 'rechazada') THEN
        RAISE EXCEPTION 'Estado no permitido';
    END IF;

    UPDATE devoluciones
    SET estado = p_nuevo_estado,
        revisado_por = COALESCE(p_revisado_por, auth.uid()),
        revisado_en = NOW(),
        motivo_rechazo = CASE WHEN p_nuevo_estado = 'rechazada' THEN p_motivo_rechazo ELSE NULL END
    WHERE id = p_devolucion_id;

    -- Si se aprueba la devolución, reingresar stock a productos
    IF p_nuevo_estado = 'aprobada' THEN
        FOR v_item IN SELECT * FROM detalle_devoluciones WHERE devolucion_id = p_devolucion_id
        LOOP
            IF v_item.producto_id IS NOT NULL THEN
                UPDATE productos
                SET stock_actual = stock_actual + ceil(v_item.cantidad)::INT,
                    actualizado_en = NOW()
                WHERE id = v_item.producto_id;
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'exito', true,
        'devolucion_id', p_devolucion_id,
        'nuevo_estado', p_nuevo_estado
    );
END;
$$;

GRANT EXECUTE ON FUNCTION anular_venta_pos TO authenticated;
GRANT EXECUTE ON FUNCTION convertir_cotizacion_pos TO authenticated;
GRANT EXECUTE ON FUNCTION procesar_devolucion_pos TO authenticated;
