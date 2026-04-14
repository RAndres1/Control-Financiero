create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_type text not null check (owner_type in ('personal', 'business')),
  account_type text not null check (account_type in ('cash', 'bank', 'wallet', 'credit_card', 'savings')),
  currency text not null default 'COP',
  initial_balance numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_type text not null check (owner_type in ('personal', 'business')),
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  owner_type text not null check (owner_type in ('personal', 'business')),
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_accounts_owner_type on public.accounts(owner_type);
create index if not exists idx_categories_owner_type_kind on public.categories(owner_type, kind);
create unique index if not exists idx_categories_unique_name_scope on public.categories(lower(name), owner_type, kind);
create index if not exists idx_movements_date on public.movements(movement_date desc);
create index if not exists idx_movements_owner_type on public.movements(owner_type);
create index if not exists idx_movements_account_id on public.movements(account_id);
create index if not exists idx_movements_category_id on public.movements(category_id);

insert into public.categories (name, owner_type, kind)
values
  ('Salario', 'personal', 'income'),
  ('Comida', 'personal', 'expense'),
  ('Transporte', 'personal', 'expense'),
  ('Ventas', 'business', 'income'),
  ('Publicidad', 'business', 'expense'),
  ('Herramientas', 'business', 'expense')
on conflict do nothing;
