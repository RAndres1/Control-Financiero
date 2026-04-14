# Project Handoff

## Estado general

La app base ya funciona con:

- Next.js
- TypeScript
- Tailwind
- Supabase/Postgres

La arquitectura se mantuvo simple y server-side:

- `app/` con App Router
- `lib/actions.ts` para server actions CRUD
- `lib/data/queries.ts` para lecturas y agregados
- `lib/supabase/server.ts` para cliente Supabase del lado servidor
- sin estado global
- sin librerias extra innecesarias
- sin auth por ahora

## Modulos ya cerrados

### Accounts

Listo:

- crear cuenta
- listar cuentas
- editar cuenta
- eliminar cuenta
- validacion de:
  - nombre obligatorio
  - saldo inicial >= 0
  - owner_type valido
- saldo actual calculado con:
  - `initial_balance + incomes - expenses`
- refresco correcto de `/`, `/accounts` y `/movements`

Archivos clave:

- `app/accounts/page.tsx`
- `lib/actions.ts`
- `lib/data/queries.ts`

### Categories

Listo:

- crear categoria
- listar categorias
- editar categoria
- eliminar categoria
- diferenciacion por:
  - `owner_type`
  - `kind`
- nombre obligatorio
- evita duplicados razonables por:
  - `lower(name) + owner_type + kind`
- borrado seguro:
  - no permite eliminar categorias con movimientos asociados

Integracion con movimientos:

- el selector de categorias en `movements` solo muestra categorias compatibles con:
  - `owner_type`
  - `kind`
- el backend tambien valida esa compatibilidad

Archivos clave:

- `app/categories/page.tsx`
- `components/movement-category-field.tsx`
- `app/movements/page.tsx`
- `lib/actions.ts`
- `supabase/schema.sql`

### Movements

Listo:

- crear movimiento
- listar movimientos
- editar movimiento
- eliminar movimiento
- filtros simples por:
  - tipo
  - cuenta
  - categoria
  - mes

Reglas actuales:

- `amount > 0`
- `account_id` obligatorio
- `category_id` obligatorio
- `kind` valido
- `owner_type` valido
- `income` suma al balance
- `expense` resta al balance
- `description` puede quedar vacio:
  - si no hay `description`, usa `notes`
  - si no hay ninguno, guarda `"Movimiento sin descripcion"`

Refresco correcto:

- `/`
- `/accounts`
- `/movements`

Archivos clave:

- `app/movements/page.tsx`
- `lib/actions.ts`
- `lib/data/queries.ts`

### Dashboard

Listo:

- ingresos del mes personal
- gastos del mes personal
- balance del mes personal
- ingresos del mes negocio
- gastos del mes negocio
- balance global del mes
- balances por cuenta
- ultimos movimientos
- bloque de insights simples
- top de gasto por categoria
- resumen personal vs negocio

Archivo clave:

- `app/page.tsx`

### Reportes basicos

Listo en `/reports`:

- gasto por categoria
- ingreso por categoria
- comparacion mensual simple
- resumen personal vs negocio
- flujo neto del mes

Archivo clave:

- `app/reports/page.tsx`

## Insights simples ya implementados

Reglas actuales en `lib/data/queries.ts`:

- este mes gastaste mas que el mes anterior
- tu categoria con mayor gasto del mes
- el negocio gasto mas de lo que ingreso
- el flujo neto del mes es negativo
- los gastos personales estan concentrados en pocas categorias
- una cuenta esta bajando mas rapido que el mes anterior

Los insights:

- no usan IA
- son 100% basados en reglas
- salen de movimientos reales del mes actual y anterior

## Ruta actual del proyecto

- `app/`
  - `page.tsx`
  - `reports/page.tsx`
  - `accounts/page.tsx`
  - `categories/page.tsx`
  - `movements/page.tsx`
- `components/`
  - `layout-shell.tsx`
  - `ui.tsx`
  - `movement-category-field.tsx`
- `lib/`
  - `actions.ts`
  - `data/queries.ts`
  - `supabase/server.ts`
  - `supabase/database.types.ts`
  - `types.ts`
  - `utils.ts`
- `supabase/schema.sql`

## Supabase

Tablas activas:

- `accounts`
- `categories`
- `movements`

Puntos importantes:

- `movements.account_id` referencia `accounts.id`
- `movements.category_id` referencia `categories.id`
- `on delete restrict` evita borrar cuentas/categorias con movimientos asociados
- hay indice unico para categorias:
  - `lower(name), owner_type, kind`

Si se recrea la base o falta ese indice en un proyecto viejo, revisar `supabase/schema.sql`.

## Estado de compilacion

Ultimo estado validado:

- `npm run build` compila correctamente

## Decisiones importantes

- no sobrearquitectar
- mantener todo server-side mientras siga siendo MVP
- sin auth por ahora
- sin RLS por ahora
- sin librerias de charts
- sin IA compleja
- UI simple y clara

## Siguientes pasos sugeridos

Lo mas natural para continuar luego:

1. filtros por fecha mas completos en dashboard/reportes
2. semillas iniciales mas utiles
3. exportacion CSV simple
4. auth basica con Supabase cuando haga falta multiusuario
5. presets de categorias por negocio/personal
6. presupuesto mensual simple por categoria

## Nota para retomar

Cuando retomes, lo primero que conviene revisar es:

- `PROJECT_HANDOFF.md`
- `lib/data/queries.ts`
- `lib/actions.ts`
- `app/page.tsx`
- `app/reports/page.tsx`

Con eso ya deberia quedar claro casi todo el estado real del proyecto.
