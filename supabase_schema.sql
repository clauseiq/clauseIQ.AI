-- ═══════════════════════════════════════════════════════════
-- Clause IQ — Production-Ready Supabase Schema
-- Run this in your Supabase project's SQL Editor.
-- ═══════════════════════════════════════════════════════════

-- ─── Enable UUID extension ──────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES TABLE ──────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        unique not null,
  name          text        default '',
  plan          text        not null default 'Free' check (plan in ('Free', 'Pro', 'Business')),
  analyses_used integer     not null default 0,
  plan_updated_at timestamptz,
  topup_credits integer     not null default 0, -- Additional purchased credits
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── ANALYSES TABLE ─────────────────────────────────────────
create table if not exists public.analyses (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  contract_name text        not null default 'Untitled Contract',
  risk_score    integer     check (risk_score >= 0 and risk_score <= 100),
  verdict       text,
  summary_text  text,
  full_json     jsonb,      -- Full AI output stored securely
  created_at    timestamptz not null default now()
);

-- ─── PAYMENT LOGS TABLE ──────────────────────────────────────
-- Serves as the idempotency fence for payment verification.
-- One row per Razorpay order_id — duplicate order_id = replay attack blocked.
create table if not exists public.payment_logs (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  order_id      text        unique not null, -- Razorpay order_id — UNIQUE for idempotency
  payment_id    text        not null,
  amount        integer     not null,        -- In minor units (paise / cents)
  currency      text        not null default 'INR',
  plan_type     text        not null check (plan_type in ('pro_monthly', 'topup_5')),
  status        text        not null default 'captured',
  created_at    timestamptz not null default now()
);

-- ─── SECURITY AUDIT LOG ──────────────────────────────────────
-- Immutable audit trail for security events.
create table if not exists public.security_events (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        references public.profiles(id) on delete set null,
  event_type    text        not null,  -- e.g., 'rate_limit_exceeded', 'signature_mismatch'
  metadata      jsonb       default '{}',
  ip_address    text,
  created_at    timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.analyses       enable row level security;
alter table public.payment_logs   enable row level security;
alter table public.security_events enable row level security;

-- Profiles: users can only read/update their own
drop policy if exists "profiles_select_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Analyses: users can only access their own — prevents IDOR
drop policy if exists "analyses_select_own"  on public.analyses;
drop policy if exists "analyses_insert_own"  on public.analyses;

create policy "analyses_select_own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "analyses_insert_own"
  on public.analyses for insert
  with check (auth.uid() = user_id);

-- Payment logs: user can read their own; insert via service role only
drop policy if exists "payment_logs_select_own"  on public.payment_logs;
drop policy if exists "payment_logs_insert_service" on public.payment_logs;

create policy "payment_logs_select_own"
  on public.payment_logs for select
  using (auth.uid() = user_id);

-- Security events: no direct user access; written by service role
-- (no policies = administrators/service role only)

-- ─── HELPER FUNCTIONS ────────────────────────────────────────

-- increment_analyses: atomically increments analyses_used
-- Called immediately BEFORE streaming to prevent free analysis
create or replace function public.increment_analyses(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    analyses_used = analyses_used + 1,
    updated_at = now()
  where id = user_id;
end;
$$;

-- add_analysis_credits: adds N topup credits by decrementing analyses_used
-- Capped at 0 to prevent negative counter creating infinite access
create or replace function public.add_analysis_credits(target_user_id uuid, credits integer)
returns void
language plpgsql
security definer
as $$
begin
  -- Validate credits value to prevent abuse via direct RPC call
  if credits < 1 or credits > 100 then
    raise exception 'Invalid credits value: %', credits;
  end if;

  update public.profiles
  set
    analyses_used = greatest(0, analyses_used - credits),
    updated_at = now()
  where id = target_user_id;
end;
$$;

-- ─── TRIGGERS ────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, plan, analyses_used)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'Free',
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at auto-update trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── INDEXES ─────────────────────────────────────────────────

create index if not exists idx_analyses_user_id     on public.analyses(user_id);
create index if not exists idx_analyses_created_at  on public.analyses(created_at desc);
create index if not exists idx_payment_logs_user_id on public.payment_logs(user_id);
create index if not exists idx_payment_logs_order   on public.payment_logs(order_id); -- For idempotency check

-- ─── VERIFICATION QUERY ──────────────────────────────────────
-- Run this to verify the schema was applied:
-- select table_name, row_security from information_schema.tables
-- where table_schema = 'public' order by table_name;
