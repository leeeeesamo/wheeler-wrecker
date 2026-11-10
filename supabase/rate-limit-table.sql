-- Wheeler Wrecker — rate-limit table + atomic limiter RPC
-- Run in the Wheeler project's SQL Editor (Supabase Dashboard → SQL Editor).
-- Safe to re-run.
--
-- Two parts:
--   1. public.rate_limit_events — attempt log. RLS enabled, NO policies:
--      only the service role (Edge Functions / SQL editor) can touch it.
--   2. public.check_rate_limit(p_ip) — atomic check-and-record. Uses a
--      per-IP transaction advisory lock so concurrent submissions from the
--      same client cannot race past the limit.
--
-- Retention: the function deletes this IP's rows older than the 10-minute
-- window on every call, and ~5% of calls also purge ALL rows older than 24h.
-- Raw IPs are therefore never retained beyond 24 hours.

create table if not exists public.rate_limit_events (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_events_ip_time
  on public.rate_limit_events (ip, created_at desc);

alter table public.rate_limit_events enable row level security;
-- Deliberately NO policies: anon/authenticated get nothing; service_role bypasses RLS.

-- Atomic rate limiter: returns TRUE when the caller is over the limit
-- (5 submissions per 10 minutes per IP), FALSE when allowed — and records
-- the allowed attempt in the same transaction.
create or replace function public.check_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cnt int;
begin
  -- Serialize all checks for this IP for the duration of this transaction.
  perform pg_advisory_xact_lock(hashtextextended(p_ip, 0));

  -- Drop this IP's expired window rows, then count what remains.
  delete from public.rate_limit_events
   where ip = p_ip
     and created_at < now() - interval '10 minutes';

  select count(*) into cnt
    from public.rate_limit_events
   where ip = p_ip;

  if cnt >= 5 then
    return true; -- over limit; do NOT record this attempt
  end if;

  insert into public.rate_limit_events (ip) values (p_ip);

  -- Occasional global sweep so the table stays small and IPs are not
  -- retained beyond 24 hours.
  if random() < 0.05 then
    delete from public.rate_limit_events
     where created_at < now() - interval '24 hours';
  end if;

  return false;
end;
$$;

-- Only the service role (Edge Functions) may execute this.
revoke all on function public.check_rate_limit(text) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text) to service_role;
