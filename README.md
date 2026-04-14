# Control Financiero

MVP de finanzas personales y de emprendimiento construido con Next.js, TypeScript, Tailwind y Supabase.

## Alcance del MVP

- CRUD de cuentas
- CRUD de categorias
- CRUD de movimientos
- Dashboard con resumen del mes
- Separacion personal vs negocio
- Insights simples basados en reglas

## Variables de entorno

1. Copia `.env.example` a `.env.local`
2. Completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

La app usa sesion autenticada de Supabase y RLS para el acceso normal a datos. `service_role` ya no forma parte del flujo normal de la app.

## Base de datos

1. Crea un proyecto en Supabase
2. Abre el SQL Editor
3. Ejecuta `supabase/schema.sql`

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.
