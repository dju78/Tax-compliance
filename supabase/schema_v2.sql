-- ==============================================================================
-- DEAP Schema V2 - Production Grade
-- Strict Multi-Tenancy & Security
-- ==============================================================================

-- 1. Personal Profiles (1:1 with Auth User)
create table if not exists public.personal_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text,
  tin text,
  state_of_residence text,
  nin text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint one_profile_per_user unique (user_id)
);

alter table public.personal_profiles enable row level security;

create policy "Users can CRUD their own profile"
  on public.personal_profiles for all
  using (auth.uid() = user_id);


-- 2. Companies (N:1 with Auth User for MVP)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null, -- Owner
  name text not null,
  tin text,
  rc_number text,
  sector text,
  entity_type text check (entity_type in ('sole_trader', 'ltd', 'partnership')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.companies enable row level security;

create policy "Users can CRUD their own companies"
  on public.companies for all
  using (auth.uid() = user_id);


-- 3. Transactions (Unified Table with Scope Constraint)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  
  -- Scoping (EITHER Company OR Personal)
  company_id uuid references public.companies(id) on delete cascade,
  personal_profile_id uuid references public.personal_profiles(id) on delete cascade,
  
  -- Core Data
  date date not null,
  description text not null,
  amount numeric(20, 2) not null, -- Signed: +Income, -Expense
  
  -- Categorization
  category_name text, -- De-normalized for simplicity
  sub_category text,
  
  -- Tax Attributes
  tax_year_label text, -- "2025"
  tax_tag text check (tax_tag in ('VAT', 'WHT', 'Non-deductible', 'Owner Loan', 'None')),
  dla_status text default 'none' check (dla_status in ('none', 'potential', 'confirmed')),
  excluded_from_tax boolean default false,
  
  -- Meta
  source_type text default 'MANUAL', -- 'BANK_UPLOAD', 'RECEIPT', 'MANUAL'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Strict Constraint: Must belong to exactly one scope
  constraint txn_scope_check check (
    (company_id is not null and personal_profile_id is null) or
    (company_id is null and personal_profile_id is not null)
  )
);

alter table public.transactions enable row level security;

create policy "Users manage transactions via Company ownership"
  on public.transactions for all
  using (
    company_id in (select id from public.companies where user_id = auth.uid())
    or
    personal_profile_id in (select id from public.personal_profiles where user_id = auth.uid())
  );


-- 4. Filing Readiness / Status
create table if not exists public.filing_status (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade, 
  personal_profile_id uuid references public.personal_profiles(id) on delete cascade,
  tax_year_label text not null,
  
  status text check (status in ('RED', 'AMBER', 'GREEN')) default 'RED',
  checklist_data jsonb default '{}', -- Stores the boolean checks
  
  updated_at timestamptz default now(),
  
  constraint filing_scope_check check (
    (company_id is not null and personal_profile_id is null) or
    (company_id is null and personal_profile_id is not null)
  ),
  unique(company_id, tax_year_label),
  unique(personal_profile_id, tax_year_label)
);

alter table public.filing_status enable row level security;

create policy "Users manage filing status via ownership"
  on public.filing_status for all
  using (
    company_id in (select id from public.companies where user_id = auth.uid())
    or
    personal_profile_id in (select id from public.personal_profiles where user_id = auth.uid())
  );
