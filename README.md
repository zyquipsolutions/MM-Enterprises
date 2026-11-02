# MM Enterprises website

Website for MM Enterprises, Chennai (https://mm-enterprises-service.com). `build.mjs` generates plain HTML into `dist/`;
a Cloudflare Worker (`src/worker.js`) serves it and runs the reviews API backed by a Cloudflare D1 database.

```bash
npm install
npm run dev          # static pages only, http://localhost:4173
npm run dev:worker   # full site + reviews API + admin, http://127.0.0.1:8787
npm test             # checks the built site (links, prices, gallery counts, SEO, labels, no secrets)
npm run deploy       # build, test, deploy to Cloudflare
```

Read **DEPLOYMENT.md** (Cloudflare and GoDaddy DNS) and **BEFORE-LAUNCH-CHECKLIST.md** before going live.

## Where things live
| What | File |
|---|---|
| Business details, products, prices, brands, gallery, Home page reviews | `data.mjs` |
| Blog articles | `data/blog.mjs` |
| Service areas (converted from `location_list.xlsx`) | `data/service-areas.json` |
| Stock image credits (kept for licensing, not shown on the site) | `data/credits.json`, `CREDITS.md` |
| Page templates and SEO metadata | `build.mjs` |
| Design system (Midnight Blue tokens, components) | `assets/style.css` |
| Menu, area search, gallery, lightbox, contact form, public reviews | `assets/main.js` |
| Reviews admin dashboard | `assets/admin.js` (page: `/admin`) |
| Reviews API, admin login, redirects, security headers | `src/worker.js` |
| Database tables | `migrations/0001_reviews.sql` |
| Brand logos (official artwork, unaltered) | `assets/brands/` |
| Photos (resized to WebP at build time) | `photos/` |

## Reviews
- **One source for the site reviews:** `SAMPLE_REVIEWS` in `data.mjs` feeds both the Home page review cards and the
  Reviews page. Edit them there once; both pages update on the next build. There is no second copy.
- The **Reviews page** (`/reviews`) shows those site reviews first, followed by any reviews published at `/admin`
  (stored in the database; password set with `npx wrangler secret put ADMIN_PASSWORD`). The admin dashboard never
  changes the Home page.
- `REVIEWS_PAGE` in `data.mjs` controls the Reviews page sources. When genuine Google reviews are connected, set
  `siteReviews: false` to remove these ten reviews from `/reviews` without touching the Home page.
- Reviews entered in the dashboard are labelled as reviews shared with MM Enterprises, never as Google reviews.

## Contact form (Web3Forms)
Copy `.env.example` to `.env`, set `WEB3FORMS_ACCESS_KEY`, then build. While the key is empty the form shows
"Online enquiry form is not yet active" and never sends or shows success. Enquiries include name, phone, optional email,
location (or Google Maps link), product, service type and message.
