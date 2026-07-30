-- Índices de alto rendimiento

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm ON productos USING gin (nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ventas_creado_en ON ventas(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_factura ON ventas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_ventas_cajero ON ventas(cajero_id);
CREATE INDEX IF NOT EXISTS idx_ventas_sucursal ON ventas(sucursal_id);

CREATE INDEX IF NOT EXISTS idx_combos_codigo ON combos(codigo);
CREATE INDEX IF NOT EXISTS idx_combos_activo ON combos(activo);

CREATE INDEX IF NOT EXISTS idx_ajustes_stock_producto ON ajustes_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_stock_creado ON ajustes_stock(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm ON clientes USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_estado ON cierres_caja(estado);
CREATE INDEX IF NOT EXISTS idx_cierres_caja_cajero ON cierres_caja(cajero_id);

CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles(rol);
CREATE INDEX IF NOT EXISTS idx_perfiles_correo ON perfiles(correo);
