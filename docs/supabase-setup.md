# Supabase Backend — Exact Setup Requirements & Costs

**Status: awaiting your approval. No accounts have been created.**

## What Supabase gives us

- **Postgres database** — reviews, private feedback, promotions, redemptions.
- **Authentication** — email/password login for Wheeler admin staff (Supabase Auth).
- **Row-Level Security (RLS)** — public can insert feedback; only admins can read/manage.
- **Edge Functions** — public form endpoints with spam protection.
- **Dashboard** — Wheeler staff manage everything through our `admin/` UI, no code edits.

## Costs (as of setup)

| Item | Cost |
|---|---|
| Supabase Free tier | **$0/month** — 500 MB database, 50k monthly active users, 500k Edge Function invocations. Far more than this site needs. |
| Custom domain on Supabase | Not needed — site stays on wheelertowing.com; Supabase is API-only. |
| Domain `wheelertowing.com` | Already purchased by client. |
| Email `info@wheelertowing.com` | Separate mailbox setup (Google Workspace ~$6/user/mo or cheaper host) — unrelated to Supabase. |
| **Estimated total at launch** | **$0–6/month** depending on email hosting choice. |

Upgrade to Pro ($25/mo) only if usage ever exceeds free limits — unlikely for a local towing company.

## Exact setup steps (after approval)

1. Create free account at supabase.com (Wheeler-owned email recommended; Syntra added as team member).
2. Create project `wheeler-wrecker` in US region.
3. Run `supabase/schema.sql` in the SQL Editor (creates tables + RLS + seed promo placeholder).
4. Enable Email/Password auth; create Wheeler admin user(s).
5. Deploy Edge Functions from `supabase/functions/` (`supabase functions deploy`).
6. Put project URL + anon key into a config file the site reads (`assets/config.js`, gitignored values documented).
7. Wire `admin/index.html` to Supabase Auth + tables.
8. Test end-to-end locally, then deploy.

## Database schema (summary — full SQL in `supabase/schema.sql`)

- `reviews` — first-party reviews submitted via `/reviews/` (status: pending/approved/rejected).
- `feedback` — private customer messages (never public).
- `promotions` — discount config (type, amount, expiry, eligibility, active flag).
- `redemptions` — discount usage log.
- `admin_users` managed via Supabase Auth (not a table we control).

## Security rules

- Public (anon) role: INSERT into `feedback` only. No SELECT on any table.
- Admin role (authenticated + `is_admin` flag): full CRUD on reviews/promotions/redemptions.
- Reviews appear on the site **only after admin approval** — no auto-publish.
- Promo codes are single configurable record — Wheeler edits fields in admin, no deploys.
- Discount redemption never checks review status or sentiment.
