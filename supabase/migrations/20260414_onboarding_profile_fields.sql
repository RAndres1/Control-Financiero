alter table public.profiles
  add column if not exists financial_products text[] not null default '{}',
  add column if not exists monthly_income_estimate numeric(12,2),
  add column if not exists monthly_expense_estimate numeric(12,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_financial_products_valid'
  ) then
    alter table public.profiles
      add constraint profiles_financial_products_valid
      check (
        financial_products <@ array['bank_account', 'credit_card', 'loan']::text[]
      );
  end if;
end;
$$;
