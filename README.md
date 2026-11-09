# Wheeler Wrecker Service — Website

Multi-page static website for **Wheeler Wrecker Service**, family-owned since **1967**,
serving Bessemer, Alabaster and communities across Alabama. Tagline: *"Large or small,
we handle 'em all."*

**Status: PRE-LAUNCH.** Pages serve `noindex,follow` and `robots.txt` disallows crawling
until the production domain `https://wheelertowing.com` is approved and deployed.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About | `about.html` |
| Services overview (12-service photo grid) | `services.html` |
| Service pages | `services/` — light-duty, medium-duty, heavy-duty towing, heavy-duty recovery, accident recovery, rotator recovery, equipment transportation, off-road winching, **long-distance towing, roadside assistance, vehicle storage, underwater recovery** (all confirmed 2026-11-08) |
| Fleet & Gallery | `fleet.html` |
| Service Areas | `service-areas.html` |
| Commercial & Fleet Accounts | `commercial-accounts.html` |
| Reviews showcase | `reviews.html` |
| **Review landing page (QR destination)** | `reviews/index.html` → `/reviews/` |
| FAQs | `faq.html` |
| Vehicle Release | `vehicle-release.html` |
| Contact & 24-Hour Dispatch | `contact.html` |
| Admin dashboard (stub, non-functional) | `admin/index.html` |
| QR print artwork | `marketing/review-qr-print.html` |

## Business facts used

- Est. **1967** · family-owned, three generations · **30+ trucks**
- Bessemer: 705 22nd St N, Bessemer, AL 35020 — **(205) 424-3200**
- Alabaster: 129 1st Ave W, Alabaster, AL 35007 — **(205) 664-9000**
- Both numbers are **24-hour towing & recovery dispatch**. Office hours (Mon–Fri 8–5,
  Sat 8–12) are NOT dispatch hours — the site states this explicitly everywhere.
- Planned email: `info@wheelertowing.com` — **mailbox activates at launch**; the contact
  form is a `mailto:` helper only and says so honestly.
- Domain: `wheelertowing.com` (canonical/OG URLs already point here; keep `noindex` until launch).

## Photos

- `assets/wheeler-wrecker1–13.jpg` — client originals (kept untouched).
- Duplicates removed by hash: wrecker4=10=11, wrecker5=12, wrecker6=13 → 9 unique photos.
- `assets/img/*.webp` — optimized web versions (max ~1920px, q82) used by the site.
- `assets/wheeler-truck1–4` — earlier supplied Wheeler truck photos.
- `assets/wheeler-logo.jpg` — embroidered logo reference; clean digital logo assets
  (`wheeler-logo*.png`, `favicon*`) were produced earlier and should be approved against
  the reference before launch.

## Reviews & QR

- `/reviews/` is the customer review landing page (QR destination).
- QR assets: `assets/qr/review-qr-1024.png`, `review-qr-512.png`, `review-qr.svg` →
  `https://wheelertowing.com/reviews/`. **Pre-launch preview — re-scan before printing.**
- No reviews are published until verified + approved (`docs/review-system-plan.md`).
- `marketing/review-qr-print.html` is print-ready letter artwork (also pre-launch).

## Backend, discounts & admin

- Supabase backend code is ready but NOT deployed: `supabase/schema.sql`, `supabase/functions/`. Setup/costs in `docs/supabase-setup.md` — awaiting approval, ~$0/mo on free tier.
- Review/feedback forms activate only after edge functions deploy (`assets/config.js` feature flags).

## Discounts & admin

- Discount program is **designed but INACTIVE** — terms pending Wheeler approval
  (`docs/discount-program.md`). Never tied to reviews (Google/FTC compliant).
- `admin/index.html` is a non-functional UI stub. Real backend recommended: **Supabase
  free tier** — see `docs/backend-and-admin-plan.md`.

## Pending client confirmations

- `docs/pending-services.md` — only genuinely unconfirmed details remain (roadside extras,
  storage fees/capacity, underwater equipment specifics).
- Vehicle release fees/documents — page directs customers to call first.
- Google Business Profiles for both locations — to be claimed at launch.

## QA

- `tools/qa_browser.py` — Playwright sweep at 320/375/390/768/1024/1440px across 10 pages: console errors, failed requests, broken images, horizontal overflow, mobile menu. Latest run: **all clean**.

## Local preview

```bash
python -m http.server 8123
# open http://localhost:8123/
```

Any static server works. `/reviews/` resolves via `reviews/index.html` on Netlify,
GitHub Pages, Cloudflare Pages, S3+CloudFront, etc.

## Launch checklist (abbreviated)

1. Wheeler approves final content, logo, and pending-service answers.
2. Deploy to `wheelertowing.com` hosting; switch `noindex,follow` → `index,follow` on all pages; update `robots.txt` to allow + sitemap.
3. Create `info@wheelertowing.com` mailbox; decide on form backend (currently mailto-only).
4. Claim/verify Google Business Profiles (Bessemer + Alabaster); add real review links to `/reviews/`.
5. Test-scan QR codes against the live `/reviews/` URL before printing.
6. Approve backend provider before wiring admin/reviews/discounts.
7. Submit sitemap in Google Search Console; configure analytics.
