# Backend, Admin Dashboard & Discount System — Plan

## Hosting reality check

The public website is **static HTML/CSS/JS**. It can be hosted anywhere static files are
served (Netlify, Cloudflare Pages, GitHub Pages, S3, etc.).

The review system, customer feedback, discount management and admin dashboard require a
**backend + database + authentication**. A purely static site cannot securely store
reviews, verify admin passwords, or enforce discount rules.

## Recommended backend (pending your approval — no accounts created yet)

**Supabase (free tier)** is the recommended starting point:

- Postgres database for reviews, feedback, promo codes, redemptions.
- Built-in auth (email/password) for the Wheeler admin dashboard.
- Row-Level Security so only admins can moderate reviews or change promos.
- Generous free tier; paid tiers only if usage grows.
- Alternatives: Firebase (Google), or a small Node/Express API + managed Postgres.

Estimated cost at launch: **$0/month** on Supabase free tier. Domain/email costs are
separate and already planned.

## Planned architecture

```
wheelertowing.com          → static site (this repo)
reviews/index.html         → public review landing page (live now)
api (Supabase Edge Functions or Netlify Functions)
  POST /feedback           → stores private feedback
  GET  /reviews/pending    → admin-only moderation queue
admin/                     → password-protected dashboard (UI stub in repo)
```

## Admin dashboard

`admin/index.html` is a **visual stub only** — it is NOT functional and must not be
treated as secure. Before launch it will be wired to Supabase Auth. Planned features:

- Moderate customer reviews (approve / hide / reply).
- View private customer feedback submissions.
- Configure promotional offers: discount type (% or $), amount, eligibility,
  expiration date, applicable services, redemption method, exclusions, active toggle.
- View discount redemptions.
- All settings stored in the database — **no code edits needed to change a promo.**

## Discount program rules (compliance)

- Discounts are NEVER conditioned on leaving a review (Google/FTC policy).
- A customer can redeem an eligible discount without reviewing anything.
- No sentiment filtering: review links are not shown only to happy customers.
- Discount terms are TBD by Wheeler — see `docs/discount-program.md`.

## Activation checklist (requires approval + accounts)

1. Approve backend provider (Supabase recommended).
2. Create Supabase project; enable email/password auth; create admin user for Wheeler.
3. Create tables: `reviews`, `feedback`, `promotions`, `redemptions`.
4. Deploy edge functions for public feedback submission (with spam protection).
5. Wire `admin/` UI to Supabase; protect with auth + RLS.
6. Create first promotion only after Wheeler approves terms.
