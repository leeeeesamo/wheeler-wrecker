# Review System — Status & Plan

## Public review landing page

- **URL:** `https://wheelertowing.com/reviews/` → implemented as `reviews/index.html` (static hosting resolves directory index automatically on Netlify, GitHub Pages, S3+CloudFront, etc.).
- **QR destination:** `assets/qr/review-qr-1024.png`, `review-qr-512.png`, `review-qr.svg` all encode `https://wheelertowing.com/reviews/`.
- **Print artwork:** `marketing/review-qr-print.html` (letter-size, print CSS included). **PRE-LAUNCH PREVIEW** — re-scan the QR against the live URL before any print run.

## Review showcase page

- `reviews.html` is an honest placeholder: it states reviews are being verified and publishes **no** ratings, testimonials, or aggregate scores until approved content exists.

## Review sourcing status

| Source | Status |
|---|---|
| Facebook — facebook.com/wheelerwreckerservice/ | Page exists per client; public recommendations/reviews require manual verification. Content behind login was NOT scraped. Customer permission required before republishing any review text or photos. |
| hub.biz directory profile | Listed as an existing profile; reviews must be checked manually and verified as genuinely Wheeler's. |
| Google Business Profile | Not yet confirmed/claimed. No Google review URL exists yet — do not invent one. After GBP verification, add the real "Write a review" link to `reviews/index.html`. |

## Compliance rules being followed

- No invented testimonials, reviewers, dates, ratings, or totals.
- No aggregate review schema markup (no fake `aggregateRating`).
- Reviews and discounts are fully separate; no incentive is offered for any review.
- The review page states reviews are optional.

## Still needed from client

1. Written permission / selected review texts approved for the website.
2. Google Business Profile claim + verification for both locations (see launch checklist).
3. Confirmed public review destination URLs (Google review short link, Facebook recommendations link).

## Research findings (2026-11-08) — IMPORTANT

Public review data exists via Google Business Profile aggregators:

- **Bessemer (705 22nd St N):** ~3.8–3.9 / 5 across ~164–171 Google reviews.
- **Alabaster (129 1st Ave W, "Wheeler's Wrecker Services"):** ~3.7 / 5 across ~77 reviews.
- BBB profile exists (NOT accredited, C+ rating, 1 unanswered complaint).

Sentiment is **mixed**. Genuine 5-star reviews exist (e.g., "Quick to answer the phone,
quick pickup/dropoff times. Driver was very efficient. Would definitely recommend them."
— Noah S., Jan 2026; "she was so patient... highly recommend!" — Kelli W., May 2025),
but there are also serious 1-star complaints (billing disputes, impound fees,
vehicle damage allegations, a water-meter incident). A hub.biz profile and Facebook
page exist but content is login-walled / returned 403 — not scraped.

### Implications for the website

1. Publishing ONLY positive testimonials while the public aggregate is ~3.8 with
   documented complaints risks a misleading representation. If Wheeler approves
   featuring testimonials, recommend: clearly label as "Selected customer reviews,"
   link to the full Google/Facebook review set, and let Wheeler see the negative
   reviews first.
2. Every review text used must have customer permission; reviewer first names +
   approximate dates are visible publicly but permission is still required.
3. These third-party reviews stay SEPARATE from the first-party review system
   (Supabase `reviews` table) per the approved architecture.
4. Wheeler should be aware of the recurring complaint themes (fees, impound
   billing, communication) — addressing them improves future reviews.

## Still needed from client

1. Written approval of any testimonials to feature + permission confirmation.
2. Google Business Profile claim + verification for both locations.
3. Confirmed public review destination URLs.
