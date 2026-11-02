# Before you go live: MM Enterprises

## Must do
- [x] **Cloudflare setup and DNS** (done 3 Nov 2026): follow DEPLOYMENT.md (D1 database id in `wrangler.jsonc`, admin secrets, GoDaddy nameservers).
- [x] **Web3Forms key** (done 3 Nov 2026, test enquiry received): put it in `.env` as `WEB3FORMS_ACCESS_KEY`, deploy, then send one real test enquiry. Do not launch until this works.
- [ ] **Customer reviews**: the ten reviews shown on the Home and Reviews pages come from `SAMPLE_REVIEWS` in `data.mjs`. Make sure each one is from a real customer who is happy for it to be published.
- [ ] **Review the Privacy Policy and Terms and Conditions** (`/privacy`, `/terms`).
- [x] **Google Search Console**: domain verified 3 Nov 2026; submit the sitemap (DEPLOYMENT.md, step 3).

## Worth checking
- [ ] **Gallery captions** (`GALLERY` in `data.mjs`): the chimney and hob photos supplied by you are described from what each photo shows; correct any caption that does not match the job.
- [ ] **Butterfly logo**: taken from butterflyindia.com's header; it is small (155 × 56 px). A larger official file would look sharper.
- [ ] **Opening hours, street address, social profiles**: none are shown because none were supplied. Add them to the site and structured data only once confirmed.
- [ ] **Logo file**: `photos/logo.jpeg` has its own dark background. A transparent PNG or SVG would be sharper as a favicon.
