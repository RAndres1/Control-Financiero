# Iteration Handoff: Onboarding, UX y Insights

Fecha: 2026-04-14

## Objetivo de esta iteracion

Se trabajo sobre feedback real de usuarios:

- la app se siente compleja al inicio
- no queda claro por donde empezar
- ingresar datos toma tiempo
- los usuarios esperan recomendaciones mas claras, no solo datos

La meta fue mejorar eso sin sobrearquitectura, sin integraciones externas y sin IA compleja.

## Resultado general

Se implementaron 3 mejoras principales:

1. onboarding minimo para entender al usuario al entrar por primera vez
2. simplificacion del flujo de registro de movimientos
3. insights mas claros y mas accionables

La app sigue compilando correctamente despues de estos cambios.

Build verificado:

```bash
npm run build
```

## Cambio 1: onboarding minimo

### UX definida

Se agrego una pantalla unica en `/onboarding` con estas preguntas:

- que productos financieros usa hoy:
  - cuentas
  - tarjetas
  - creditos
- ingreso mensual aproximado
- gasto mensual aproximado
- opcion simple para crear tambien el workspace de negocio

La intencion fue que el onboarding se complete en menos de 2 minutos.

### Flujo actual

- si el usuario no ha iniciado sesion, sigue yendo a `/login`
- si el usuario inicio sesion pero no tiene `profiles.onboarding_completed = true`, se redirige a `/onboarding`
- si ya completo onboarding, no puede volver a `/onboarding` por navegacion normal

### Persistencia

Ahora `profiles` guarda tambien:

- `financial_products`
- `monthly_income_estimate`
- `monthly_expense_estimate`

La accion `saveOnboardingAction`:

- llama primero `complete_onboarding(...)`
- crea workspace business si el usuario lo marco
- luego actualiza `profiles` con los datos del onboarding

## Cambio 2: simplificacion del formulario de movimientos

### Problema que se quiso resolver

Registrar movimientos tenia demasiada friccion para una accion que el usuario deberia repetir muchas veces.

### Cambios hechos

- la fecha ahora por defecto es hoy
- cuenta y categoria se preseleccionan automaticamente cuando hay una opcion valida
- la descripcion es opcional de verdad
- si el usuario no escribe descripcion, se genera una automaticamente:
  - `Gasto en {categoria}`
  - `Ingreso por {categoria}`
- se agrego copy de apoyo para aclarar que descripcion y notas no son obligatorias

### Efecto esperado

- menos campos vacios
- menos decisiones por cada movimiento
- menor tiempo de registro

## Cambio 3: insights mas accionables

### Problema que se quiso resolver

Los insights anteriores describian el estado, pero no siempre ayudaban al usuario a decidir que hacer.

### Nuevo enfoque

Los insights ahora intentan responder:

- que deberias revisar primero
- donde esta la mayor oportunidad de ajuste
- cual es el siguiente paso simple

### Reglas nuevas o ajustadas

- si no hay movimientos:
  - sugerir empezar registrando 3 movimientos de la semana
- si no hay cuentas:
  - sugerir crear la cuenta principal o tarjeta principal
- si los gastos subieron vs el mes anterior:
  - sugerir revisar categorias variables
- si la mayor fuga esta en una categoria:
  - decir explicitamente que empezar por esa categoria
- si negocio va por debajo:
  - sugerir frenar gastos no esenciales o empujar una venta
- si el mes va en negativo:
  - sugerir recortar primero un gasto variable
- si el gasto ya supero el gasto esperado del onboarding:
  - avisar que ya se paso del objetivo mensual
- si el ingreso registrado va bajo para este punto del mes:
  - sugerir revisar si faltan ingresos por cargar
- si el usuario marco que tiene credito:
  - sugerir separar la cuota como gasto fijo

### Criterio importante

No se uso IA ni analitica compleja. Todo sigue siendo reglas simples, legibles y faciles de mantener.

## Archivos creados

- `app/onboarding/page.tsx`
- `supabase/migrations/20260414_onboarding_profile_fields.sql`

