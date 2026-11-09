-- Wheeler Wrecker Service — Supabase schema
-- Run in Supabase SQL Editor after project creation.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

-- ---------- Tables ----------

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating      smallint check (rating between 1 and 5),
  body        text not null,
  service_location text,           -- e.g. 'Bessemer', 'Alabaster', 'Other'
  status      text not null default 'pending'
              check (status in ('pending','approved','rejected')),
  source      text not null default 'website',
  created_at  timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid
);

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  contact     text,
  message     text not null,
  kind        text not null default 'general'
              check (kind in ('general','question','complaint','compliment','discount-inquiry')),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create table if not exists public.promotions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  amount        numeric(10,2) not null default 0 check (amount >= 0),
  applies_to    text not null default 'towing',   -- 'towing','recovery','all' — editable by admin
  eligible      text not null default 'all',      -- eligibility label, admin-defined
  expires_at    timestamptz,
  active        boolean not null default false,   -- NEVER activate until Wheeler approves terms
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.redemptions (
  id          uuid primary key default gen_random_uuid(),
  promo_id    uuid references public.promotions(id) on delete set null,
  customer_ref text,                -- phone last-4 or name — no PII required
  note        text,
  redeemed_at timestamptz not null default now()
);

-- Admin flag on auth users
alter table auth.users add column if not exists is_admin boolean not null default false;

-- ---------- Helper ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from auth.users where id = auth.uid()), false);
$$;

-- ---------- Row Level Security ----------
alter table public.reviews      enable row level security;
alter table public.feedback     enable row level security;
alter table public.promotions   enable row level security;
alter table public.redemptions  enable row level security;

-- Public: submit feedback only (via edge function with its own checks)
create policy "public insert feedback" on public.feedback
  for insert to anon, authenticated with check (true);

-- Admins: full access to everything
create policy "admin all reviews" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all feedback" on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all promotions" on public.promotions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all redemptions" on public.redemptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public read: ONLY approved reviews (for future /reviews/ showcase)
create policy "public read approved reviews" on public.reviews
  for select to anon, authenticated using (status = 'approved');

-- No public access to promotions/redemptions/feedback reads.

-- ---------- Seed: inactive placeholder promo ----------
insert into public.promotions (name, discount_type, amount, applies_to, eligible, active)
values ('Customer Appreciation Offer — TERMS TBD', 'percent', 0, 'towing', 'all', false);
-- NOTE: amount=0 is a placeholder; Wheeler sets real terms in the admin dashboard
-- before ever activating. The promo ships active=false.
