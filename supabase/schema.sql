-- 1. Tax Years Table
create table if not exists public.tax_years (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  label text not null, -- "2025"
  start_date date not null,
  end_date date not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, label),
  check (start_date <= end_date)
);

create index if not exists tax_years_company_dates_idx
on public.tax_years (company_id, start_date, end_date);

-- 2. Ensure Calendar Years Function
create or replace function public.ensure_calendar_tax_years(
  p_company_id uuid,
  p_start_year int,
  p_end_year int
) returns void
language plpgsql
as $$
declare
  y int;
begin
  if p_end_year < p_start_year then
    raise exception 'end_year must be >= start_year';
  end if;

  for y in p_start_year..p_end_year loop
    insert into public.tax_years (company_id, label, start_date, end_date, is_default)
    values (
      p_company_id,
      y::text,
      make_date(y, 1, 1),
      make_date(y, 12, 31),
      case when y = p_end_year then true else false end
    )
    on conflict (company_id, label) do nothing;
  end loop;

  -- keep only ONE default per company (latest year in range)
  update public.tax_years
  set is_default = false
  where company_id = p_company_id
    and label <> p_end_year::text;

  update public.tax_years
  set is_default = true
  where company_id = p_company_id
    and label = p_end_year::text;
end;
$$;

-- 3. Map Transaction to Tax Year (View)
create or replace view public.v_transactions_with_tax_year as
select
  t.*,
  ty.id as tax_year_id,
  ty.label as tax_year_label
from public.transactions t
left join public.tax_years ty
  on ty.company_id = t.company_id
 and t.txn_date between ty.start_date and ty.end_date;

-- 4. Tax Year Summary (Income, Expenses, Net)
create or replace view public.v_tax_year_summary as
select
  company_id,
  tax_year_id,
  tax_year_label,
  sum(case when amount > 0 then amount else 0 end) as total_income,
  sum(case when amount < 0 then abs(amount) else 0 end) as total_expenses,
  sum(amount) as net_cashflow
from public.v_transactions_with_tax_year
group by company_id, tax_year_id, tax_year_label;

-- 5. Category Breakdown by Tax Year
create or replace view public.v_tax_year_category_summary as
select
  company_id,
  tax_year_id,
  tax_year_label,
  category_code, -- Assuming category_id or code exists on transaction
  sum(case when amount > 0 then amount else 0 end) as income,
  sum(case when amount < 0 then abs(amount) else 0 end) as expenses,
  sum(amount) as net
from public.v_transactions_with_tax_year
group by company_id, tax_year_id, tax_year_label, category_code;

-- 6. Unassigned Transactions
create or replace view public.v_unassigned_transactions as
select *
from public.v_transactions_with_tax_year
where tax_year_id is null;

-- 7. P&L Views (from previous request)
-- A) Category totals
create or replace view public.v_pl_category_totals as
select
  t.company_id,
  c.type as category_type,
  c.name as category_name,
  date_trunc('month', t.txn_date)::date as month,
  sum(t.amount) as signed_total
from public.transactions t
join public.categories c on c.id = t.category_id
where coalesce(t.is_business, true) = true
group by 1,2,3,4;

-- B) P&L totals by month
create or replace view public.v_pl_monthly as
select
  company_id,
  month,
  sum(case when category_type in ('income','other_income') then signed_total else 0 end) as income,
  abs(sum(case when category_type = 'expense' then signed_total else 0 end)) as expenses,
  abs(sum(case when category_type = 'cogs' then signed_total else 0 end)) as cogs,
  (
    sum(case when category_type in ('income','other_income') then signed_total else 0 end)
    - abs(sum(case when category_type = 'expense' then signed_total else 0 end))
    - abs(sum(case when category_type = 'cogs' then signed_total else 0 end))
  ) as net_profit
from public.v_pl_category_totals
group by 1,2;

-- C) Uncategorised transactions counter
create or replace view public.v_pl_uncategorised as
select
  company_id,
  count(*) as uncategorised_count,
  sum(abs(amount)) as uncategorised_value
from public.transactions
where category_id is null
  and coalesce(is_business, true) = true
group by 1;
