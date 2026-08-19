-- Ajuste: no-admins ven ventas propias; editar/eliminar solo admin (salvo permisos explícitos).
-- Cajero: ver + exportar ventas (sin editar/eliminar).
-- Vendedor: ver/crear/exportar ventas (sin editar/eliminar por defecto).

UPDATE roles
SET permisos = jsonb_set(
  COALESCE(permisos, '{}'::jsonb),
  '{ventas}',
  '{"ver":true,"exportar":true,"crear":false,"editar":false,"eliminar":false}'::jsonb,
  true
),
actualizado_en = NOW()
WHERE codigo = 'cajero';

UPDATE roles
SET permisos = jsonb_set(
  COALESCE(permisos, '{}'::jsonb),
  '{ventas}',
  '{"ver":true,"crear":true,"exportar":true,"editar":false,"eliminar":false}'::jsonb,
  true
),
actualizado_en = NOW()
WHERE codigo = 'vendedor';

NOTIFY pgrst, 'reload schema';
