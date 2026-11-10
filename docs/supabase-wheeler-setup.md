# Wheeler Wrecker — Supabase Setup Guide (Independent Project)

**IMPORTANT:** Wheeler Wrecker must use its OWN Supabase organization and
project. Do NOT reuse or connect any existing personal/work Supabase
projects, organizations, API keys, or credentials.

Recommended ownership: Caleb (Wheeler Wrecker Service) owns the Supabase
organization; Syntra Digital Solutions is invited as an organization member
for maintenance.

## 1. Create the project (one-time, ~15 min)

1. Caleb creates a free Supabase account at https://supabase.com using a
   Wheeler-controlled email (e.g. `wheelercaleb030@gmail.com`).
2. Create a **new Organization** named "Wheeler Wrecker Service" (do not pick
   an existing org).
3. Create a **new Project** inside that org, e.g. `wheeler-wrecker`, in the
   closest region (likely `us-east-1` / East US).
4. Save the project URL and keys from Project Settings → API.

## 2. Database schema

In the Supabase dashboard → **SQL Editor**, paste and run the entire contents
of `supabase/schema.sql` from this repo. It creates the `reviews`,
`feedback`, `promotions`, `redemptions`, `review_events` tables, enables Row
Level Security, and creates admin/public policies. Safe to re-run.

## 2b. Rate-limit table (recommended)

In **SQL Editor**, also run `supabase/rate-limit-table.sql`. It creates
`public.rate_limit_events` (service-role only) and the atomic
`public.check_rate_limit()` RPC used by `submit-review` for 5 submissions
per IP per 10 minutes. Without it, `submit-review` returns 503 rather than
falling back to an unreliable limiter — so run this BEFORE deploying
`submit-review`. IPs are purged after 24 hours.

## 2c. Table grants (required)

Wheeler's Supabase project has **automatic exposure of new tables to the
Data API disabled**, so tables created by `schema.sql` do NOT automatically
receive the privileges the Edge Functions need. Without these grants,
`submit-review` fails on insert and the dashboard cannot read reviews.

Run this in **SQL Editor AFTER** installing `schema.sql` (order matters —
the tables must exist first):

```sql
-- Server-side review submission and approved-review retrieval
GRANT SELECT, INSERT
ON TABLE public.reviews
TO service_role;

-- Private dashboard read access
-- Existing RLS policies restrict reads to authorized Wheeler administrators
GRANT SELECT
ON TABLE public.reviews, public.review_events
TO authenticated;
```

Notes:

- These grants restore the privileges that auto-exposure would normally
  provide; they do NOT weaken security. Row Level Security still applies —
  `authenticated` users can only SELECT rows where `is_admin()` is true.
- `anon` deliberately receives **no** direct SELECT on `public.reviews`.
  Public approved reviews reach the site only through the `list-reviews`
  Edge Function, which uses the service role and returns whitelisted fields.
- `service_role` is used only inside Edge Functions. The service-role key
  must NEVER appear in browser-side configuration — `assets/config.js`
  holds only the publishable URL + anon key.
- If the optional feedback/promotion features are enabled later, their
  tables will need equivalent grants at that time.

## 3. Edge Functions

Functions can be deployed either via the Supabase CLI or directly in the
dashboard (**Edge Functions → Create function → paste `index.ts`** — the
files use only remote `https://` imports, so no extra files are needed).

CLI (from a machine with `npm i -g supabase`, logged into the Wheeler project):

```bash
supabase link --project-ref yyplaluzyavgriheggyc
supabase functions deploy submit-review   --no-verify-jwt
supabase functions deploy list-reviews    --no-verify-jwt
supabase functions deploy moderate-review            # JWT verification ON (default)
supabase functions deploy submit-feedback --no-verify-jwt   # optional, later
```

Dashboard equivalent: create each function, paste its `index.ts`, and set
**Verify JWT** OFF for `submit-review`/`list-reviews`, ON for
`moderate-review`.

- `--no-verify-jwt` is required because the public review form has no user
  session; the functions perform their own validation.
- The service-role key lives only in Supabase function secrets — never in
  the website files.

## 4. Admin accounts (Caleb + Leesa)

1. Supabase dashboard → **Authentication → Users → Invite user** (or Add user).
   Invite `wheelercaleb030@gmail.com` and `leesa@syntrasolutions.digital`.
   Each sets their own password — no shared or hardcoded credentials.
2. After each accepts their invite, add them to the admin allowlist in
   **SQL Editor** (the `admin_users` table is created by schema.sql; users
   cannot modify it themselves):

```sql
insert into public.admin_users (user_id)
select id from auth.users
where email in ('wheelercaleb030@gmail.com','leesa@syntrasolutions.digital')
on conflict do nothing;
```

   First confirm BOTH users exist (invites accepted):
   `select email from auth.users where email in ('wheelercaleb030@gmail.com','leesa@syntrasolutions.digital');`
   should return 2 rows. Then verify the allowlist:
   `select u.email from auth.users u join public.admin_users a on a.user_id = u.id;`
   should also return 2 rows.

3. Dashboard access: `https://wheelertowing.com/admin/` — sign-in is enforced
   by Supabase Auth AND the `is_admin` check; Row Level Security blocks all
   review data for non-admins server-side. Moderation writes go through the
   `moderate-review` Edge Function, which re-verifies admin status and the
   allowed status transition on every action — admins cannot edit review
   fields directly or forge audit-history records.

## 5. Site configuration

Edit `assets/config.js` with the Wheeler project's values. This file IS
committed to the repo — it contains only the publishable anon key and project
URL, which are safe to expose on GitHub Pages (Row Level Security protects
the data). The service-role key must NEVER appear in it:

```js
window.WHEELER_CONFIG = {
  supabaseUrl: "https://<wheeler-project-ref>.supabase.co",
  supabaseAnonKey: "<wheeler-anon-key>",
  reviewFunctionUrl: "https://<wheeler-project-ref>.supabase.co/functions/v1",
  features: { reviewForm: true }
};
```

The anon key is safe to expose publicly (RLS protects the data). The
service-role key must NEVER go in this file or any client-side code.

## 6. Optional bot protection (recommended before real traffic)

Create a free Cloudflare Turnstile site, add the widget to the review form,
and set the secret:

```bash
supabase secrets set TURNSTILE_SECRET_KEY=<turnstile-secret>
```

The `submit-review` function verifies the token only when this secret exists.

## 7. Test checklist

- Submit a review on `/reviews.html` → appears in dashboard as **pending**.
- Approve it in `/admin/` → appears publicly on `/reviews.html` within ~5 min
  (list-reviews cache) after refresh.
- Reject/restore flows, sign-out, and non-admin login rejection.
- Verify pending/rejected reviews never appear publicly.

## Free-plan limitations to know

- **Inactivity pause:** free projects pause after ~7 days of inactivity.
  Any real traffic (form submits, dashboard logins, page views calling the
  functions) counts as activity. If the site is quiet for a week, the first
  request may take ~30s while Supabase restores the project. Upgrade to Pro
  ($25/mo) later if this becomes a problem.
- **Limits:** 500 MB database, ~5 GB bandwidth/month, 500k Edge Function
  invocations/month — far more than a towing company's review volume needs.
- Edge Functions on free plan have per-invocation time limits (~150s wall /
  lower CPU) — irrelevant for this workload.
- Auth emails (invites, password resets) are included; custom SMTP can be
  added later if deliverability matters.
