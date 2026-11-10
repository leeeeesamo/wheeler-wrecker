-- Wheeler Wrecker Service — Supabase schema (v3, audited)
-- Run ONCE in the Wheeler project's SQL Editor (Supabase Dashboard → SQL Editor).
-- Safe to re-run: policies are dropped before recreation; tables use IF NOT EXISTS;
-- the seed insert is guarded by WHERE NOT EXISTS.
--
-- Security model:
--   * Public (anon) has ZERO direct table access to reviews/review_events.
--   * All public reads go through the list-reviews Edge Function (service role,
--     whitelisted fields, approved status only).
--   * All writes go through the submit-review Edge Function (service role,
--     status hardcoded 'pending').
--   * Admins authenticate via Supabase Auth; admin status (public.admin_users) is granted ONLY
--     from the dashboard/SQL editor — never editable by users or client code.
--   * Row Level Security enforces admin-only select/update server-side.

-- ---------- Tables ----------

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  author_name text,               -- optional; null = not provided
  rating      smallint not null check (rating between 1 and 5),
  body        text not null
              check (char_length(btrim(body)) between 10 and 2000),
  service_location text,          -- e.g. 'Bessemer', 'Alabaster', 'Other'
  status      text not null default 'pending'
              check (status in ('pending','approved','rejected')),
  source      text not null default 'website',
  created_at  timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid               -- auth.users.id of moderator; never user-editable
);

create index if not exists idx_reviews_status on public.reviews (status);
create index if not exists idx_reviews_created on public.reviews (created_at desc);

-- Audit log for every moderation action (approve / reject / restore)
create table if not exists public.review_events (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  actor_id    uuid,               -- auth.uid() of the admin who acted
  action      text not null check (action in ('submitted','approved','rejected','restored')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_review_events_review on public.review_events (review_id);

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
  applies_to    text not null default 'towing',
  eligible      text not null default 'all',
  expires_at    timestamptz,
  active        boolean not null default false,   -- NEVER activate until Wheeler approves terms
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.redemptions (
  id          uuid primary key default gen_random_uuid(),
  promo_id    uuid references public.promotions(id) on delete set null,
  customer_ref text,
  note        text,
  redeemed_at timestamptz not null default now()
);

-- Admin allowlist. Users CANNOT self-register: this table has RLS enabled
-- with NO policies, so only the service role (SQL editor / edge functions)
-- can read or write it. Users also cannot modify it through the Auth API.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- (RLS enabled below with the other tables)

-- ---------- Helper ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------- Row Level Security ----------
alter table public.reviews       enable row level security;
alter table public.feedback      enable row level security;
alter table public.promotions    enable row level security;
alter table public.redemptions   enable row level security;
alter table public.review_events enable row level security;
alter table public.admin_users    enable row level security;

-- reviews: admins may READ only. Moderation writes go EXCLUSIVELY through
-- the moderate-review Edge Function (service role), which validates the
-- caller's admin status and the allowed status transition server-side.
-- This prevents admins from editing arbitrary columns or forging state.
drop policy if exists "admin read reviews" on public.reviews;
create policy "admin read reviews" on public.reviews
  for select to authenticated using (public.is_admin());

-- review_events: admins may READ history only. Audit rows are written
-- exclusively by the moderate-review Edge Function.
drop policy if exists "admin read review_events" on public.review_events;
create policy "admin read review_events" on public.review_events
  for select to authenticated using (public.is_admin());

-- Atomic moderation: single transaction updates status + writes audit event.
-- Executable ONLY by service_role (edge functions). Validates the allowed
-- status transition inside the database as defense-in-depth.
create or replace function public.moderate_review(
  p_review_id uuid,
  p_new_status text,
  p_actor uuid
) returns void language plpgsql security definer set search_path = '' as $$
declare cur text;
begin
  select status into cur from public.reviews where id = p_review_id for update;
  if cur is null then raise exception 'review not found'; end if;
  if not (
    (cur = 'pending'  and p_new_status in ('approved','rejected')) or
    (cur = 'approved' and p_new_status = 'rejected') or
    (cur = 'rejected' and p_new_status = 'pending')
  ) then raise exception 'invalid transition: % -> %', cur, p_new_status; end if;

  update public.reviews
     set status = p_new_status,
         moderated_at = now(),
         moderated_by = p_actor
   where id = p_review_id;

  insert into public.review_events (review_id, actor_id, action)
  values (p_review_id, p_actor,
          case when p_new_status = 'pending' then 'restored' else p_new_status end);
end $$;
revoke all on function public.moderate_review(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.moderate_review(uuid, text, uuid) to service_role;

-- Function EXECUTE hygiene: is_admin is callable by signed-in admins and the
-- service role only (anon gets EXECUTE revoked — it could never return true
-- anyway, so exposing it adds nothing). moderate_review is service_role only.
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated, service_role;

-- Belt-and-suspenders: strip write privileges from client roles entirely.
-- (RLS already denies them; this also blocks grant-level attempts.)
revoke insert, update, delete on public.reviews       from anon, authenticated;
revoke insert, update, delete on public.review_events from anon, authenticated;
revoke insert, update, delete on public.admin_users  from anon, authenticated;

-- feedback/promotions/redemptions: admin-managed tables (unchanged scope)
drop policy if exists "public insert feedback" on public.feedback;
create policy "public insert feedback" on public.feedback
  for insert to anon, authenticated with check (true);
drop policy if exists "admin all feedback" on public.feedback;
create policy "admin all feedback" on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all promotions" on public.promotions;
create policy "admin all promotions" on public.promotions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all redemptions" on public.redemptions;
create policy "admin all redemptions" on public.redemptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- NOTE: there is deliberately NO public/anon policy on public.reviews.
-- Unauthenticated visitors cannot read ANY review rows directly; approved
-- reviews reach the site only through the list-reviews Edge Function,
-- which returns whitelisted public fields and approved status only.

-- ---------- Seed: inactive placeholder promo ----------
-- Idempotent without a uniqueness constraint: skip the insert when a promo
-- with this exact name already exists, so re-running the script never
-- creates duplicates.
insert into public.promotions (name, discount_type, amount, applies_to, eligible, active)
select 'Customer Appreciation Offer — TERMS TBD', 'percent', 0, 'towing', 'all', false
where not exists (
  select 1 from public.promotions
  where name = 'Customer Appreciation Offer — TERMS TBD'
);
-- NOTE: amount=0 is a placeholder; Wheeler sets real terms in the admin dashboard
-- before ever activating. The promo ships active=false.
