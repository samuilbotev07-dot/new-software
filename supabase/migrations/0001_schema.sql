-- Бизнес Контролна Система — схема, RLS, тригер при регистрация

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  business_name text,
  business_type text,
  city text,
  owner_name text,
  employees int default 1,
  tax_regime text,
  vat_registered boolean default false,
  business_start_date date,
  default_working_days int default 22,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

create table public.settings (
  user_id uuid primary key references auth.users on delete cascade,
  target_profit numeric not null default 0,
  min_margin numeric not null default 0.30,
  min_cash_buffer numeric not null default 0,
  target_clients int not null default 0,
  revenue_categories jsonb not null default '[]',
  expense_categories jsonb not null default '[]',
  goals_12m text,
  biggest_problem text,
  top3_priorities text,
  updated_at timestamptz default now()
);

create table public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kind text not null default 'Услуга',
  default_price numeric not null default 0,
  default_cost numeric not null default 0,
  duration_minutes int,
  active boolean default true,
  sort_order int default 0
);

create table public.months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  working_days int,
  clients int default 0,
  transactions int default 0,
  cash_start numeric default 0,
  cash_end numeric default 0,
  revenue jsonb default '{}',
  expenses jsonb default '{}',
  taxes jsonb default '{}',
  cashflow jsonb default '{}',
  products jsonb default '[]',
  self_analysis jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, year, month)
);

create index months_user_period_idx on public.months (user_id, year desc, month desc);
create index product_catalog_user_idx on public.product_catalog (user_id, sort_order);

-- RLS: потребителят вижда и пипа само своите редове
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.product_catalog enable row level security;
alter table public.months enable row level security;

create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete" on public.profiles for delete using (auth.uid() = id);

create policy "settings_select" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update" on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_delete" on public.settings for delete using (auth.uid() = user_id);

create policy "product_catalog_select" on public.product_catalog for select using (auth.uid() = user_id);
create policy "product_catalog_insert" on public.product_catalog for insert with check (auth.uid() = user_id);
create policy "product_catalog_update" on public.product_catalog for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "product_catalog_delete" on public.product_catalog for delete using (auth.uid() = user_id);

create policy "months_select" on public.months for select using (auth.uid() = user_id);
create policy "months_insert" on public.months for insert with check (auth.uid() = user_id);
create policy "months_update" on public.months for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "months_delete" on public.months for delete using (auth.uid() = user_id);

-- При регистрация: профил + настройки със стандартните категории.
-- Стандартните категории имат фиксирани id-та — предупрежденията за наем/заплати
-- и историческите данни не зависят от името на категорията.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.settings (user_id, revenue_categories, expense_categories) values (
    new.id,
    '[
      {"id":"services","name":"Услуги","active":true,"order":0},
      {"id":"products","name":"Продукти","active":true,"order":1},
      {"id":"subscriptions","name":"Абонаменти","active":true,"order":2},
      {"id":"other_income","name":"Други приходи","active":true,"order":3}
    ]'::jsonb,
    '[
      {"id":"rent","name":"Наем","active":true,"order":0},
      {"id":"salaries","name":"Заплати","active":true,"order":1},
      {"id":"staff_insurance","name":"Осигуровки на персонал","active":true,"order":2},
      {"id":"materials","name":"Материали","active":true,"order":3},
      {"id":"consumables","name":"Консумативи","active":true,"order":4},
      {"id":"electricity","name":"Ток","active":true,"order":5},
      {"id":"water","name":"Вода","active":true,"order":6},
      {"id":"heating","name":"Отопление/Газ","active":true,"order":7},
      {"id":"transport","name":"Транспорт/Гориво","active":true,"order":8},
      {"id":"marketing","name":"Реклама и маркетинг","active":true,"order":9},
      {"id":"accounting","name":"Счетоводство","active":true,"order":10},
      {"id":"software","name":"Софтуери/Абонаменти","active":true,"order":11},
      {"id":"repairs","name":"Ремонти и поддръжка","active":true,"order":12},
      {"id":"commissions","name":"Комисиони","active":true,"order":13},
      {"id":"bank_fees","name":"Банкови такси","active":true,"order":14},
      {"id":"other_expense","name":"Други разходи","active":true,"order":15}
    ]'::jsonb
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
