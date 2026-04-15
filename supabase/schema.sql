create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  onboarding_mode text check (onboarding_mode in ('personal_only', 'personal_and_business')),
  onboarding_completed boolean not null default false,
  financial_products text[] not null default '{}' check (
    financial_products <@ array['bank_account', 'credit_card', 'loan']::text[]
  ),
  monthly_income_estimate numeric(12,2),
  monthly_expense_estimate numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('personal', 'business')),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')) default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('cash', 'bank', 'wallet', 'credit_card', 'savings')),
  currency text not null default 'COP',
  initial_balance numeric(12,2) not null default 0 check (initial_balance >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  movement_date date not null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_workspaces_owner_kind on public.workspaces(owner_user_id, kind);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_accounts_workspace_id on public.accounts(workspace_id);
create unique index if not exists idx_accounts_unique_name_per_workspace on public.accounts(workspace_id, lower(name));
create index if not exists idx_categories_workspace_kind on public.categories(workspace_id, kind);
create unique index if not exists idx_categories_unique_name_scope on public.categories(workspace_id, lower(name), kind);
create index if not exists idx_movements_workspace_date on public.movements(workspace_id, movement_date desc);
create index if not exists idx_movements_account_id on public.movements(account_id);
create index if not exists idx_movements_category_id on public.movements(category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

create or replace function public.seed_default_categories_for_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_kind text;
begin
  select kind
  into workspace_kind
  from public.workspaces
  where id = target_workspace_id;

  if workspace_kind is null then
    raise exception 'Workspace % no existe.', target_workspace_id;
  end if;

  if workspace_kind = 'personal' then
    insert into public.categories (workspace_id, name, kind)
    values
      (target_workspace_id, 'Salario', 'income'),
      (target_workspace_id, 'Otros ingresos', 'income'),
      (target_workspace_id, 'Comida', 'expense'),
      (target_workspace_id, 'Transporte', 'expense'),
      (target_workspace_id, 'Servicios', 'expense'),
      (target_workspace_id, 'Entretenimiento', 'expense')
    on conflict do nothing;
  else
    insert into public.categories (workspace_id, name, kind)
    values
      (target_workspace_id, 'Ventas', 'income'),
      (target_workspace_id, 'Otros ingresos', 'income'),
      (target_workspace_id, 'Publicidad', 'expense'),
      (target_workspace_id, 'Herramientas', 'expense'),
      (target_workspace_id, 'Nomina', 'expense'),
      (target_workspace_id, 'Operaciones', 'expense')
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.ensure_personal_workspace_for_user(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace_id uuid;
begin
  select id
  into existing_workspace_id
  from public.workspaces
  where owner_user_id = target_user_id
    and kind = 'personal'
  limit 1;

  if existing_workspace_id is null then
    insert into public.workspaces (name, kind, owner_user_id)
    values ('Personal', 'personal', target_user_id)
    returning id into existing_workspace_id;

    perform public.seed_default_categories_for_workspace(existing_workspace_id);
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (existing_workspace_id, target_user_id, 'owner')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role;

  return existing_workspace_id;
end;
$$;

create or replace function public.ensure_business_workspace_for_user(
  target_user_id uuid,
  workspace_name text default 'Negocio'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace_id uuid;
begin
  select id
  into existing_workspace_id
  from public.workspaces
  where owner_user_id = target_user_id
    and kind = 'business'
  limit 1;

  if existing_workspace_id is null then
    insert into public.workspaces (name, kind, owner_user_id)
    values (coalesce(nullif(trim(workspace_name), ''), 'Negocio'), 'business', target_user_id)
    returning id into existing_workspace_id;

    perform public.seed_default_categories_for_workspace(existing_workspace_id);
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (existing_workspace_id, target_user_id, 'owner')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role;

  return existing_workspace_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
  set email = excluded.email;

  perform public.ensure_personal_workspace_for_user(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.complete_onboarding(
  selected_mode text,
  business_workspace_name text default 'Negocio'
)
returns table (
  personal_workspace_id uuid,
  business_workspace_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Usuario no autenticado.';
  end if;

  if selected_mode not in ('personal_only', 'personal_and_business') then
    raise exception 'Modo de onboarding no valido.';
  end if;

  personal_workspace_id := public.ensure_personal_workspace_for_user(current_user_id);

  if selected_mode = 'personal_and_business' then
    business_workspace_id := public.ensure_business_workspace_for_user(current_user_id, business_workspace_name);
  else
    business_workspace_id := null;
  end if;

  update public.profiles
  set
    onboarding_mode = selected_mode,
    onboarding_completed = true
  where id = current_user_id;

  return next;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.validate_movement_workspace_consistency()
returns trigger
language plpgsql
as $$
declare
  account_workspace_id uuid;
  category_workspace_id uuid;
  category_kind text;
begin
  select workspace_id
  into account_workspace_id
  from public.accounts
  where id = new.account_id;

  if account_workspace_id is null then
    raise exception 'La cuenta seleccionada no existe.';
  end if;

  select workspace_id, kind
  into category_workspace_id, category_kind
  from public.categories
  where id = new.category_id;

  if category_workspace_id is null then
    raise exception 'La categoria seleccionada no existe.';
  end if;

  if new.workspace_id <> account_workspace_id then
    raise exception 'La cuenta no pertenece al workspace del movimiento.';
  end if;

  if new.workspace_id <> category_workspace_id then
    raise exception 'La categoria no pertenece al workspace del movimiento.';
  end if;

  if new.kind <> category_kind then
    raise exception 'La categoria no coincide con el tipo del movimiento.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_movement_workspace_consistency on public.movements;
create trigger validate_movement_workspace_consistency
before insert or update on public.movements
for each row
execute function public.validate_movement_workspace_consistency();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.movements enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.movements to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id) or user_id = auth.uid());

drop policy if exists "accounts_select_member" on public.accounts;
create policy "accounts_select_member"
on public.accounts
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "accounts_insert_owner" on public.accounts;
create policy "accounts_insert_owner"
on public.accounts
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "accounts_update_owner" on public.accounts;
create policy "accounts_update_owner"
on public.accounts
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "accounts_delete_owner" on public.accounts;
create policy "accounts_delete_owner"
on public.accounts
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

drop policy if exists "categories_select_member" on public.categories;
create policy "categories_select_member"
on public.categories
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "categories_insert_owner" on public.categories;
create policy "categories_insert_owner"
on public.categories
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "categories_update_owner" on public.categories;
create policy "categories_update_owner"
on public.categories
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "categories_delete_owner" on public.categories;
create policy "categories_delete_owner"
on public.categories
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

drop policy if exists "movements_select_member" on public.movements;
create policy "movements_select_member"
on public.movements
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "movements_insert_owner" on public.movements;
create policy "movements_insert_owner"
on public.movements
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "movements_update_owner" on public.movements;
create policy "movements_update_owner"
on public.movements
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "movements_delete_owner" on public.movements;
create policy "movements_delete_owner"
on public.movements
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

grant execute on function public.complete_onboarding(text, text) to authenticated;
