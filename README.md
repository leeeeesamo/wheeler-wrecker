# Wheeler Wrecker Service website

A static, multi-page website for Wheeler Wrecker Service, expanded from the original one-page Syntra Digital Solutions concept based on Caleb Wheeler's completed November 2026 intake, SEO and monthly-care questionnaires.

## Pages
- Home, About, Services, Fleet & Gallery, Service Areas, FAQ, Vehicle Release, Contact and Commercial Accounts.
- Seven individual service pages: light-, medium- and heavy-duty towing, accident recovery, rotator/crane recovery, equipment transportation and off-road winching.

## Client-confirmed details used
- **Bessemer:** 705 22nd St N, Bessemer, AL 35020; **205-424-3200**
- **Alabaster:** 129 1st Ave W, Alabaster, AL 35007; **205-664-9000**
- Tow/recovery dispatch is 24/7. Both **offices** are open Monday–Friday 8 AM–5 PM and Saturday 8 AM–12 PM. Sunday office is not listed as open.
- Wheeler is family-owned for three generations, with more than 30 trucks. The slogan is “Large or small, we handle ’em all.”
- Core service coverage: Bessemer, Birmingham, Alabaster, Helena, Pelham, Calera, McCalla, Jefferson and Shelby counties, and statewide Alabama (call for availability).
- The Facebook share link was taken from the client intake. No Instagram or LinkedIn links were added.

## Critical pre-launch checklist

1. **Confirm founding year**: intake lists 1967 under "year established" but describes family ownership since 1970. We intentionally avoided a year-specific claim until clarified.
2. **Official branding/images**: existing repository truck photos have been reused. The logo assets in `assets/` are identified in their README as concepts; replace/approve them against actual Wheeler files. Obtain and add more genuine fleet/recovery photos when received.
3. **New business email**: currently `wheelercaleb030@gmail.com` from the intake is used for non-urgent inquiries. Caleb stated he will provide a new address. Replace the email in `contact.html`, especially the `data-mailto` address and mail link. **The contact form is mailto-only; it does not submit server-side or guarantee delivery.** For a fully operational quote/contact form, configure a form backend or a suitable hosted form service with spam prevention and privacy notice.
4. **Emergency dispatch number**: client provided two shop telephone numbers but not a distinct centralized number. Confirm whether both receive calls around the clock. All CTAs currently use those provided numbers.
5. **Reviews**: client asked for testimonials and Google reviews, but did not submit any text, ratings or direct listing URLs. Add only verified, authorized reviews later.
6. **Vehicle release**: verify release requirements, document list, fees and appointment rules with Wheeler before adding specific instructions. The page currently directs customers to phone.
7. **Domain and ownership**: no domain is owned yet. Caleb requests Wheeler ownership of domain, hosting and connected Google accounts with full access. Register under Wheeler's own account, invite Syntra as collaborator, and set up billing/access securely.
8. **Search engine launch**: the pages currently use `noindex,follow` to prevent indexing a public mockup, and `robots.txt`/ `sitemap.xml` remain pending final-domain updates. Once the final **Wheeler-owned domain** is connected, add canonical and absolute Open Graph URLs, replace `noindex,follow` with `index,follow`, verify structured data and accessibility, regenerate `sitemap.xml` with all production URLs, update `robots.txt` to the final sitemap URL, submit in Google Search Console, configure analytics with the client's Google permissions, and test.
9. **Maps and local listings**: embedded Google map search coordinates are address-based. Confirm the maps land on the correct business location; get direct Google Business Profile URLs for both listings.
10. **Test**: check every route, title, tel link, mailto inquiry, 404 behavior, maps, mobile menu, contrast and responsive breakpoints before merging and going live.
11. **Service verification**: do not add unconfirmed roadside extras (lockouts, fuel delivery, jumpstarts, tire service). They were on the prior mockup but not on Caleb's confirmed service list.

## Technical notes
- No build dependencies; open `index.html` from a local web server (VS Code Live Server or `python -m http.server 8000`).
- Original `styles.css` remains untouched; expansion-specific rules are in `client-updates.css`.
- Shared JS (`script.js`) controls mobile navigation and mailto composition; no backend or secrets.
- One JSON-LD `TowingService` node per location with office hours (not falsely claiming storefront opening 24/7), plus Organization JSON-LD.
- Some metadata, Google Search Console configuration and live analytics require finalized domain and account authorization.

## Monthly care / SEO
The completed forms request health checks, form/phone/map tests, small content and photo updates, basic technical SEO, analytics reporting, backups/security where applicable. Syntra and Caleb still need to agree on monthly scope, included change allowance, turnaround, and pricing. A separate ongoing SEO campaign is **not** included or priced by this repository.

## Repository approach
Changes in `client-intake-site-expansion-2026-11` are prepared for review and are not deployed to the default branch until merged.
