# Multiusuario con Workspaces

## 1. Modelo de datos actualizado

La separacion `owner_type = personal | business` deja de vivir en `accounts`, `categories` y `movements`.

La nueva estructura es:

- `profiles`
  - 1 fila por usuario autenticado en `auth.users`
  - guarda `email`, `full_name`, `onboarding_mode` y `onboarding_completed`
- `workspaces`
  - 1 workspace `personal` obligatorio por usuario
  - 1 workspace `business` opcional en esta v1
  - `owner_user_id` apunta al usuario duenio
- `workspace_members`
  - relacion usuario <-> workspace
  - hoy soporta `owner` y `member`
  - deja lista la base para compartir un workspace business mas adelante
- `accounts`
  - ahora dependen de `workspace_id`
- `categories`
  - ahora dependen de `workspace_id`
- `movements`
  - ahora dependen de `workspace_id`
  - se valida por trigger que `account_id`, `category_id` y `workspace_id` sean consistentes

Decisiones de esta v1:

- un usuario puede ser duenio de un solo workspace `personal`
- un usuario puede ser duenio de un solo workspace `business`
- la categoria sigue separada solo por `kind`
- el tipo `personal` o `business` se obtiene desde `workspaces.kind`
- no se agregan tablas extra de settings, invitations ni roles avanzados

## 2. Migracion desde el esquema actual

Archivo:

- [supabase/migrations/20260414_multitenant_workspaces.sql](C:/Users/af503/OneDrive/Desktop/Control financiero/supabase/migrations/20260414_multitenant_workspaces.sql:1)

Que hace:

- renombra las tablas actuales a:
  - `legacy_accounts`
  - `legacy_categories`
  - `legacy_movements`
- crea el nuevo esquema multiusuario
- crea trigger para perfil + workspace personal automatico al registrar usuarios nuevos
- crea la funcion `public.migrate_legacy_data_to_user(target_user_id uuid)`

Como migrar datos ya existentes:

1. Ejecuta la migracion.
2. Crea o identifica el usuario final en Supabase Auth.
3. Ejecuta:

```sql
select *
from public.migrate_legacy_data_to_user('USER_ID_AQUI');
```

Resultado:

- los datos legacy `personal` pasan al workspace personal del usuario
- los datos legacy `business` pasan a su workspace business
- el perfil queda con onboarding completado
- las tablas `legacy_*` quedan intactas para validacion manual

## 3. Politicas RLS minimas necesarias

Ya quedaron en el nuevo esquema:

- `profiles`
  - cada usuario solo puede leer y actualizar su perfil
- `workspaces`
  - un miembro puede leer su workspace
  - solo el owner puede actualizarlo
- `workspace_members`
  - un usuario puede ver sus membresias
  - un miembro puede ver quienes pertenecen a su workspace
- `accounts`, `categories`, `movements`
  - cualquier miembro puede leer
  - solo el owner puede crear, editar y eliminar

Esto mantiene la primera version simple y segura:

- hoy el caso real sigue siendo usuario unico por workspace
- manana ya puedes compartir un workspace business sin rehacer el modelo
- cuando llegue ese momento solo decides si `member` puede escribir o no

## 4. Flujo de onboarding

Base de datos:

- el trigger `handle_new_user()` crea automaticamente:
  - `profiles`
  - workspace `personal`
  - membership `owner`
- la funcion `public.complete_onboarding(selected_mode, business_workspace_name)` completa el setup

Flujo de UI recomendado:

1. Usuario se registra o inicia sesion.
2. `app/layout.tsx` valida sesion.
3. Si no hay sesion, redirige a `/login`.
4. Si `profiles.onboarding_completed = false`, redirige a `/onboarding`.
5. En `/onboarding` muestras solo dos opciones:
   - `Solo personal`
   - `Personal + negocio`
6. Si elige `Solo personal`, llamas `complete_onboarding('personal_only')`.
7. Si elige `Personal + negocio`, llamas `complete_onboarding('personal_and_business', 'Negocio')`.

Archivos a crear o cambiar:

- `app/layout.tsx`
  - proteger la app por sesion
- `app/onboarding/page.tsx`
  - formulario minimo de eleccion
- `app/login/page.tsx`
  - login/signup simple con Supabase Auth
- `lib/supabase/server.ts`
  - dejar de usar `SUPABASE_SERVICE_ROLE_KEY`
  - usar cliente server-side ligado a cookies/sesion

## 5. Cambios necesarios en dashboard, accounts, categories y movements

### Estado transversal

Necesitas un selector de alcance simple:

- `personal`
- `business`
- `all`

No hace falta una tabla extra. En esta v1 lo mas simple es resolverlo con:

- query string `?scope=personal|business|all`, o
- cookie de preferencia

La opcion mas simple para arrancar es `searchParams.scope`.

### Dashboard

Archivo:

- [app/page.tsx](C:/Users/af503/OneDrive/Desktop/Control financiero/app/page.tsx:1)

Cambio:

- hoy consume `getDashboardData()` sin usuario ni alcance
- debe pasar a consumir algo como:
  - `getDashboardData({ workspaceIds })`

