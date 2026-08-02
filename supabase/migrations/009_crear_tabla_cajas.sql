-- Migración 009: Crear tabla de cajas registradoras
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    sucursal_id UUID,
    es_caja_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS sucursal_id UUID;
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS es_caja_principal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT TRUE;
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.cajas ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- Políticas de RLS
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cajas_select ON cajas;
CREATE POLICY cajas_select ON cajas
  FOR SELECT TO authenticated, anon
  USING (TRUE);

DROP POLICY IF EXISTS cajas_insert ON cajas;
CREATE POLICY cajas_insert ON cajas
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS cajas_update ON cajas;
CREATE POLICY cajas_update ON cajas
  FOR UPDATE TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS cajas_delete ON cajas;
CREATE POLICY cajas_delete ON cajas
  FOR DELETE TO authenticated
  USING (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cajas TO authenticated;
GRANT SELECT ON TABLE cajas TO anon;

-- Sembrar cajas por defecto
INSERT INTO cajas (codigo, nombre, descripcion, es_caja_principal, activa) VALUES
('1', 'Caja #1 - Administrador', 'Caja principal de administración', TRUE, TRUE),
('2', 'Caja #2 - Mostrador Principal', 'Caja de atención y ventas en mostrador', FALSE, TRUE),
('3', 'Caja #3 - Servicio Rápido / Express', 'Caja rápida para cobros expreso', FALSE, TRUE),
('4', 'Caja #4 - Sucursal Remanente', 'Caja secundaria para turnos remanentes', FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

NOTIFY pgrst, 'reload schema';