## Archivos modificados

- `app/layout.tsx`
- `app/movements/page.tsx`
- `components/movement-category-field.tsx`
- `lib/actions.ts`
- `lib/data/queries.ts`
- `lib/supabase/database.types.ts`
- `lib/types.ts`
- `middleware.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260414_multitenant_workspaces.sql`

## Resumen tecnico por archivo

### `app/onboarding/page.tsx`

Nueva pantalla de onboarding con formulario simple.

### `lib/actions.ts`

Se agrego:

- `saveOnboardingAction`

Tambien se ajusto:

- `saveMovementAction`

Ahora genera una descripcion automatica si el usuario no escribe una.

### `middleware.ts`

Ahora valida:

- usuario sin sesion -> `/login`
- usuario con sesion pero sin onboarding -> `/onboarding`
- usuario con onboarding completo intentando entrar a `/onboarding` -> `/`

Ademas inyecta `x-pathname` para que el layout sepa si esta renderizando onboarding.

### `app/layout.tsx`

Si el path actual es `/onboarding`, no monta `LayoutShell`.

Motivo:

- evitar header, navegacion y controles de workspace durante el onboarding
- mantener la experiencia enfocada

### `app/movements/page.tsx`

Se mejoro la experiencia del formulario:

- fecha default en hoy
- texto mas claro en descripcion
- ayudas visuales para indicar que campos son opcionales

### `components/movement-category-field.tsx`

Ahora:

- preselecciona cuenta si solo hay una valida
- preselecciona categoria valida segun workspace y tipo
- limpia selecciones invalidas cuando cambia el contexto

### `lib/data/queries.ts`

Se agrego:

- `getCurrentProfile()`

Se reescribio `buildInsights(...)` para usar:

- movimientos del mes actual
- movimientos del mes anterior
- `profile`
- cuentas existentes

Los insights ahora usan tambien el baseline del onboarding.

### `lib/types.ts`

Se agrego el tipo:

- `FinancialProduct`

Y se extendio `Profile` con:

- `financial_products`
- `monthly_income_estimate`
- `monthly_expense_estimate`

### `lib/supabase/database.types.ts`

Se sincronizo manualmente con los nuevos campos del perfil.

### `supabase/schema.sql`

Se agregaron las nuevas columnas a `profiles` para instalaciones nuevas.

### `supabase/migrations/20260414_multitenant_workspaces.sql`

Tambien se actualizo la definicion de `profiles` para reflejar los nuevos campos en el esquema completo.

### `supabase/migrations/20260414_onboarding_profile_fields.sql`

Nueva migracion incremental para bases ya existentes.

Hace:

- `add column if not exists financial_products`
- `add column if not exists monthly_income_estimate`
- `add column if not exists monthly_expense_estimate`
- agrega constraint de validacion para `financial_products`

## Importante para retomar despues

### Paso obligatorio pendiente fuera del repo

Hay que aplicar en Supabase la migracion nueva:

- `supabase/migrations/20260414_onboarding_profile_fields.sql`

Sin eso:

- el codigo compila
- pero el onboarding no podra persistir los nuevos campos del perfil correctamente en la base real

### Estado de compilacion

La app compila despues de los cambios.

### Estado git al terminar esta iteracion

Habia un cambio previo del usuario en:

- `PROJECT_HANDOFF.md`

Ese archivo no se toco.

## Siguiente paso recomendado

Lo mas util al volver seria:

1. aplicar la migracion nueva en Supabase
2. probar flujo real:
   - signup
   - redirect a onboarding
   - guardar onboarding
   - entrar al dashboard
   - crear primer movimiento mas rapido
3. validar si los insights nuevos se sienten realmente utiles con datos reales
4. si hace falta, ajustar copy y defaults, no arquitectura

## Decision de producto que conviene mantener

Seguir con estas reglas:

- onboarding corto
- movimientos con el menor numero de decisiones posible
- insights con lenguaje humano y una accion concreta
- nada de integraciones ni motores complejos por ahora

Eso esta alineado con el feedback real recibido.
