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
SUPABASE_SERVICE_ROLE_KEY=
```

Nota: para este MVP la app usa `SUPABASE_SERVICE_ROLE_KEY` solo del lado servidor para simplificar CRUD sin autenticacion. No expongas esa llave en el navegador. Si luego agregas usuarios, pasa a auth + RLS.

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