`workspaceIds` debe salir de:

- memberships del usuario autenticado
- el `scope` seleccionado

Regla de lectura:

- `personal` usa solo el workspace personal
- `business` usa solo el workspace business si existe
- `all` usa ambos

En UI:

- muestra un selector arriba del dashboard
- conserva las metricas actuales
- cuando `scope = all`, la comparacion personal vs negocio sigue teniendo sentido
- cuando `scope = personal` o `business`, simplifica textos y evita duplicar tarjetas sin contexto

### Accounts

Archivo:

- [app/accounts/page.tsx](C:/Users/af503/OneDrive/Desktop/Control financiero/app/accounts/page.tsx:1)

Cambio:

- quitar el selector `owner_type`
- reemplazarlo por selector `workspace_id`
- si `scope` es `personal` o `business`, el formulario puede venir preseleccionado y hasta ocultar el selector
- si `scope = all`, conviene mostrar el selector de workspace

Backend:

- `saveAccountAction` debe validar que el usuario sea owner del `workspace_id`
- `getAccountsWithBalance()` debe aceptar `workspaceIds`

### Categories

Archivo:

- [app/categories/page.tsx](C:/Users/af503/OneDrive/Desktop/Control financiero/app/categories/page.tsx:1)

Cambio:

- quitar `owner_type`
- agregar `workspace_id`
- mantener `kind`
- listar categorias filtradas por `workspaceIds`

Backend:

- la unicidad pasa a `workspace_id + lower(name) + kind`
- `saveCategoryAction` valida solo membresia/ownership del workspace

### Movements

Archivos:

- [app/movements/page.tsx](C:/Users/af503/OneDrive/Desktop/Control financiero/app/movements/page.tsx:1)
- [components/movement-category-field.tsx](C:/Users/af503/OneDrive/Desktop/Control financiero/components/movement-category-field.tsx:1)

Cambio:

- quitar `owner_type`
- agregar `workspace_id`
- el selector de categorias ya no filtra por `owner_type`
- ahora filtra por:
  - `workspace_id`
  - `kind`

Nuevo comportamiento recomendado:

- primero eliges workspace
- luego eliges tipo
- luego cuentas y categorias se filtran solo dentro de ese workspace

Backend:

- `saveMovementAction` debe validar:
  - el usuario puede escribir en `workspace_id`
  - `account.workspace_id = workspace_id`
  - `category.workspace_id = workspace_id`
  - `category.kind = movement.kind`
- parte de esta validacion ya queda reforzada por trigger en DB

### Queries y acciones

Archivos:

- [lib/actions.ts](C:/Users/af503/OneDrive/Desktop/Control financiero/lib/actions.ts:1)
- [lib/data/queries.ts](C:/Users/af503/OneDrive/Desktop/Control financiero/lib/data/queries.ts:1)
- [lib/types.ts](C:/Users/af503/OneDrive/Desktop/Control financiero/lib/types.ts:1)

Cambio obligatorio:

- eliminar `OwnerType` como eje de negocio en entidades operativas
- agregar tipos:
  - `Profile`
  - `Workspace`
  - `WorkspaceMember`
- todas las queries deben trabajar con `workspaceIds`
- el balance por cuenta y los agregados del dashboard ya no se calculan por `owner_type`, sino por `workspaces.kind`

## 6. Estrategia para mantener el proyecto simple

Esta es la estrategia recomendada para no sobrearquitectar:

- mantener solo dos tipos de workspace: `personal` y `business`
- permitir un solo business workspace por usuario en esta v1
- no implementar invitaciones todavia
- no implementar permisos finos todavia
- no crear tabla de settings ni preferences por workspace
- usar `searchParams.scope` en vez de estado global
- seguir con server actions
- seguir con paginas server-side
- usar RLS + sesion autenticada en vez de `service_role` para CRUD normal

Reglas practicas para esta primera iteracion:

- si el usuario solo tiene workspace personal, nunca muestres controles de negocio
- si tiene ambos, muestra un switch simple `Personal | Negocio | Ambos`
- el dashboard puede seguir usando un solo agregador central
- no intentes soportar multiples business workspaces en la UI todavia aunque la base futura ya lo permitiria con pocos cambios

## Orden recomendado de implementacion

1. aplicar nuevo esquema o migracion en Supabase
2. cambiar cliente servidor de Supabase para trabajar con sesion
3. implementar login y onboarding
4. introducir resolucion de `scope` y `workspaceIds`
5. refactorizar `lib/data/queries.ts`
6. refactorizar `lib/actions.ts`
7. actualizar `dashboard`, `accounts`, `categories` y `movements`

## Decision final elegida

La opcion elegida para esta base es:

- `workspaces` como unidad de aislamiento
- `personal` y `business` como propiedad del workspace
- `accounts`, `categories` y `movements` asociados a `workspace_id`
- `personal` obligatorio y `business` opcional
- RLS minima con lectura por miembro y escritura por owner

Es la base mas simple que sigue siendo correcta, segura y escalable para compartir un workspace business despues.
