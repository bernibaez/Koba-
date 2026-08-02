# MarketERP

ERP/POS de supermercado (Vite + React) con integración a **Supabase / PostgreSQL**.

## Configuración Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia `.env.example` → `.env` y pega:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. En el SQL Editor, ejecuta en orden las migraciones de `supabase/migrations/`:
   - `001_esquema_inicial.sql`
   - `002_indices.sql`
   - `003_rpc.sql`
   - `004_rls.sql`
   - `005_seed_opcional.sql`
   - `006_tablas_faltantes.sql` (compras, CxC/CxP, gastos, devoluciones, transferencias, cajas, fiscal, auditoría, etc.)
   - `007_productos_permisos_y_columnas.sql` (si `/productos` da 400: columnas, GRANT y reload schema)

4. Crea el primer admin (opción A: Dashboard Auth → Users, luego inserta en `perfiles`; opción B: RPC `crear_usuario_sistema` sin perfiles previos).

Sin `.env` configurado, la app sigue en **modo local** (localStorage / cuentas demo).

## Arquitectura

```
UI (páginas) → Custom Hooks → Servicios → Supabase JS / RPC
```

- Tablas y RPCs en español.
- Sin `supabase.from()` en componentes.
- Selects con columnas explícitas, paginación remota, AbortController en hooks.

## Scripts

```bash
npm install
npm run dev
npm run type-check
```
