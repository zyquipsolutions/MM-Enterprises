# Deploying mm-enterprises-service.com

The site is a static build (`dist/`) served by a **Cloudflare Worker**, which also runs the reviews API and admin login.
Reviews are stored in a **Cloudflare D1** database. GoDaddy stays as the domain registrar; Cloudflare hosts the site.

Why Cloudflare: the Reviews dashboard needs a real backend and database. Cloudflare Workers + D1 provides both on the
free plan, serves the static pages from the same place, and handles HTTPS automatically. A plain static host
(or the old Apache/cPanel setup) cannot run the reviews backend.

## 1. One-time setup (about 20 minutes)

You need a free Cloudflare account and Node.js 22.9 or newer.

```bash
npm install
npx wrangler login
```

Create the reviews database and copy the `database_id` it prints into `wrangler.jsonc` (replace `REPLACE_WITH_D1_DATABASE_ID`):

```bash
npx wrangler d1 create mm-reviews
```

Create the tables:

```bash
npm run db:migrate
```

Set the admin secrets. Choose a long, unique password; use a random string of 64+ characters for the session secret.
They are stored encrypted by Cloudflare and never appear in the source code:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

```bash
npx wrangler secret put SESSION_SECRET
```

Add the Web3Forms key to `.env` (copy `.env.example`), then build, test and deploy:

```bash
npm run deploy
```

## 2. Point the GoDaddy domain at Cloudflare

1. In the Cloudflare dashboard choose **Add a domain**, enter `mm-enterprises-service.com`, and pick the Free plan.
2. Cloudflare shows **two nameservers** assigned to your account (they look like `name.ns.cloudflare.com`).
   Use exactly the two it shows you.
3. In GoDaddy: **My Products → Domains → mm-enterprises-service.com → DNS → Nameservers → Change nameservers →
   "I'll use my own nameservers"**, paste the two Cloudflare nameservers and save.
4. Wait for Cloudflare to show the domain as **Active** (usually under an hour, sometimes up to 24 hours).
5. Run `npm run deploy` again. The `routes` in `wrangler.jsonc` send every request for
   `mm-enterprises-service.com/*` and `www.mm-enterprises-service.com/*` to the Worker.
   **Keep proxied (orange-cloud) DNS records for both names** in Cloudflare → DNS → Records: an A record for
   `mm-enterprises-service.com` and a CNAME (or A) record for `www`. Their targets are never contacted because the Worker
   answers first, but without them the names do not resolve. If they are ever deleted, add an A record for `@` pointing
   to `192.0.2.1` (proxied) and a CNAME `www` → `mm-enterprises-service.com` (proxied).
   Cloudflare issues the SSL certificate automatically (Universal SSL).
6. In Cloudflare, **SSL/TLS → Edge Certificates**: turn on **Always Use HTTPS**.

The Worker redirects `www.` and plain `http://` requests to `https://mm-enterprises-service.com` with a 301, so there is one
canonical address.

If you already use GoDaddy email on this domain, copy the existing MX and TXT records into Cloudflare DNS before switching
nameservers (Cloudflare usually imports them automatically during step 1; check that they are there).

## 3. After going live

- Open `https://mm-enterprises-service.com/admin`, sign in, and add your first genuine review.
- Google Search Console: add the domain property, verify it with the TXT record Search Console gives you (add it in
  Cloudflare DNS), then submit `https://mm-enterprises-service.com/sitemap.xml`.
- Send one real enquiry through the contact form to confirm Web3Forms delivers it.

## Local development

```bash
npm run dev:worker
```

This builds the site, applies the database migration to a local D1 copy and starts the Worker at
`http://127.0.0.1:8787` (admin at `/admin`). Local admin secrets live in `.dev.vars` (git-ignored; see the file for the
local password). `npm run dev` still serves the static pages only, without the reviews API.

## Changing the domain later

All URLs come from `SITE.domain` in `data.mjs` and `CANONICAL_HOST` in `src/worker.js`, plus the two `routes` in
`wrangler.jsonc`.
