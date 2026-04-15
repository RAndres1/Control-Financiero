# Project Handoff

## Estado actual real

La app ya no esta en el MVP original sin auth.

El estado actual es:

- Next.js 14 con App Router
- TypeScript
- Tailwind
- Supabase SSR con cookies
- login/signup con Supabase Auth
- RLS activa
- modelo multiusuario por `workspaces`
- despliegue exitoso en Vercel

La version desplegada ya compilo en Vercel despues de corregir errores de tipado en queries.

## Lo que quedo funcionando

### Auth

Archivos clave:

- `app/login/page.tsx`
- `lib/auth-actions.ts`
- `lib/supabase/server.ts`
- `middleware.ts`

Estado:

- login con correo y contrasena
- signup con Supabase Auth
- persistencia por cookies SSR
- proteccion de rutas con `middleware`
- logout funcional

Problemas resueltos:

- `Invalid API key` causado por una `NEXT_PUBLIC_SUPABASE_ANON_KEY` mal copiada en `.env.local`
- bloque debug de login removido

### Multiworkspace

Archivos clave:

- `lib/data/queries.ts`
- `lib/actions.ts`
- `components/workspace-controls.tsx`
- `components/layout-shell.tsx`
- `components/movement-category-field.tsx`
- `lib/types.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260414_multitenant_workspaces.sql`

Estado:

- `accounts`, `categories` y `movements` dependen de `workspace_id`
- `workspaces.kind` define `personal` o `business`
- scope por query string: `personal | business | all`
- dashboard, reportes y CRUDs ya filtran por `workspaceIds`
- selector global de scope ya no muestra scopes invalidos

Problemas resueltos:

- antes la UI dejaba elegir `Negocio` y `Ambos` aunque el usuario no tuviera ese workspace
- ahora solo muestra scopes realmente disponibles

### Crear workspace business

Estado:

- la base ya soportaba `complete_onboarding(...)`
- faltaba una accion/UI para crear workspace `business`
- se agrego `createBusinessWorkspaceAction`
- se agrego control en el header para crear el espacio de negocio si no existe

Archivos clave:

- `lib/actions.ts`
- `components/layout-shell.tsx`
- `lib/supabase/database.types.ts`

### Supabase / permisos

Problema resuelto:

- error `permission denied for table workspaces`

Causa:

- habia policies RLS pero faltaban `GRANT` SQL base para `authenticated`

Se corrigio en:

- `supabase/schema.sql`
- `supabase/migrations/20260414_multitenant_workspaces.sql`

### Deploy

Estado:

- cambios subidos a GitHub
- deploy realizado en Vercel

Commit importante para el build:

- `cfa5cdf` - `Fix query typing for Vercel build`

## Cambio tecnico importante para recordar

En `lib/data/queries.ts` hubo que cambiar varios casts:

- de `as Account[]`
- a `as unknown as Account[]`

y equivalentes para `Category[]` y `Movement[]`.

Motivo:

- `lib/supabase/database.types.ts` no tiene bien descritas las relaciones de joins
- Supabase tipa ciertos `select(...)` con joins como `SelectQueryError<...>`
- eso rompía `next build` en Vercel aunque el runtime real de la app funcionara

Esto es un workaround pragmatico para despliegue rapido.

## Pendientes reales

### 1. Onboarding formal

La base soporta onboarding, pero la UI no esta terminada.

Falta:

- `app/onboarding/page.tsx`
- redirect en `app/layout.tsx` segun `profiles.onboarding_completed`

Hoy la app se puede usar sin eso porque:

- siempre se crea el workspace personal
- el business se puede crear desde el header

### 2. Tipos de Supabase

Pendiente tecnico:

- regenerar o corregir `lib/supabase/database.types.ts`
- describir bien funciones y relaciones

Motivo:

- evitar casts `unknown`
- recuperar tipado estricto de joins

### 3. Verificacion post-deploy

Antes de compartir mas ampliamente, validar en produccion:

- signup
- login
- logout
- persistencia de sesion
- creacion de cuenta
- creacion de categoria
- creacion de movimiento
- dashboard actualizado
- creacion de workspace business
- cambio entre `Personal`, `Negocio` y `Ambos`
- aislamiento entre dos usuarios reales

### 4. Configuracion de Supabase Auth

Confirmar en el proyecto real:

- `Site URL` apuntando a Vercel produccion
- `Redirect URLs` con localhost y previews de Vercel

## Archivos que conviene leer primero al retomar

- `PROJECT_HANDOFF.md`
- `lib/data/queries.ts`
- `lib/actions.ts`
- `components/layout-shell.tsx`
- `components/workspace-controls.tsx`
- `app/login/page.tsx`
- `supabase/schema.sql`

## Siguiente paso recomendado al retomar

El siguiente paso mas util y pragmatico es:

1. probar produccion con 2 usuarios reales
2. confirmar aislamiento de datos
3. si todo sale bien, cerrar onboarding minimo o dejar instrucciones de uso para la familia

No hace falta sobrearquitectar antes de esa validacion.
