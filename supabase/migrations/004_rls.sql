-- Row Level Security MarketERP

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rangos_ncf ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_caja ENABLE ROW LEVEL SECURITY;

-- Helper inline: es admin
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND rol IN ('admin', 'super_admin') AND activo = TRUE
  );
$$;

-- Perfiles
CREATE POLICY perfiles_select_own_or_admin ON perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR es_admin());

CREATE POLICY perfiles_update_own_or_admin ON perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR es_admin());

CREATE POLICY perfiles_insert_admin ON perfiles
  FOR INSERT TO authenticated
  WITH CHECK (es_admin() OR NOT EXISTS (SELECT 1 FROM perfiles));

CREATE POLICY perfiles_delete_admin ON perfiles
  FOR DELETE TO authenticated
  USING (es_admin());

-- Sucursales / proveedores: lectura autenticada, escritura admin
CREATE POLICY sucursales_select ON sucursales FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY sucursales_write ON sucursales FOR ALL TO authenticated USING (es_admin()) WITH CHECK (es_admin());

CREATE POLICY proveedores_select ON proveedores FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY proveedores_write ON proveedores FOR ALL TO authenticated USING (es_admin()) WITH CHECK (es_admin());

-- Productos
CREATE POLICY productos_select ON productos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY productos_insert ON productos FOR INSERT TO authenticated
  WITH CHECK (es_admin() OR obtener_rol_actual() IN ('almacen'));
CREATE POLICY productos_update ON productos FOR UPDATE TO authenticated
  USING (es_admin() OR obtener_rol_actual() IN ('almacen', 'cajero', 'vendedor'));
CREATE POLICY productos_delete ON productos FOR DELETE TO authenticated USING (es_admin());

-- Combos
CREATE POLICY combos_select ON combos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY combos_write ON combos FOR ALL TO authenticated
  USING (es_admin() OR obtener_rol_actual() IN ('almacen', 'vendedor'))
  WITH CHECK (es_admin() OR obtener_rol_actual() IN ('almacen', 'vendedor'));

CREATE POLICY combo_items_select ON combo_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY combo_items_write ON combo_items FOR ALL TO authenticated
  USING (es_admin() OR obtener_rol_actual() IN ('almacen', 'vendedor'))
  WITH CHECK (es_admin() OR obtener_rol_actual() IN ('almacen', 'vendedor'));

-- Clientes
CREATE POLICY clientes_select ON clientes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY clientes_write ON clientes FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- NCF
CREATE POLICY rangos_ncf_select ON rangos_ncf FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY rangos_ncf_write ON rangos_ncf FOR ALL TO authenticated USING (es_admin()) WITH CHECK (es_admin());

-- Ventas / detalle
CREATE POLICY ventas_select ON ventas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY ventas_insert ON ventas FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY ventas_update ON ventas FOR UPDATE TO authenticated USING (es_admin());

CREATE POLICY detalle_ventas_select ON detalle_ventas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY detalle_ventas_insert ON detalle_ventas FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Ajustes
CREATE POLICY ajustes_select ON ajustes_stock FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY ajustes_insert ON ajustes_stock FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Cierres
CREATE POLICY cierres_select ON cierres_caja FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY cierres_write ON cierres_caja FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);
