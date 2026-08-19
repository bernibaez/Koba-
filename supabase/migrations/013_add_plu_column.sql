-- Migración 013: columna PLU para productos de balanza + recarga del schema cache de PostgREST.
-- Segura de ejecutar varias veces. Si ves "Could not find the 'plu' column", corre este SQL
-- en Supabase → SQL Editor y recarga la app.

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS plu TEXT;

CREATE INDEX IF NOT EXISTS idx_productos_plu ON public.productos(plu);

-- Fuerza a PostgREST a ver la columna nueva (evita PGRST204 / schema cache).
NOTIFY pgrst, 'reload schema';
