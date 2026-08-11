-- Бизнес Контролна Система — схема за Neon/Postgres.
-- Auth таблиците са стандартната схема на Better Auth (camelCase, в кавички).
-- Достъпът до данните е само от сървъра (DATABASE_URL) — изолацията между
-- потребители се налага в заявките по session user id.

create table if not exists "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create table if not exists "session" (
  "id" text primary key,
  "expiresAt" timestamp not null,
  "token" text not null unique,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);
create index if not exists session_userid_idx on "session" ("userId");

create table if not exists "account" (
  "id" text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);
create index if not exists account_userid_idx on "account" ("userId");

create table if not exists "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp default now(),
  "updatedAt" timestamp default now()
);
create index if not exists verification_identifier_idx on "verification" ("identifier");

-- Данните на приложението

create table if not exists profiles (
  id text primary key references "user" ("id") on delete cascade,
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

create table if not exists settings (
  user_id text primary key references "user" ("id") on delete cascade,
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

create table if not exists product_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  name text not null,
  kind text not null default 'Услуга',
  default_price numeric not null default 0,
  default_cost numeric not null default 0,
  duration_minutes int,
  active boolean default true,
  sort_order int default 0
);
create index if not exists product_catalog_user_idx on product_catalog (user_id, sort_order);

create table if not exists months (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
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
create index if not exists months_user_period_idx on months (user_id, year desc, month desc);
