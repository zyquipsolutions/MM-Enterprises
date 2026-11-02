# MM Enterprises Website: Project Handbook

**Website:** https://mm-enterprises-service.com
**Business:** MM Enterprises, Chennai. Kitchen appliance installation, repair and maintenance (authorised Elica service partner).
**Status:** Live since 3 November 2026
**Document version:** 1.0 (3 November 2026)

> This handbook contains **no passwords or secret keys**. Secrets live only in Cloudflare (encrypted) and in the git-ignored `.env` / `.dev.vars` files on the project computer. Do not paste secrets into this document.

---

## Contents

1. [At a glance](#1-at-a-glance)
2. [Technology stack](#2-technology-stack)
3. [How the system fits together](#3-how-the-system-fits-together)
4. [Project folder structure](#4-project-folder-structure)
5. [Website pages and features](#5-website-pages-and-features)
6. [Security module](#6-security-module)
7. [Reviews system and admin dashboard](#7-reviews-system-and-admin-dashboard)
8. [Contact form (Web3Forms)](#8-contact-form-web3forms)
9. [Hosting, domain and DNS](#9-hosting-domain-and-dns)
10. [Accounts and access](#10-accounts-and-access)
11. [Everyday tasks: how to change things](#11-everyday-tasks-how-to-change-things)
12. [Build, test and deploy](#12-build-test-and-deploy)
13. [Local development](#13-local-development)
14. [SEO and Google Search Console](#14-seo-and-google-search-console)
15. [Backups and recovery](#15-backups-and-recovery)
16. [Troubleshooting](#16-troubleshooting)
17. [Maintenance checklist](#17-maintenance-checklist)
18. [Open items](#18-open-items)
19. [Credits and licences](#19-credits-and-licences)

---

## 1. At a glance

| Item | Value |
|---|---|
| Live URL | https://mm-enterprises-service.com (www and http redirect here) |
| Hosting | Cloudflare Workers (static site + API) |
| Database | Cloudflare D1 `mm-reviews` (Asia-Pacific region) |
| Domain registrar | GoDaddy (DNS managed by Cloudflare) |
| Cloudflare account | zyquipsolutions@gmail.com |
| Worker name | `mm-enterprises` |
| Contact form | Web3Forms → mmenterprses2@gmail.com |
| Admin dashboard | https://mm-enterprises-service.com/admin (password protected) |
| Project folder | `C:\projects\Website_projects\MM_enterprises` |
| Business phone | 98408 71541 · WhatsApp 97506 56371 · mmenterprses2@gmail.com |

---

## 2. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Pages | HTML5, CSS3, vanilla JavaScript | No framework; fast, simple pages |
| Styling | One stylesheet `assets/style.css` (CSS custom properties, Grid, Flexbox) | Midnight Blue design system, responsive layouts |
| Scripts | `assets/main.js`, `assets/admin.js` | Menu, area search, gallery lightbox, contact form, reviews, admin dashboard |
| Fonts | Google Fonts: Playfair Display, Manrope, Inter | Typography |
| Icons | Inline SVG (`icons.mjs`) | No icon library needed |
| Build | Node.js 22.9+ with `build.mjs` (custom static site generator) | Turns `data.mjs` content into HTML in `dist/` |
| Images | `sharp` (npm) | Resizes photos and converts them to WebP |
| Tests | `verify.mjs` (`npm test`, about 2,520 checks) | Links, prices, SEO, gallery counts, reviews, no secrets |
| Server | Cloudflare Worker `src/worker.js` | Serves the site, reviews API, admin login, redirects, security headers |
| Database | Cloudflare D1 (SQLite) | Reviews, categories, failed-login records |
| CLI | Wrangler 4 | Local dev, database, secrets, deploy |
| Forms | Web3Forms | Delivers enquiries by email |
| DNS / CDN / SSL | Cloudflare | DNS, HTTPS certificates, caching, DDoS protection |

---

## 3. How the system fits together

```
 Visitor's browser
       │  https://mm-enterprises-service.com
       ▼
 Cloudflare edge (DNS, SSL certificate, CDN, DDoS protection)
       │
       ▼
 Worker "mm-enterprises" (src/worker.js)
   ├── www / http  ──► 301 redirect to https://mm-enterprises-service.com
   ├── /api/reviews          ──► D1: published reviews (read only, public)
   ├── /api/admin/*          ──► login, session, add/edit/delete reviews (password protected)
   └── everything else       ──► static files from dist/ (HTML, CSS, JS, images)
                                 + security headers on every response

 Contact form (browser) ──► api.web3forms.com ──► email to mmenterprses2@gmail.com
```

- The **10 Home page reviews** are built into the pages from `data.mjs` (no database needed).
- **Extra reviews** added in `/admin` are stored in D1 and shown on the Reviews page after the 10.

---

## 4. Project folder structure

```
MM_enterprises/
├── build.mjs                  Page templates, SEO metadata, sitemap, robots.txt
├── data.mjs                   ALL business content: contact details, products, prices,
│                              brands, gallery, Home/Reviews page reviews, page titles
├── data/
│   ├── blog.mjs               The six blog articles
│   ├── service-areas.json     Pincodes and localities (from location_list.xlsx)
│   └── credits.json           Stock photo credits
├── icons.mjs                  SVG icons
├── assets/
│   ├── style.css              Design system and all page styles
│   ├── main.js                Public site scripts
│   ├── admin.js               Admin dashboard script (loaded only on /admin)
│   └── brands/                Official brand logos (unaltered)
├── photos/                    Source photos (resized to WebP at build time)
├── src/worker.js              Cloudflare Worker: API, admin auth, redirects, headers
├── migrations/0001_reviews.sql  Database tables
├── wrangler.jsonc             Cloudflare config (Worker name, D1 binding, routes)
├── verify.mjs                 Automated checks (npm test)
├── serve.mjs                  Simple local preview server (static pages only)
├── package.json               Scripts and dependencies
├── .env                       Web3Forms key (git-ignored, never share)
├── .env.example               Template for .env
├── .dev.vars                  Local-only admin test secrets (git-ignored)
├── dist/                      Generated website (do not edit by hand)
├── README.md, DEPLOYMENT.md, BEFORE-LAUNCH-CHECKLIST.md, CREDITS.md
└── MM-ENTERPRISES-PROJECT-HANDBOOK.md   (this file)
```

---

## 5. Website pages and features

| Page | URL | Highlights |
|---|---|---|
| Home | `/` | Hero, three info cards (Elica authorised, services, Chennai), product collections, services, brand logos, why choose us, gallery preview, 10 reviews |
| About | `/about` | Company intro, team photo, "14 Years of Successful Service Experience", proprietor Manikandan |
| Services | `/services` | Six appliance sections with installation, repair and maintenance details and booking links |
| Pricing | `/pricing` | Six starting prices (₹249 to ₹499) and "Need a Custom Service Quote?" form |
| Gallery | `/gallery` | 39 images: 7 chimney, 5 hob, 5 cooktop, 5 oven, 4 microwave, 4 dishwasher + installation and maintenance; filters and lightbox |
| Service Areas | `/areas` | 67 pincodes + 65 localities, instant search, district filters, "can't find your area" help |
| Blog | `/blog` + 6 articles | Care guides for each appliance |
| Reviews | `/reviews` | Same 10 reviews as Home + admin-published reviews; filters, sorting |
| Contact | `/contact` | Call, WhatsApp, email, Maps link; enquiry form with required Location field |
| Privacy, Terms | `/privacy`, `/terms` | Legal pages |
| Admin | `/admin` | Private review management (not indexed by search engines) |

**On every page:** floating WhatsApp button (opens chat with a greeting) and email button, sticky header, footer with contact details, call-to-action band.

**Prices (starting from):** Kitchen Chimneys ₹499 · Built-in Hobs ₹349 · Cooktops ₹249 · Ovens ₹449 · Microwave Ovens ₹449 · Dishwashers ₹449.

---

## 6. Security module

### 6.1 Summary

| Area | Protection |
|---|---|
| Transport | HTTPS everywhere (Cloudflare certificate), HSTS for 1 year, http → https 301 redirect |
| Admin access | Single admin password stored as an encrypted Cloudflare secret |
| Sessions | Signed (HMAC-SHA256), HttpOnly, Secure, SameSite=Strict cookie, 8-hour lifetime |
| Brute force | 5 failed logins per IP → locked out for 15 minutes |
| Cross-site attacks | Admin requests must come from this site (Origin check + custom header) |
| Input | Server-side validation and length limits on every field |
| Output | Database text is rendered as plain text, never as HTML (prevents script injection) |
| Database | Not reachable from the internet directly; only through the Worker |
| Secrets | Never in source code, `dist/` or Git; checked automatically by `npm test` |
| Browser hardening | nosniff, anti-framing, referrer and permissions policies |
| Search engines | `/admin` and `/api/` blocked from indexing |
| Network | Cloudflare DDoS protection and CDN in front of everything |

### 6.2 Secrets and where they live

| Secret | Where it is stored | Who sets it | Used for |
|---|---|---|---|
| `ADMIN_PASSWORD` | Cloudflare → Workers & Pages → mm-enterprises → Settings → Variables and Secrets (type **Secret**, encrypted) | Owner | Signing in at `/admin` |
| `SESSION_SECRET` | Same place (type **Secret**) | Owner | Signing session cookies (random, never needs to be remembered) |
| `WEB3FORMS_ACCESS_KEY` | `.env` in the project folder (git-ignored), built into the contact page | Owner | Sending enquiries. This key is public by design: it only allows sending to your inbox, never reading |
| Local test secrets | `.dev.vars` (git-ignored) | Developer | Local testing only, **not** valid on the live site |

Rules:
- Never put passwords in `data.mjs`, `wrangler.jsonc`, `build.mjs` or any document.
- `.env`, `.dev.vars`, `.wrangler/` and `node_modules/` are listed in `.gitignore`.
- `npm test` fails if `ADMIN_PASSWORD=` or `SESSION_SECRET=` appears in the built site, or a password is hard-coded in the Worker.

### 6.3 Admin authentication in detail

1. The admin types the password on `/admin`. The browser sends it over HTTPS to `POST /api/admin/login`.
2. The Worker checks the request comes from the same site (see 6.5) and that the IP is not locked out (see 6.4).
3. The password is compared with `ADMIN_PASSWORD` using a **constant-time comparison** (both values are HMAC-hashed first), so response timing reveals nothing.
4. On success the Worker issues a cookie `mm_admin = <expiry>.<signature>`, where the signature is HMAC-SHA256 of the expiry using `SESSION_SECRET`.
   - `HttpOnly`: page scripts cannot read it.
   - `Secure`: only sent over HTTPS.
   - `SameSite=Strict`: never sent with requests from other websites.
   - `Path=/api/admin`: only sent to admin API endpoints.
   - `Max-Age=28800`: expires after **8 hours**.
5. Every admin API call re-verifies the signature and expiry. A forged or expired cookie is rejected with "Please sign in."
6. **Sign out** clears the cookie immediately.
7. **Changing `SESSION_SECRET` in Cloudflare signs everyone out instantly.**

If either secret is missing, login returns "Admin login is not configured on the server." and nothing can be changed.

### 6.4 Brute-force protection

- Each failed login is recorded (IP address + time) in the D1 table `login_attempts`.
- After **5 failures within 15 minutes**, that IP gets: "Too many failed attempts. Please wait 15 minutes and try again."
- A successful login clears that IP's failure record. Old records are removed automatically.

### 6.5 Cross-site request protection (CSRF)

All admin requests that change data, and the login itself, must:
- carry the header `X-Requested-With: mm-admin` (added by the admin dashboard script), and
- if the browser sends an `Origin` header, it must equal `https://mm-enterprises-service.com`.

Together with the `SameSite=Strict` cookie, this stops other websites from making changes in an admin's name.

### 6.6 Input validation (server side)

| Field | Rule |
|---|---|
| Customer name | 2 to 80 characters, whitespace normalised |
| Review text | 5 to 1,500 characters, control characters removed |
| Rating | Whole number 1 to 5 |
| Review date | Valid `YYYY-MM-DD`, not in the future |
| Category | Must already exist in the categories list |
| Category name | 2 to 40 characters, no duplicates (case-insensitive) |
| Request size | Bodies over 20 KB are rejected |
| Database queries | Always parameterised (`prepare(...).bind(...)`), so SQL injection is not possible |

The contact form also validates in the browser: name, 10-digit Indian mobile number, optional email, required location, product, service type and message. It has a hidden honeypot field to catch simple spam bots.

### 6.7 Output safety (preventing script injection)

- Reviews from the database are inserted into pages with `textContent`, never `innerHTML`, so any `<script>` typed into a review shows as plain text and cannot run. This was tested with a `<script>` review during development.
- Content from `data.mjs` is HTML-escaped at build time.

### 6.8 Public vs private API

| Endpoint | Access | Returns |
|---|---|---|
| `GET /api/reviews` | Public | **Published** reviews only, and category names |
| `POST /api/admin/login`, `/logout`, `GET /api/admin/session` | Public (login) | Login handling |
| `GET/POST/PUT/DELETE /api/admin/reviews…`, `/api/admin/categories…` | **Signed-in admin only** | Full review management |

Unpublished reviews are never returned by the public endpoint. Visitors never see edit or delete buttons.

### 6.9 Security headers (added by the Worker to every response)

| Header | Value | Protects against |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Downgrade to insecure http |
| `X-Content-Type-Options` | `nosniff` | File-type confusion attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking (site embedded in another site) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leaking full URLs to other sites |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | Unwanted access to device features |
| `X-Robots-Tag` (on `/admin`) | `noindex, nofollow` | Admin page appearing in Google |
| `Cache-Control` (on `/admin` and API) | `no-store` | Private data being cached |

`robots.txt` also disallows `/admin` and `/api/`.

### 6.10 Known limitations and recommended upgrades

| Limitation | Recommendation |
|---|---|
| One shared admin password, no two-factor login | Optional: protect `/admin` with **Cloudflare Zero Trust Access** (free for up to 50 users) so only approved Google/email accounts can even open the page |
| No change history for reviews | Keep changes small; use D1 Time Travel to restore (section 15) |
| Lockout is per IP address | Use a strong, unique password (12+ characters) |
| Web3Forms key is visible in page source | Normal for Web3Forms; if spam appears, restrict the key to your domain in the Web3Forms dashboard |

### 6.11 Security do's and don'ts

- **Do** use a long, unique admin password and store it in a password manager.
- **Do** change `ADMIN_PASSWORD` if you think someone else knows it (Cloudflare dashboard → Variables and Secrets → edit). Change `SESSION_SECRET` at the same time to sign everyone out.
- **Do** keep two-factor authentication on the **Cloudflare**, **GoDaddy** and **Google** accounts.
- **Don't** share the admin password over WhatsApp or email.
- **Don't** add secrets as plain-text "Variables" in Cloudflare; always choose type **Secret**.
- **Don't** delete the DNS records listed in section 9.3.

---

## 7. Reviews system and admin dashboard

### 7.1 Two sources of reviews

| Source | Stored in | Shown on | How to change |
|---|---|---|---|
| **Site reviews** (the current 10) | `SAMPLE_REVIEWS` in `data.mjs` | Home page **and** Reviews page | Edit `data.mjs`, rebuild, deploy |
| **Admin reviews** | D1 database | Reviews page only (after the 10) | `/admin` dashboard, live in seconds |

`REVIEWS_PAGE` in `data.mjs` controls the Reviews page:
- `siteReviews: true` shows the 10 site reviews. Set `false` to hide them on the Reviews page only (Home is unaffected), for example when genuine Google reviews are connected in future.
- `adminReviews: true` shows reviews published in `/admin`.

### 7.2 Using the admin dashboard

1. Open https://mm-enterprises-service.com/admin and sign in.
2. **Add review:** customer name, rating (1 to 5), date, category, review text, and tick **Published** to show it.
3. **Edit:** change any field. **Publish / Unpublish:** show or hide without deleting.
4. **↑ ↓:** change the order. **Delete:** removes permanently (asks to confirm).
5. **Categories tab:** add, rename (updates all reviews using it) or delete (only if unused).
6. **Sign out** when finished, especially on shared computers.

Reviews entered here are shown as reviews shared with MM Enterprises, never as Google reviews.

---

## 8. Contact form (Web3Forms)

- Fields: name, phone, optional email, **location or Google Maps link (required)**, product, service type (Installation, Repair, Maintenance, Custom quote), message.
- Delivered to **mmenterprses2@gmail.com** by Web3Forms. Subject: `Service request: <Product> (<Service>)`.
- Clear success and error messages; the button is disabled while sending; never shows success if sending fails.
- Links like `/contact?product=Ovens&service=Repair` pre-select the form (used across the site and by the Pricing quote form).
- If the key is ever removed, the form shows "Online enquiry form is not yet active" and points to phone and WhatsApp.
- Tested live on 3 November 2026: test enquiry received.

**Spam tip:** if an enquiry lands in Gmail Spam, mark it "Not spam".

---

## 9. Hosting, domain and DNS

### 9.1 Cloudflare Worker

| Setting | Value |
|---|---|
| Worker | `mm-enterprises` |
| Routes | `mm-enterprises-service.com/*` and `www.mm-enterprises-service.com/*` (zone routes) |
| D1 binding | `DB` → database `mm-reviews` (ID in `wrangler.jsonc`) |
| Static files | `dist/` via the `ASSETS` binding |
| Compatibility date | 2026-01-01 |

Zone routes are used (not "custom domains") because custom domains require the hostname to have no existing DNS records.

### 9.2 Domain

- Registered at **GoDaddy**; nameservers changed to Cloudflare: `hugh.ns.cloudflare.com`, `keyla.ns.cloudflare.com`.
- Keep the domain on **auto-renew** at GoDaddy.

### 9.3 DNS records you must keep (Cloudflare → DNS → Records)

| Type | Name | Why |
|---|---|---|
| A (proxied, orange cloud) | `mm-enterprises-service.com` | Needed for the Worker route to receive traffic. The target IP is never contacted |
| CNAME (proxied) | `www` | Same, for www |
| TXT | `mm-enterprises-service.com` (`google-site-verification=…`) | Keeps Google Search Console ownership |
| CNAME | `_domainconnect` | GoDaddy domain connect |
| TXT | `_dmarc` | Email protection |

If the A or `www` record is ever deleted, re-add: **A**, name `@`, content `192.0.2.1`, **Proxied**; and **CNAME**, name `www`, content `mm-enterprises-service.com`, **Proxied**.

---

## 10. Accounts and access

| Service | Account | Used for |
|---|---|---|
| Cloudflare | zyquipsolutions@gmail.com | Hosting, DNS, database, secrets |
| GoDaddy | (owner's GoDaddy login) | Domain registration and renewal |
| Google Search Console | (owner's Google account) | Search visibility, sitemap |
| Web3Forms | mmenterprses2@gmail.com | Contact form delivery |
| Website admin | `/admin` password (Cloudflare secret) | Managing reviews |

Turn on two-factor authentication for Cloudflare, GoDaddy and Google.

---

## 11. Everyday tasks: how to change things

All content lives in **`data.mjs`** (and `data/blog.mjs` for articles). After editing: build, test, deploy (section 12).

| Change | Where |
|---|---|
| Phone, WhatsApp, email, Maps link | `SITE` in `data.mjs` |
| Prices | `price` on each item in `PRODUCTS` |
| Service descriptions | `PRODUCTS` (`short`, `intro`, `work`) |
| Home + Reviews page reviews | `SAMPLE_REVIEWS` |
| Gallery photos and captions | Add the photo to `photos/`, then an entry in `GALLERY` |
| Brand logos | `assets/brands/` + `BRANDS` |
| Page titles and descriptions (SEO) | `PAGE_META` |
| Blog articles | `data/blog.mjs` |
| Service areas | `data/service-areas.json` |
| Admin-managed reviews | `/admin` (no deploy needed) |

---

## 12. Build, test and deploy

Run in the project folder (`C:\projects\Website_projects\MM_enterprises`):

```bash
npm install          # first time only
npm run build        # builds dist/ (reads the Web3Forms key from .env)
npm test             # about 2,520 automated checks; must say "0 failed"
npm run deploy       # build + test + publish to Cloudflare
```

After deploying, check:
- https://mm-enterprises-service.com loads and the change is visible (hard refresh: Ctrl + F5).
- The contact page has no "not yet active" notice.

**Roll back a bad deploy:**

```bash
npx wrangler rollback
```

(Choose the previous version when asked; `npx wrangler deployments list` shows history.)

Other commands:

| Command | Purpose |
|---|---|
| `npx wrangler secret list` | Show which secrets exist (names only) |
| `npx wrangler secret put ADMIN_PASSWORD` | Set or change the admin password |
| `npm run db:migrate` | Apply database table changes to the live database |
| `npx wrangler tail` | Watch live Worker logs (for troubleshooting) |

---

## 13. Local development

```bash
npm run dev          # static pages only at http://localhost:4173
npm run dev:worker   # full site + reviews API + admin at http://127.0.0.1:8787
```

- Local admin uses the test password in `.dev.vars` (not the live one).
- Local reviews are stored in `.wrangler/` and are separate from the live database.

---

## 14. SEO and Google Search Console

**Built in:**
- Unique title and description on every page, focused on kitchen chimney and appliance service in Chennai.
- Canonical URLs, Open Graph and Twitter tags on every page.
- Structured data (schema.org): Organization, HomeAndConstructionBusiness (LocalBusiness), WebSite, Service list, OfferCatalog (prices), BreadcrumbList, BlogPosting. No fake ratings or review schema.
- `sitemap.xml` (17 pages) and `robots.txt`.
- Descriptive image file names and alt text, WebP images, lazy loading.

**Search Console (verified 3 November 2026):**
- Sitemap submitted: `https://mm-enterprises-service.com/sitemap.xml`. "Couldn't fetch" in the first 24 to 48 hours is normal; it should turn to **Success** with 17 pages.
- Use **URL inspection → Request indexing** for important pages after big changes.
- Check **Pages** (indexing) and **Performance** (searches) monthly.

---

## 15. Backups and recovery

| What | How |
|---|---|
| Website code and content | Keep a copy of the project folder (excluding `node_modules`, `dist`). An earlier backup exists at `C:\projects\Website_projects\MM_enterprises_backups\`. Recommended: put the project in a private Git repository |
| Reviews database | `npx wrangler d1 export mm-reviews --remote --output reviews-backup.sql` (run monthly, or before big changes) |
| Database point-in-time restore | D1 **Time Travel** keeps 30 days of history: `npx wrangler d1 time-travel info mm-reviews` and `npx wrangler d1 time-travel restore mm-reviews --timestamp=<time>` |
| Previous website version | `npx wrangler rollback` |
| Secrets | Keep the admin password in a password manager; secrets cannot be read back from Cloudflare |

---

## 16. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `/admin` says "Admin login is not configured" | `ADMIN_PASSWORD` or `SESSION_SECRET` missing | Add both as **Secret** in Cloudflare (section 6.2) |
| "Incorrect password" | Wrong password | Re-type; or set a new one in Cloudflare |
| "Too many failed attempts" | 5 wrong tries from this IP | Wait 15 minutes |
| Admin keeps signing out | Session lasts 8 hours, or `SESSION_SECRET` changed | Sign in again |
| Contact form says "not yet active" | Web3Forms key missing from the build | Check `.env`, then `npm run deploy` |
| Enquiries not arriving | Gmail Spam, or Web3Forms issue | Check Spam; check the Web3Forms dashboard |
| Deploy error code 100117 "already has externally managed DNS records" | Only happens with custom-domain mode | The project uses zone routes; keep `wrangler.jsonc` as is |
| Site not loading at all | DNS A or `www` record deleted | Re-add as in section 9.3 |
| Search Console "Couldn't fetch" for over 2 days | Google fetch problem | Remove and resubmit the sitemap; turn off Cloudflare **Bot Fight Mode** if enabled |
| A change does not appear | Browser cache | Hard refresh (Ctrl + F5) or wait a minute |

---

## 17. Maintenance checklist

**Monthly**
- [ ] Export the reviews database backup (section 15).
- [ ] Check Search Console → Pages and Performance.
- [ ] Send one test enquiry through the contact form.
- [ ] Check Cloudflare → Workers → mm-enterprises for errors.

**Every 6 months**
- [ ] Change the admin password.
- [ ] Update dependencies: `npm update`, then `npm run build && npm test` before deploying.
- [ ] Review prices, contact details and reviews in `data.mjs`.

**Yearly**
- [ ] Confirm the GoDaddy domain renewal and payment method.
- [ ] Review the Privacy Policy and Terms.

---

## 18. Open items

- [ ] Sitemap status in Search Console should change to **Success** (check after 48 hours).
- [ ] Owner to confirm the 10 reviews are from real customers happy to be published.
- [ ] Owner to review `/privacy` and `/terms` wording.
- [ ] Owner to check gallery captions match the actual jobs.
- [ ] Optional: Cloudflare **SSL/TLS → Edge Certificates → Always Use HTTPS** (the site already redirects).
- [ ] Optional: larger Butterfly logo, transparent MM Enterprises logo, opening hours, street address.
- [ ] Optional: Cloudflare Zero Trust Access for `/admin` (section 6.10).
- [ ] Optional: Google Reviews integration in future (needs a Google Places API key).

---

## 19. Credits and licences

- Stock photographs from Unsplash under the Unsplash License; full list in `CREDITS.md`. They are marked "Representative image" on the site.
- Brand logos (Elica, Bosch, LG, Siemens, Whirlpool from Wikimedia Commons; Butterfly from butterflyindia.com) are trademarks of their owners, shown unaltered to identify brands serviced.
- Logo, proprietor photo, team photo and the kitchen chimney and built-in hob job photos were supplied by MM Enterprises.
- Website code is private (`UNLICENSED`) and belongs to MM Enterprises.
