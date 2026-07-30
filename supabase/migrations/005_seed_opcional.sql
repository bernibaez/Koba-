-- Seed opcional MarketERP
-- 1) Ejecutar migraciones 001–004
-- 2) Crear el primer admin (elige UNA opción)

-- Opción A: desde SQL Editor (como postgres / service role), tras crear
-- un usuario en Authentication > Users del dashboard de Supabase,
-- insertar el perfil enlazado:
--
-- INSERT INTO perfiles (id, nombre_completo, correo, rol, activo)
-- VALUES (
--   '<uuid-del-auth-user>',
--   'Admin General',
--   'admin@marketerp.do',
--   'admin',
--   TRUE
-- );

-- Opción B: bootstrap con RPC (sin perfiles previos la función permite crear el primero).
-- Debe ejecutarse autenticado o vía service role llamando crear_usuario_sistema.

INSERT INTO sucursales (codigo, nombre, direccion, telefono, rnc, activo)
VALUES ('SUC-01', 'Sucursal Principal', 'Av. Principal #100, Santo Domingo', '809-555-0100', '101000001', TRUE)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rangos_ncf (tipo_ncf, prefijo, secuencia_actual, secuencia_fin, activo)
VALUES
  ('B01', 'B01', 0, 99999999, TRUE),
  ('B02', 'B02', 0, 99999999, TRUE);
