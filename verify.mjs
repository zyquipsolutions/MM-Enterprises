// ============================================================================
//  verify.mjs: checks the built site in dist/ (run `npm run build` first).
//  Usage: npm test
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PRODUCTS, AREAS, GALLERY, SAMPLE_REVIEWS, PRICE_NOTE } from './data.mjs';
import { BLOG } from './data/blog.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const DOMAIN = 'https://mm-enterprises-service.com';
const fails = [];
const ok = [];
const check = (cond, msg) => (cond ? ok : fails).push(msg);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(htmlFiles.map((f) => ['/' + path.relative(DIST, f).replace(/\\/g, '/'), fs.readFileSync(f, 'utf8')]));
const resolve = (u) => {
  const p = u.split('#')[0].split('?')[0];
  if (!p || p === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  const f = path.join(DIST, p);
  return (fs.existsSync(f) && fs.statSync(f).isFile()) || fs.existsSync(f + '.html');
};
const text = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const isPublic = (file) => !['/admin.html', '/404.html'].includes(file);

// 1. pages: the existing pages plus the Reviews page and private admin; no extra SEO pages
const expected = ['/', '/about', '/services', '/pricing', '/areas', '/gallery', '/blog', '/reviews', '/contact', '/privacy', '/terms', '/admin', ...BLOG.map((b) => `/blog/${b.slug}`)];
for (const p of expected) check(resolve(p), `page exists: ${p}`);
const expectedFiles = new Set([...expected.map((p) => (p === '/' ? '/index.html' : p + '.html')), '/404.html']);
for (const f of Object.keys(html)) check(expectedFiles.has(f), `no unexpected page: ${f}`);
check(BLOG.length === 6 && BLOG.some((b) => b.product === 'cooktops'), 'six blog articles, cooktops included');

// 2. links, images, anchors, alt text, theme colour, floating actions
for (const [file, src] of Object.entries(html)) {
  for (const [, u] of src.matchAll(/(?:href|src)="(\/[^"]*)"/g)) check(resolve(u), `${file}: link ${u}`);
  for (const [, set] of src.matchAll(/srcset="([^"]+)"/g)) for (const part of set.split(',')) { const u = part.trim().split(' ')[0]; check(resolve(u), `${file}: srcset ${u}`); }
  for (const [, u, id] of src.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
    const target = html[(u === '/' ? '/index' : u) + '.html'];
    if (target && id !== 'main') check(target.includes(`id="${id}"`), `${file}: anchor ${u}#${id}`);
  }
  for (const [tag] of src.matchAll(/<img\b[^>]*>/g)) check(/\salt="/.test(tag), `${file}: img has alt`);
  check(src.includes(`<meta name="theme-color" content="${SITE.themeColor}">`), `${file}: theme-color`);
  check(!/href="#"/.test(src), `${file}: no placeholder # links`);
  check(src.includes(`class="fab-btn fab-wa" href="https://wa.me/${SITE.whatsappDigits}?text=`) && /fab-wa"[^>]*target="_blank"/.test(src), `${file}: floating WhatsApp button (new tab, digits-only number)`);
  check(src.includes(`class="fab-btn fab-mail" href="mailto:${SITE.email}"`), `${file}: floating email button`);
  check(!/mm-enterprises\.example|siva-swamy/.test(src), `${file}: no old domain references`);
  check(!/[—–]/.test(text(src)), `${file}: no en or em dashes in visible text`);
  check(!/Photo: .{1,40} on Unsplash|Representative images from Unsplash/.test(text(src)), `${file}: no visible photo attribution`);
  check(!/\bAI\b|artificial intelligence/i.test(text(src)), `${file}: no AI references`);
}

// 3. SEO: unique metadata, canonical on the official domain, robots, OG
const titles = {}; const descs = {};
for (const [file, src] of Object.entries(html)) {
  if (!isPublic(file)) { check(/noindex/.test(src), `${file}: noindex`); continue; }
  const t = src.match(/<title>([^<]+)<\/title>/)?.[1];
  const d = src.match(/<meta name="description" content="([^"]+)"/)?.[1];
  check(t && !titles[t], `${file}: unique title`); titles[t] = file;
  check(d && !descs[d], `${file}: unique description`); descs[d] = file;
  check(new RegExp(`<link rel="canonical" href="${DOMAIN}/`).test(src), `${file}: canonical on ${DOMAIN}`);
  check(!/noindex/.test(src), `${file}: indexable`);
  check(src.includes('property="og:image"') && src.includes('name="twitter:card"'), `${file}: Open Graph and Twitter tags`);
  check((src.match(/<h1[\s>]/g) || []).length === 1, `${file}: exactly one h1`);
  const lds = [...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  check(lds.some((o) => o['@type'] === 'HomeAndConstructionBusiness') && lds.some((o) => o['@type'] === 'Organization'), `${file}: LocalBusiness and Organization schema`);
  check(!JSON.stringify(lds).includes('aggregateRating') && !JSON.stringify(lds).includes('"Review"'), `${file}: no rating or review schema`);
}
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(locs.length === expected.length - 1 && locs.every((u) => u.startsWith(DOMAIN + '/')), `sitemap: ${locs.length} URLs on the official domain`);
check(!locs.some((u) => u.includes('/admin')), 'sitemap: admin excluded');
const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
check(robots.includes(`Sitemap: ${DOMAIN}/sitemap.xml`) && robots.includes('Disallow: /admin') && robots.includes('Disallow: /api/'), 'robots.txt');
for (const b of BLOG) check(/"@type":"BlogPosting"/.test(html[`/blog/${b.slug}.html`]), `article schema: ${b.slug}`);

// 4. prices
const PRICES = { 'Kitchen Chimneys': 499, 'Built-in Hobs': 349, Cooktops: 249, Ovens: 449, 'Microwave Ovens': 449, Dishwashers: 449 };
for (const p of PRODUCTS) check(PRICES[p.name] === p.price, `price ${p.name} = ₹${PRICES[p.name]}`);
const pricing = text(html['/pricing.html']);
for (const [n, v] of Object.entries(PRICES)) check(pricing.includes(`${n} Service starting from ₹${v}`), `pricing page: ${n} from ₹${v}`);
check(pricing.includes(PRICE_NOTE), 'pricing note line');
check(/id="quote"/.test(html['/pricing.html']) && pricing.includes('Need a Custom Service Quote?') && /<form class="quote-form" action="\/contact" method="get">/.test(html['/pricing.html']), 'custom quote section posts to the contact form');

// 5. service areas: only spreadsheet data, searchable, excluded entries absent
const allText = [...Object.values(html), fs.readFileSync(path.join(ROOT, 'data/service-areas.json'), 'utf8')].join('\n');
for (const bad of ['KOLATHUR', '606402', 'MELMARUVATHUR', '679306']) check(!allText.toUpperCase().includes(bad), `excluded entry absent: ${bad}`);
const areasHtml = html['/areas.html'];
check((areasHtml.match(/class="loc-card/g) || []).length === AREAS.pincodes.length + AREAS.moreLocalities.length, 'service areas: one card per spreadsheet entry');
check(/<input id="area-q" type="search"/.test(areasHtml) && /id="area-empty"/.test(areasHtml), 'service areas: search box and empty state');

// 6. gallery counts
const counts = GALLERY.reduce((m, g) => ((m[g.cat] = (m[g.cat] || 0) + 1), m), {});
const WANT = { 'kitchen-chimneys': 7, 'built-in-hobs': 5, cooktops: 5, ovens: 5, 'microwave-ovens': 4, dishwashers: 4 };
for (const [c, n] of Object.entries(WANT)) check(counts[c] === n, `gallery: ${c} has ${n} images (found ${counts[c]})`);
check(counts.installation >= 2 && counts.maintenance >= 2, 'gallery: extra installation and maintenance images');
check(new Set(GALLERY.map((g) => g.image)).size === GALLERY.length, 'gallery: no repeated images');
check((html['/gallery.html'].match(/class="g-item/g) || []).length === GALLERY.length, 'gallery page renders every image');

// 7. home reviews fixed and independent; reviews page dynamic
const home = html['/index.html'];
check((home.match(/class="rv-card/g) || []).length === SAMPLE_REVIEWS.length && SAMPLE_REVIEWS.length === 10, 'home: ten review cards unchanged');
check(!/Sample reviews \(placeholders\)|placeholder reviews for layout/i.test(home), 'home: placeholder disclaimer removed');
check(!/api\/reviews/.test(home), 'home reviews do not call the reviews API');
check(/id="rvp-grid"/.test(html['/reviews.html']) && !/adm-/.test(html['/reviews.html']), 'reviews page: public grid, no admin controls');
// reviews page shows the same site reviews as Home, from the same data (no second copy anywhere)
const rvp = html['/reviews.html'];
const embedded = JSON.parse(rvp.match(/<script type="application\/json" id="rvp-data">([\s\S]*?)<\/script>/)[1]);
check(embedded.site.length === SAMPLE_REVIEWS.length, `reviews page: ${SAMPLE_REVIEWS.length} site reviews embedded`);
check((rvp.match(/class="rv-card/g) || []).length === SAMPLE_REVIEWS.length, 'reviews page: site reviews rendered without JavaScript');
for (const r of SAMPLE_REVIEWS) {
  const e = embedded.site.find((x) => x.name === r.name);
  check(e && e.text === r.text && e.rating === r.rating && e.category === r.product, `reviews page matches Home review: ${r.name}`);
  check(home.includes(r.text.replace(/'/g, '&#39;')) || home.includes(r.text), `home still shows: ${r.name}`);
}
const nonDataSources = [...fs.readdirSync(path.join(ROOT, 'migrations')).map((f) => path.join(ROOT, 'migrations', f)), path.join(ROOT, 'src/worker.js'), path.join(ROOT, 'assets/main.js')];
check(!nonDataSources.some((f) => fs.readFileSync(f, 'utf8').includes('Placeholder review text')), 'site reviews live only in data.mjs (single source)');
check(/id="adm-login"/.test(html['/admin.html']) && /admin\.[0-9a-f]{8}\.js/.test(html['/admin.html']), 'admin page and script');
check(!Object.entries(html).some(([f, s]) => f !== '/admin.html' && /admin\.[0-9a-f]{8}\.js/.test(s)), 'admin script only on the admin page');

// 8. brands, about, contact
check((home.match(/src="\/img\/brands\//g) || []).length >= 6, 'home: six brand logos');
check(/14 Years of Successful Service Experience/.test(html['/about.html']), 'about: 14 years highlighted');
const contact = html['/contact.html'];
check(/<input id="f-loc" name="location"[^>]*required[^>]*placeholder="Enter your location or paste your Google Maps link\."/.test(contact), 'contact: required Location field');
const key = contact.match(/data-key="([^"]*)"/)?.[1];
if (!key) check(contact.includes('Online enquiry form is not yet active'), 'contact: not-active notice while key is empty');
check(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(fs.readFileSync(path.join(ROOT, 'data.mjs'), 'utf8')), 'no Web3Forms key hard-coded');

// 9. no secrets in the shipped site or source
const shipped = walk(DIST).filter((f) => /\.(html|js|css|json|txt|xml)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
check(!/ADMIN_PASSWORD=|SESSION_SECRET=/.test(shipped), 'no admin secrets in dist/');
check(!/ADMIN_PASSWORD\s*[:=]\s*['"][^'"]+/.test(fs.readFileSync(path.join(ROOT, 'src/worker.js'), 'utf8')), 'no admin password in worker source');

console.log(`${ok.length} checks passed, ${fails.length} failed.`);
if (fails.length) { console.log(fails.map((f) => '  FAIL ' + f).join('\n')); process.exit(1); }
