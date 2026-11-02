// ============================================================================
//  build.mjs: generates the whole website into dist/
//  Usage: npm run build   (reads WEB3FORMS_ACCESS_KEY from .env when present)
//  Content lives in data.mjs; you should not need to edit this file to change text.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  SITE, PRODUCTS, SERVICES, SERVICE_TYPES, ENQUIRY_TYPES, PRICE_NOTE, BRANDS, BRANDS_NOTE, WHY, AREAS,
  GALLERY, GALLERY_CATS, GALLERY_LABELS, SAMPLE_REVIEWS, REVIEWS_PAGE, PAGE_META,
} from './data.mjs';
import { BLOG } from './data/blog.mjs';
import { icon } from './icons.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PHOTOS = path.join(ROOT, 'photos');

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* optional */ }

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'img', 'brands'), { recursive: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

// ---------- helpers ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => SITE.domain + (p === '/' ? '/' : p);
const wa = (msg = SITE.whatsappGreeting) => `https://wa.me/${SITE.whatsappDigits}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
const tel = `tel:+91${SITE.phoneLocal}`;
const mail = `mailto:${SITE.email}`;
const ext = 'target="_blank" rel="noopener"';
const hash = (s) => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);
const year = new Date().getFullYear();
const YEARS = SITE.experienceYears;
const contactUrl = (product, service) => {
  const q = [product && `product=${encodeURIComponent(product)}`, service && `service=${encodeURIComponent(service)}`].filter(Boolean).join('&');
  return `/contact${q ? '?' + q : ''}#enquiry`;
};

// ---------- images ----------
const IMG = {};
const WIDTHS = [480, 960, 1440, 1920];

async function processImages() {
  for (const file of fs.readdirSync(PHOTOS)) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
    const name = path.basename(file, ext);
    if (file === SITE.logoFile) continue; // handled separately
    const src = path.join(PHOTOS, file);
    if (!sharp) {
      fs.copyFileSync(src, path.join(DIST, 'img', file));
      IMG[name] = { src: `/img/${file}`, w: 1200, h: 900 };
      continue;
    }
    const meta = await sharp(src).rotate().metadata();
    if (meta.orientation >= 5) [meta.width, meta.height] = [meta.height, meta.width];
    const ws = WIDTHS.filter((w) => w <= meta.width);
    if (!ws.length) ws.push(meta.width);
    const set = [];
    for (const w of ws) {
      const out = `${name}-${w}.webp`;
      await sharp(src).rotate().resize({ width: w }).webp({ quality: 74 }).toFile(path.join(DIST, 'img', out));
      set.push([`/img/${out}`, w]);
    }
    IMG[name] = { src: set[Math.min(1, set.length - 1)][0], full: set[set.length - 1][0], srcset: set.map(([u, w]) => `${u} ${w}w`).join(', '), w: meta.width, h: meta.height };
  }
}

function pic(name, alt, { sizes = '(min-width: 1000px) 50vw, 100vw', eager = false, cls = '', pos = '' } = {}) {
  const im = IMG[name];
  if (!im) throw new Error(`Missing image: photos/${name}`);
  return `<img src="${im.src}"${im.srcset ? ` srcset="${im.srcset}" sizes="${sizes}"` : ''} width="${im.w}" height="${im.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''}${pos ? ` style="object-position:${pos}"` : ''}>`;
}

// ---------- logo (photos/logo.jpeg, used unedited: only resized) ----------
const LOGO = { src: '', srcset: '', w: 0, h: 0 };
async function processLogo() {
  const src = path.join(PHOTOS, SITE.logoFile);
  if (!fs.existsSync(src)) throw new Error(`Missing logo: photos/${SITE.logoFile}`);
  if (!sharp) {
    fs.copyFileSync(src, path.join(DIST, 'img', SITE.logoFile));
    Object.assign(LOGO, { src: `/img/${SITE.logoFile}`, w: 1254, h: 1254 });
    return;
  }
  const m = await sharp(src).metadata();
  const widths = [96, 192, 320, 640];
  for (const w of widths) await sharp(src).resize({ width: w }).webp({ quality: 90 }).toFile(path.join(DIST, 'img', `mm-enterprises-logo-${w}.webp`));
  Object.assign(LOGO, { src: '/img/mm-enterprises-logo-192.webp', srcset: widths.map((w) => `/img/mm-enterprises-logo-${w}.webp ${w}w`).join(', '), w: m.width, h: m.height });
  for (const [file, size] of [['favicon-32.png', 32], ['favicon-64.png', 64], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    await sharp(src).resize(size, size).png().toFile(path.join(DIST, file));
  }
  // link-preview image: logo centred on Midnight Blue (logo itself unchanged)
  const inner = await sharp(src).resize(560, 560).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: SITE.themeColor } })
    .composite([{ input: inner, top: 35, left: 320 }]).jpeg({ quality: 86 }).toFile(path.join(DIST, 'img', 'og-image.jpg'));
}
const logoImg = (sizes, lazy = false) => `<img src="${LOGO.src}"${LOGO.srcset ? ` srcset="${LOGO.srcset}" sizes="${sizes}"` : ''} alt="MM Enterprises logo" width="${LOGO.w}" height="${LOGO.h}"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;

// brand logos: copied unaltered from assets/brands/
const BRAND_DIMS = {};
async function processBrands() {
  for (const b of BRANDS) {
    const src = path.join(ROOT, 'assets', 'brands', b.logo);
    if (!fs.existsSync(src)) continue;
    fs.copyFileSync(src, path.join(DIST, 'img', 'brands', b.logo));
    if (sharp) { const m = await sharp(src).metadata(); BRAND_DIMS[b.logo] = [m.width, m.height]; }
  }
}
const brandLogo = (b) => {
  const d = BRAND_DIMS[b.logo];
  return d ? `<img src="/img/brands/${b.logo}" alt="${esc(b.name)} logo" width="${d[0]}" height="${d[1]}" loading="lazy" decoding="async">` : `<span class="wordmark">${esc(b.name)}</span>`;
};

// ---------- assets ----------
const CSS = fs.readFileSync(path.join(ROOT, 'assets/style.css'), 'utf8');
const JS = fs.readFileSync(path.join(ROOT, 'assets/main.js'), 'utf8');
const ADMIN_JS = fs.readFileSync(path.join(ROOT, 'assets/admin.js'), 'utf8');
const V = hash(CSS + JS + ADMIN_JS);
fs.writeFileSync(path.join(DIST, 'assets', `style.${V}.css`), CSS);
fs.writeFileSync(path.join(DIST, 'assets', `main.${V}.js`), JS);
fs.writeFileSync(path.join(DIST, 'assets', `admin.${V}.js`), ADMIN_JS);

// ---------- structured data (facts from data.mjs only) ----------
const DISTRICTS = [...new Set(AREAS.pincodes.map((r) => r.district))].map((d) => d.charAt(0) + d.slice(1).toLowerCase());
const ORG_LD = {
  '@context': 'https://schema.org', '@type': 'Organization', '@id': SITE.domain + '/#organization',
  name: SITE.name, url: SITE.domain + '/', logo: abs('/icon-512.png'), email: SITE.email,
  description: SITE.description,
  contactPoint: [{ '@type': 'ContactPoint', telephone: '+91-' + SITE.phoneLocal, contactType: 'customer service', areaServed: 'IN', availableLanguage: ['en', 'ta'] }],
};
const BUSINESS_LD = {
  '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': SITE.domain + '/#business',
  name: SITE.name, alternateName: 'MM Enterprises Kitchen Appliance Services', description: SITE.description,
  url: SITE.domain + '/', image: abs('/img/og-image.jpg'), logo: abs('/icon-512.png'),
  telephone: '+91' + SITE.phoneLocal, email: SITE.email, hasMap: SITE.googleMapsLink,
  address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
  areaServed: [{ '@type': 'City', name: SITE.city }, ...DISTRICTS.filter((d) => d !== 'Chennai').map((d) => ({ '@type': 'AdministrativeArea', name: `${d} district` }))],
  founder: { '@type': 'Person', name: SITE.proprietor },
  parentOrganization: { '@id': SITE.domain + '/#organization' },
  knowsAbout: [...PRODUCTS.map((p) => p.name), 'Appliance installation', 'Appliance repair', 'Appliance maintenance'],
  makesOffer: PRODUCTS.map((p) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: `${p.name} installation, repair and maintenance` } })),
};
const WEBSITE_LD = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE.domain + '/#website', name: SITE.name, alternateName: 'MM Enterprises Appliance Services', url: SITE.domain + '/', inLanguage: 'en-IN', publisher: { '@id': SITE.domain + '/#organization' } };
const crumbsLD = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(u) })) });

// ---------- shared UI ----------
const NAV = [['Home', '/'], ['About', '/about'], ['Services', '/services'], ['Pricing', '/pricing'], ['Gallery', '/gallery'], ['Service Areas', '/areas'], ['Blog', '/blog'], ['Reviews', '/reviews'], ['Contact', '/contact']];

const btn = (href, label, cls = 'btn-primary', extra = '') => `<a class="btn ${cls}" href="${href}"${extra ? ' ' + extra : ''}>${label}</a>`;
const arrowLink = (href, text, cls = '') => `<a class="link-arrow${cls ? ' ' + cls : ''}" href="${href}"><span>${esc(text)}</span>${icon('arrow', 'ic', 18)}</a>`;
const eyebrow = (t, cls = '') => `<p class="eyebrow${cls ? ' ' + cls : ''}">${esc(t)}</p>`;
const secHead = ({ label = '', title, lede = '', id = '', center = false, action = '' }) => `<header class="sec-head${center ? ' is-center' : ''}${action ? ' has-action' : ''}">
  <div>${label ? eyebrow(label) : ''}<h2${id ? ` id="${id}"` : ''}>${title}</h2>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>${action}
</header>`;

function header(active) {
  const on = (u) => (u === '/' ? active === '/' : active === u || active.startsWith(u + '/'));
  const cur = (u) => (on(u) ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-in">
    <a href="/" class="brand" aria-label="MM Enterprises, home">
      <span class="brand-tile">${logoImg('52px')}</span>
      <span class="brand-text" aria-hidden="true"><b>MM Enterprises</b><small>${esc(SITE.subtitle)}</small></span>
    </a>
    <nav class="nav" aria-label="Main">
      <ul>${NAV.map(([n, u]) => `<li><a href="${u}"${cur(u)}>${n}</a></li>`).join('')}</ul>
    </nav>
    <div class="header-actions">
      ${btn(contactUrl(), `Request a Service ${icon('arrow', 'ic', 16)}`, 'btn-primary btn-sm header-cta')}
      <button class="menu-btn" type="button" aria-controls="drawer" aria-expanded="false" aria-label="Open menu">${icon('menu', 'ic i-open', 22)}${icon('close', 'ic i-close', 22)}</button>
    </div>
  </div>
  <div class="drawer" id="drawer" hidden>
    <nav aria-label="Mobile"><ul>${NAV.map(([n, u]) => `<li><a href="${u}"${cur(u)}>${n}</a></li>`).join('')}</ul></nav>
    <div class="drawer-actions">
      ${btn(contactUrl(), 'Request a Service', 'btn-primary btn-block')}
      <div class="drawer-quick"><a href="${tel}">${icon('phone', 'ic', 18)} Call</a><a href="${wa()}" ${ext}>${icon('whatsapp', 'ic', 18)} WhatsApp</a></div>
    </div>
  </div>
</header>`;
}

const ctaBand = () => `
<section class="cta-band" aria-labelledby="cta-h">
  <div class="cta-bg" aria-hidden="true">${pic('kitchen-chimney-10', '', { sizes: '100vw' })}</div>
  <div class="wrap cta-in">
    <div class="cta-copy">
      ${eyebrow('Your kitchen deserves the best', 'on-dark')}
      <h2 id="cta-h">Let's Make Your Kitchen Work Better.</h2>
      <p>Book an installation, a repair or a routine service for your chimney, hob, cooktop, oven, microwave or dishwasher. Our Chennai team will call you back to fix a time.</p>
    </div>
    <div class="cta-actions">
      ${btn(contactUrl(), `Request a Service ${icon('arrow', 'ic', 18)}`, 'btn-warm btn-lg')}
      <a class="link-light" href="${tel}">${icon('phone', 'ic', 18)} Call ${esc(SITE.phone)}</a>
    </div>
  </div>
</section>`;

function footer() {
  return `
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div class="foot-brand">
      <a href="/" class="foot-logo">${logoImg('132px', true)}</a>
      <p>Kitchen appliance installation, repair and maintenance in ${esc(SITE.city)} for ${YEARS} years. Authorised service partner for Elica.</p>
    </div>
    <nav class="foot-col" aria-label="Quick links"><h2>Quick links</h2><ul>
      ${NAV.map(([n, u]) => `<li><a href="${u}">${n}</a></li>`).join('')}
    </ul></nav>
    <nav class="foot-col" aria-label="Products"><h2>Our products</h2><ul>
      ${PRODUCTS.map((p) => `<li><a href="/services#${p.slug}">${esc(p.name)}</a></li>`).join('')}
      <li><a href="/#brands">Brands we service</a></li>
    </ul></nav>
    <nav class="foot-col" aria-label="Services"><h2>Services</h2><ul>
      ${SERVICE_TYPES.map((s) => `<li><a href="${contactUrl('', s)}">${s}</a></li>`).join('')}
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/pricing#quote">Custom quote</a></li>
    </ul></nav>
    <div class="foot-col foot-contact"><h2>Contact us</h2><ul>
      <li>${icon('phone', 'ic', 18)}<a href="${tel}">${esc(SITE.phone)}</a></li>
      <li>${icon('whatsapp', 'ic', 18)}<a href="${wa()}" ${ext}>WhatsApp ${esc(SITE.whatsapp)}</a></li>
      <li>${icon('mail', 'ic', 18)}<a href="${mail}">${esc(SITE.email)}</a></li>
      <li>${icon('pin', 'ic', 18)}<a href="${SITE.googleMapsLink}" ${ext}>${esc(SITE.city)}, ${esc(SITE.region)}: open in Google Maps</a></li>
    </ul></div>
  </div>
  <div class="foot-base"><div class="wrap foot-base-in">
    <p>© ${year} ${esc(SITE.name)}, ${esc(SITE.city)}. All rights reserved.</p>
    <ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms and Conditions</a></li></ul>
  </div></div>
</footer>
<div class="fab" aria-label="Quick contact">
  <a class="fab-btn fab-mail" href="${mail}" aria-label="Email MM Enterprises">${icon('mail', 'ic', 24)}</a>
  <a class="fab-btn fab-wa" href="${wa()}" ${ext} aria-label="Chat with MM Enterprises on WhatsApp">${icon('whatsapp', 'ic', 30)}</a>
</div>`;
}

const FAVICON_LINKS = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">`;

function layout({ path: p, title, description, body, schema = [], ogImage, ogImageAlt, ogType = 'website', noindex = false, cta = true, bodyClass = '', scripts = [], bare = false }) {
  const og = abs(ogImage || '/img/og-image.jpg');
  const ogAlt = ogImageAlt || 'MM Enterprises, kitchen appliance services in Chennai';
  const ld = noindex ? '' : [ORG_LD, BUSINESS_LD, WEBSITE_LD, ...schema].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '' : `<link rel="canonical" href="${abs(p)}">\n`}<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="theme-color" content="${SITE.themeColor}">
<meta name="geo.region" content="IN-TN"><meta name="geo.placename" content="${esc(SITE.city)}">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="${esc(SITE.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${noindex ? '' : `<meta property="og:url" content="${abs(p)}">`}<meta property="og:image" content="${og}"><meta property="og:image:alt" content="${esc(ogAlt)}"><meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${og}"><meta name="twitter:image:alt" content="${esc(ogAlt)}">
${FAVICON_LINKS}
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.${V}.css">
<script>document.documentElement.classList.add('js')</script>
${ld}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(p)}
<main id="main">
${body}
</main>
${cta && !bare ? ctaBand() : ''}
${footer()}
<script src="/assets/main.${V}.js" defer></script>
${scripts.map((s) => `<script src="/assets/${s}.${V}.js" defer></script>`).join('\n')}
</body>
</html>`;
}

const breadcrumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([n, u], i) => i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${u}">${esc(n)}</a></li>`).join('')}</ol></nav>`;
const pageHero = ({ label = '', title, lede = '', crumbs, image = 'modern-kitchen-chimney-hob-hero', pos = '50% 50%', extra = '' }) => `<section class="page-hero">
  <div class="ph-bg" aria-hidden="true">${pic(image, '', { sizes: '100vw', eager: true, pos })}</div>
  <div class="wrap ph-in">
    ${breadcrumbs(crumbs)}
    ${label ? eyebrow(label, 'on-dark') : ''}<h1>${title}</h1>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
    ${extra}
  </div>
</section>`;

// ---------- pages ----------
const pages = [];
const add = (p, html) => pages.push([p, html]);
const productBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug);
const catLabel = (slug) => productBySlug(slug)?.name || GALLERY_LABELS[slug];
const rupee = (n) => `₹${n.toLocaleString('en-IN')}`;
const stockTag = '<span class="stock-tag">Representative image</span>';

const productCard = (p, i) => `<li class="prod-card reveal" style="--d:${i % 3}">
  <a href="/services#${p.slug}">
    <span class="prod-media">${pic(p.image, `${p.name} service in Chennai: ${p.alt}`, { sizes: '(min-width: 1100px) 380px, (min-width: 560px) 45vw, 92vw', pos: p.pos })}</span>
    <span class="prod-body">
      <span class="prod-ic">${icon(p.icon, 'ic', 22)}</span>
      <h3>${esc(p.name)}</h3>
      <span class="prod-text">${esc(p.short)}</span>
      <span class="prod-more">${esc(p.single.charAt(0).toUpperCase() + p.single.slice(1))} services ${icon('arrow', 'ic', 18)}</span>
    </span>
  </a>
</li>`;

const stars = (n) => `<span class="stars" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<svg viewBox="0 0 24 24" width="18" height="18" class="${i <= n ? 'on' : 'off'}"><path d="M12 2.8l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.2l-5.2 2.7 1-5.8L3.5 9l5.9-.9z"/></svg>`).join('')}</span>`;
const reviewCard = (r, i) => `<li class="rv-card reveal" style="--d:${i % 4}">
  <div class="rv-top">${stars(r.rating)}<span class="rv-num">${r.rating.toFixed(1)}<span class="sr"> out of 5</span></span></div>
  <blockquote><p>${esc(r.text)}</p></blockquote>
  <footer><span class="rv-av" aria-hidden="true">${esc(r.name.split(' ').pop()[0])}</span><span><strong>${esc(r.name)}</strong><small>${esc(r.product)}</small></span></footer>
</li>`;

// Home page reviews: fixed set from data.mjs, independent of the /reviews page.
const homeReviews = () => `
<section class="sec sec-light" aria-labelledby="rv-h">
  <div class="wrap">
    ${secHead({ label: 'Customer feedback', title: 'What Our Customers Say', id: 'rv-h', action: arrowLink('/reviews', 'Read all reviews') })}
    <ul class="rv-grid">${SAMPLE_REVIEWS.map(reviewCard).join('')}</ul>
  </div>
</section>`;

function home() {
  const preview = ['kitchen-chimney-09', 'built-in-hob-02', 'kitchen-chimney-05', 'kitchen-chimney-10', 'kitchen-chimney-01'].map((n) => GALLERY.find((g) => g.image === n));
  const elica = BRANDS.find((b) => b.authorised);
  const body = `
<section class="hero">
  <div class="hero-bg" aria-hidden="true">${pic('modern-kitchen-chimney-hob-hero', '', { sizes: '100vw', eager: true, pos: '62% 50%' })}</div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      ${eyebrow('Kitchen chimney and appliance service in Chennai', 'on-dark')}
      <h1 class="hero-title">Elevating Your <span>Kitchen</span> Experience.</h1>
      <p class="hero-text">MM Enterprises installs, repairs and maintains kitchen chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers for homes across Chennai.</p>
      <div class="btn-row">${btn('/services', `Explore Services ${icon('arrow', 'ic', 18)}`, 'btn-primary btn-lg')}${btn('/contact', 'Contact Us', 'btn-ghost btn-lg')}</div>
    </div>
  </div>
</section>

<section class="info-sec" aria-label="About our service at a glance">
  <div class="wrap">
    <ul class="info-grid">
      <li class="info-card reveal">
        <span class="info-badge">${icon('shield', 'ic', 26)}</span>
        <p class="info-kicker">Authorised service partner</p>
        <div class="info-logo">${brandLogo(elica)}</div>
        <h2>Elica authorised</h2>
        <p>Genuine Elica service from a team that knows these chimneys and hobs inside out.</p>
      </li>
      <li class="info-card reveal" style="--d:1">
        <span class="info-badge">${icon('tools', 'ic', 26)}</span>
        <p class="info-kicker">What we do</p>
        <h2>Installation, repair and maintenance</h2>
        <ul class="info-trio">
          ${SERVICES.map((s) => `<li><span>${icon(s.icon, 'ic', 20)}</span>${s.name}</li>`).join('')}
        </ul>
        <p>One team for every stage of your appliance's life.</p>
      </li>
      <li class="info-card reveal" style="--d:2">
        <span class="info-badge">${icon('pin', 'ic', 26)}</span>
        <p class="info-kicker">Where we work</p>
        <h2>${esc(SITE.city)}, ${esc(SITE.region)}</h2>
        <p>Serving homes across Chennai, Kanchipuram and Thiruvallur districts.</p>
        ${arrowLink('/areas', 'Check your area', 'on-dark')}
      </li>
    </ul>
  </div>
</section>

<section class="sec sec-white" aria-labelledby="about-h">
  <div class="wrap about-teaser">
    <figure class="at-media">
      ${pic('kitchen-chimney-11', 'Kitchen chimney with a curved glass hood installed by MM Enterprises in Chennai', { sizes: '(min-width: 900px) 40vw, 100vw', pos: '50% 35%' })}
      <figcaption class="at-badge"><b>${YEARS}+</b><span>years of appliance service</span></figcaption>
    </figure>
    <div class="at-copy">
      ${eyebrow('About MM Enterprises')}
      <h2 id="about-h">Excellence Beyond Expectations.</h2>
      <p>For ${YEARS} years we have been looking after kitchen appliances in Chennai homes. Most days that means fitting new chimneys and hobs, clearing grease from blowers and filters, and getting ovens, microwaves and dishwashers working properly again.</p>
      <p>We explain what we find, quote before we start and leave your kitchen clean.</p>
      ${arrowLink('/about', 'Discover Our Story')}
    </div>
  </div>
</section>

<section class="sec sec-light" id="products" aria-labelledby="prod-h">
  <div class="wrap">
    ${secHead({ label: 'Our product collections', title: 'Explore Our Product Collections', lede: 'Premium appliances for a modern lifestyle, and the service to keep them that way.', id: 'prod-h', center: true })}
    <ul class="prod-grid">${PRODUCTS.map(productCard).join('')}</ul>
  </div>
</section>

<section class="sec sec-dark" aria-labelledby="svc-h">
  <div class="wrap">
    ${secHead({ label: 'Our services', title: 'Professional Services You Can Trust', lede: 'Every visit follows the same simple approach: inspect, explain, fix and test.', id: 'svc-h', center: true })}
    <ul class="svc-grid">
      ${SERVICES.map((s, i) => `<li class="svc-card reveal" style="--d:${i}">
        <span class="svc-ic">${icon(s.icon, 'ic', 30)}</span>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.text)}</p>
        ${arrowLink(contactUrl('', s.name), `Book ${s.name.toLowerCase()}`, 'on-dark')}
      </li>`).join('')}
    </ul>
  </div>
</section>

<section class="sec brands-sec" id="brands" aria-labelledby="brand-h">
  <div class="wrap">
    ${secHead({ label: 'Brands we service', title: 'Expertise Across Leading Brands', id: 'brand-h', center: true })}
    <ul class="brand-grid">${BRANDS.map((b, i) => `<li class="brand-tile-card reveal${b.authorised ? ' is-auth' : ''}" style="--d:${i}"><span class="brand-plate">${brandLogo(b)}</span>${b.authorised ? '<span class="auth-tag">Authorised service partner</span>' : '<span class="brand-cap">Serviced by our team</span>'}</li>`).join('')}</ul>
    <p class="brand-note">${esc(BRANDS_NOTE)}</p>
  </div>
</section>

<section class="sec sec-white" aria-labelledby="why-h">
  <div class="wrap why">
    <div class="why-head">
      ${eyebrow('Why choose us')}
      <h2 id="why-h">Why Choose MM Enterprises?</h2>
      <p class="lede">A Chennai team that has spent ${YEARS} years in other people's kitchens, and still treats every one with care.</p>
      ${btn(contactUrl(), `Request a Service ${icon('arrow', 'ic', 18)}`, 'btn-warm')}
    </div>
    <ul class="why-list">${WHY.map((w, i) => `<li class="reveal" style="--d:${i}"><span class="why-ic">${icon(w.icon, 'ic', 24)}</span><div><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p></div></li>`).join('')}</ul>
  </div>
</section>

<section class="sec sec-dark" aria-labelledby="gal-h">
  <div class="wrap">
    ${secHead({ label: 'Gallery', title: 'Designed for Modern Living', id: 'gal-h', action: arrowLink('/gallery', 'View the full gallery', 'on-dark') })}
    <ul class="mosaic">${preview.map((g, i) => `<li class="m-${i} reveal" style="--d:${i}"><a href="/gallery">${pic(g.image, g.alt, { sizes: i === 0 ? '(min-width: 900px) 40vw, 100vw' : '(min-width: 900px) 25vw, 50vw' })}<span class="m-cap">${esc(g.title)}</span></a></li>`).join('')}</ul>
  </div>
</section>
${homeReviews()}`;
  add('/', layout({ path: '/', ...PAGE_META.home, body }));
}

function services() {
  const crumbs = [['Home', '/'], ['Services', '/services']];
  const body = `
${pageHero({ label: 'Our services', title: 'Kitchen Appliance Services in Chennai', lede: 'Installation, repair and maintenance for kitchen chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers, across all the major brands.', crumbs, image: 'kitchen-chimney-05', pos: '50% 35%' })}
<nav class="jump" aria-label="Appliances on this page"><div class="wrap"><ul>${PRODUCTS.map((p) => `<li><a href="#${p.slug}">${icon(p.icon, 'ic', 18)}${esc(p.name)}</a></li>`).join('')}</ul></div></nav>
${PRODUCTS.map((p, i) => {
  const post = BLOG.find((b) => b.product === p.slug);
  return `<section class="band ${i % 2 ? 'is-flip sec-dark' : 'sec-white'}" id="${p.slug}" aria-labelledby="h-${p.slug}">
  <div class="wrap band-in">
    <figure class="band-media reveal">
      ${pic(p.image, `${p.name} service in Chennai: ${p.alt}`, { sizes: '(min-width: 1000px) 44vw, 100vw', pos: p.pos })}
      <span class="band-price">From <b>${rupee(p.price)}</b></span>
      ${p.stock ? stockTag : ''}
    </figure>
    <div class="band-copy">
      <p class="band-num"><span>${String(i + 1).padStart(2, '0')}</span> / 06</p>
      <h2 id="h-${p.slug}">${esc(p.name)} Service in ${esc(SITE.city)}</h2>
      <p class="band-intro">${esc(p.intro)}</p>
      <div class="work">
        ${SERVICE_TYPES.map((t) => `<div class="work-col"><h3>${icon(t === 'Installation' ? 'install' : t === 'Repair' ? 'tools' : 'care', 'ic', 18)}${t}</h3><ul>${p.work[t].map((w) => `<li>${esc(w)}</li>`).join('')}</ul><a class="work-link" href="${contactUrl(p.name, t)}">Book ${t.toLowerCase()}<span class="sr"> for ${esc(p.single)}</span> ${icon('arrow', 'ic', 16)}</a></div>`).join('')}
      </div>
      <div class="btn-row">${btn(contactUrl(p.name), `Request ${esc(p.single)} service ${icon('arrow', 'ic', 18)}`, 'btn-primary')}${post ? arrowLink(`/blog/${post.slug}`, `${p.single.charAt(0).toUpperCase() + p.single.slice(1)} care guide`, i % 2 ? 'on-dark' : '') : ''}</div>
    </div>
  </div>
</section>`;
}).join('\n')}
<section class="sec sec-light"><div class="wrap note-strip">
  <p><strong>Service charges:</strong> ${esc(PRICE_NOTE)}</p>${arrowLink('/pricing', 'See starting prices and request a quote')}
</div></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Kitchen appliance services in Chennai', itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Service', name: `${p.name} installation, repair and maintenance`, serviceType: `${p.name} service`, description: p.intro, provider: { '@id': SITE.domain + '/#business' }, areaServed: { '@type': 'City', name: SITE.city }, url: abs(`/services#${p.slug}`) } })) };
  add('/services', layout({ path: '/services', ...PAGE_META.services, body, schema: [crumbsLD(crumbs), ld] }));
}

function pricing() {
  const crumbs = [['Home', '/'], ['Pricing', '/pricing']];
  const body = `
${pageHero({ label: 'Our pricing', title: 'Service Charges and Quotes', lede: 'Clear starting prices for every appliance we service, and a quick way to ask for a quote when your job is different.', crumbs, image: 'built-in-hob-01' })}
<section class="sec sec-light"><div class="wrap">
  <ul class="price-grid">${PRODUCTS.map((p, i) => `<li class="price-card reveal" style="--d:${i % 3}">
    <div class="pc-media">${pic(p.image, `${p.name} service in Chennai: ${p.alt}`, { sizes: '(min-width: 1100px) 380px, (min-width: 640px) 45vw, 92vw', pos: p.pos })}<span class="pc-ic">${icon(p.icon, 'ic', 22)}</span></div>
    <div class="pc-body">
      <h2>${esc(p.name)}</h2>
      <p class="pc-price"><span class="pc-from">Service starting from</span> <span class="pc-fig">${rupee(p.price)}</span></p>
      <p class="pc-types">${SERVICE_TYPES.join(' · ')}</p>
      <div class="pc-actions">${btn(contactUrl(p.name), `Book now<span class="sr"> for ${esc(p.single)}</span>`, 'btn-primary btn-sm')}${arrowLink(`/services#${p.slug}`, 'What is included', 'sm')}</div>
    </div>
  </li>`).join('')}</ul>
  <p class="price-note">${icon('shield', 'ic', 20)}<span>${esc(PRICE_NOTE)}</span></p>
</div></section>
<section class="sec quote-sec" id="quote" aria-labelledby="quote-h"><div class="wrap quote-in">
  <div class="quote-copy">
    ${eyebrow('Custom quotes', 'on-dark')}
    <h2 id="quote-h">Need a Custom Service Quote?</h2>
    <p>Not every job fits a fixed price. The charge can change with the appliance type, the brand and model, the work involved and what we find when we inspect it. Tell us what you need and we will come back with a clear quote.</p>
    <ul class="quote-points">
      <li>${icon('check', 'ic', 18)}Installations that need extra ducting or fitting work</li>
      <li>${icon('check', 'ic', 18)}Faults that need inspection before we can price them</li>
      <li>${icon('check', 'ic', 18)}More than one appliance in the same visit</li>
    </ul>
  </div>
  <form class="quote-form" action="/contact" method="get">
    <input type="hidden" name="service" value="Custom quote">
    <div class="field"><label for="q-product">Appliance</label><select id="q-product" name="product"><option value="">Choose an appliance</option>${PRODUCTS.map((p) => `<option>${esc(p.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="q-msg">What do you need?</label><textarea id="q-msg" name="message" rows="3" placeholder="For example: new chimney installation with a longer duct" maxlength="600"></textarea></div>
    <button type="submit" class="btn btn-warm btn-lg btn-block">Request a Quote ${icon('arrow', 'ic', 18)}</button>
    <p class="quote-alt">Prefer to talk? <a href="${tel}">Call ${esc(SITE.phone)}</a> or <a href="${wa('Hello MM Enterprises, I would like a quote for my appliance.')}" ${ext}>WhatsApp us</a>.</p>
  </form>
</div></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'OfferCatalog', name: 'Kitchen appliance service charges in Chennai', itemListElement: PRODUCTS.map((p) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: `${p.name} service`, provider: { '@id': SITE.domain + '/#business' } }, priceSpecification: { '@type': 'PriceSpecification', minPrice: p.price, priceCurrency: 'INR' } })) };
  add('/pricing', layout({ path: '/pricing', ...PAGE_META.pricing, body, schema: [crumbsLD(crumbs), ld] }));
}

function areas() {
  const crumbs = [['Home', '/'], ['Service Areas', '/areas']];
  const order = [...new Set(AREAS.pincodes.map((r) => r.district))];
  const title = (d) => d.charAt(0) + d.slice(1).toLowerCase();
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const pinCards = AREAS.pincodes.map((r) => `<li class="loc-card" data-group="${r.district.toLowerCase()}" data-search="${esc(norm(r.pincode + ' ' + r.localities.join(' ') + ' ' + r.district))}">
    <span class="loc-pin">${icon('pin', 'ic', 18)}${esc(r.pincode)}</span>
    <p class="loc-names">${r.localities.map(esc).join(', ')}</p>
    <span class="loc-dist">${title(r.district)} district</span>
  </li>`).join('');
  const moreCards = AREAS.moreLocalities.map((l) => `<li class="loc-card is-more" data-group="more" data-search="${esc(norm(l.name + ' ' + l.pincode))}">
    <span class="loc-pin">${icon('pin', 'ic', 18)}${esc(l.pincode)}</span>
    <p class="loc-names">${esc(l.name)}</p>
    <span class="loc-dist">More localities</span>
  </li>`).join('');
  const counts = Object.fromEntries(order.map((d) => [d, AREAS.pincodes.filter((r) => r.district === d).length]));
  const total = AREAS.pincodes.length + AREAS.moreLocalities.length;
  const body = `
<section class="page-hero areas-hero">
  <div class="ph-bg" aria-hidden="true">${pic('kitchen-chimney-09', '', { sizes: '100vw', eager: true, pos: '50% 40%' })}</div>
  <svg class="geo-lines" viewBox="0 0 600 400" aria-hidden="true" focusable="false"><path d="M40 320 C140 260 180 300 250 220 S380 120 470 160 560 90 600 60" /><path d="M0 200 C90 180 150 230 230 170 S360 60 450 90" /><circle cx="250" cy="220" r="6"/><circle cx="470" cy="160" r="6"/><circle cx="140" cy="276" r="5"/><circle cx="380" cy="128" r="5"/></svg>
  <div class="wrap ph-in">
    ${breadcrumbs(crumbs)}
    ${eyebrow('Service areas', 'on-dark')}
    <h1>Find Your Service Area</h1>
    <p class="lede">We serve ${AREAS.pincodes.length} pincodes across Chennai, Kanchipuram and Thiruvallur districts, plus ${AREAS.moreLocalities.length} more localities. Search for your area or pincode below.</p>
    <form class="area-search" role="search" onsubmit="return false">
      <label for="area-q" class="sr">Search by locality or pincode</label>
      ${icon('search', 'ic', 22)}
      <input id="area-q" type="search" placeholder="Locality or pincode, e.g. Adyar or 600020" autocomplete="off" aria-controls="loc-grid" aria-describedby="area-count">
      <button type="button" class="area-clear" aria-label="Clear search" hidden>${icon('close', 'ic', 18)}</button>
    </form>
  </div>
</section>
<section class="sec sec-light areas-sec" aria-label="Service locations"><div class="wrap">
  <div class="area-tabs" role="group" aria-label="Filter by district">
    <button type="button" class="area-tab" data-group="all" aria-pressed="true">All areas <span>${total}</span></button>
    ${order.map((d) => `<button type="button" class="area-tab" data-group="${d.toLowerCase()}" aria-pressed="false">${title(d)} <span>${counts[d]}</span></button>`).join('')}
    <button type="button" class="area-tab" data-group="more" aria-pressed="false">More localities <span>${AREAS.moreLocalities.length}</span></button>
  </div>
  <p class="area-count" id="area-count" role="status" aria-live="polite">Showing all ${total} locations</p>
  <ul class="loc-grid" id="loc-grid">${pinCards}${moreCards}</ul>
  <div class="area-empty" id="area-empty" hidden>
    <span class="empty-ic">${icon('pin', 'ic', 30)}</span>
    <h2>We couldn't find that area in our list</h2>
    <p>That doesn't always mean we can't help. Send us your locality and we will let you know.</p>
    <div class="btn-row">${btn(wa('Hello MM Enterprises, do you serve my area? My locality and pincode: '), `${icon('whatsapp', 'ic', 20)} Ask on WhatsApp`, 'btn-primary', ext)}${btn(tel, `${icon('phone', 'ic', 20)} Call ${esc(SITE.phone)}`, 'btn-secondary')}${btn(contactUrl(), 'Send an enquiry', 'btn-secondary')}</div>
  </div>
</div></section>
<section class="sec sec-dark"><div class="wrap price-help">
  <div>${eyebrow('Not on the list?', 'on-dark')}<h2>Not sure if we cover your area? Call or WhatsApp us.</h2></div>
  <div class="btn-row">${btn(tel, `${icon('phone', 'ic', 20)} Call ${esc(SITE.phone)}`, 'btn-primary btn-lg')}${btn(wa('Hello MM Enterprises, do you serve my area? My locality and pincode: '), `${icon('whatsapp', 'ic', 20)} WhatsApp us`, 'btn-ghost btn-lg', ext)}</div>
</div></section>`;
  add('/areas', layout({ path: '/areas', ...PAGE_META.areas, body, schema: [crumbsLD(crumbs)] }));
}

function gallery() {
  const crumbs = [['Home', '/'], ['Gallery', '/gallery']];
  const count = (c) => GALLERY.filter((g) => g.cat === c).length;
  const body = `
${pageHero({ label: 'Gallery', title: 'Designed for Modern Living', lede: 'Chimney and hob installations from our own jobs in Chennai, along with the cooktops, ovens, microwaves and dishwashers we look after.', crumbs, image: 'kitchen-chimney-01', pos: '50% 30%' })}
<section class="sec sec-dark gallery-sec"><div class="wrap">
  <div class="g-filters" role="group" aria-label="Filter gallery">
    <button type="button" class="g-chip" data-filter="all" aria-pressed="true">All <span>${GALLERY.length}</span></button>
    ${GALLERY_CATS.map((c) => `<button type="button" class="g-chip" data-filter="${c}" aria-pressed="false">${esc(catLabel(c))} <span>${count(c)}</span></button>`).join('')}
  </div>
  <p class="sr" id="g-status" role="status" aria-live="polite"></p>
  <ul class="g-grid">${GALLERY.map((g, i) => `<li class="g-item reveal" data-cat="${g.cat}" style="--d:${i % 3}">
    <button type="button" class="g-card" data-full="${IMG[g.image].full}" data-title="${esc(g.title)}" data-cat="${esc(catLabel(g.cat))}" data-alt="${esc(g.alt)}"${g.stock ? ' data-stock="1"' : ''} aria-label="View larger: ${esc(g.title)}">
      ${pic(g.image, g.alt, { sizes: '(min-width: 1100px) 380px, (min-width: 640px) 45vw, 92vw' })}
      <span class="g-cap"><span class="g-cat">${esc(catLabel(g.cat))}</span><span class="g-title">${esc(g.title)}</span>${g.stock ? '<span class="g-rep">Representative image</span>' : ''}</span>
      <span class="g-zoom" aria-hidden="true">${icon('arrowUpRight', 'ic', 18)}</span>
    </button>
  </li>`).join('')}</ul>
</div></section>
<dialog class="lb" id="lb" aria-labelledby="lb-title">
  <div class="lb-in">
    <button type="button" class="lb-btn lb-x" aria-label="Close">${icon('close', 'ic', 22)}</button>
    <figure><img id="lb-img" alt=""><figcaption><span class="lb-cat" id="lb-cat"></span><span id="lb-title" class="lb-title"></span><span class="lb-rep" id="lb-rep" hidden>Representative image</span><span class="lb-count" id="lb-count"></span></figcaption></figure>
    <button type="button" class="lb-btn lb-prev" aria-label="Previous image">${icon('chevronLeft', 'ic', 24)}</button>
    <button type="button" class="lb-btn lb-next" aria-label="Next image">${icon('chevronRight', 'ic', 24)}</button>
  </div>
</dialog>`;
  add('/gallery', layout({ path: '/gallery', ...PAGE_META.gallery, body, schema: [crumbsLD(crumbs)] }));
}

function about() {
  const crumbs = [['Home', '/'], ['About', '/about']];
  const body = `
${pageHero({ label: 'About us', title: 'About MM Enterprises', lede: `${YEARS} years of kitchen appliance installation, repair and maintenance in ${SITE.city}.`, crumbs, image: 'kitchen-chimney-07', pos: '50% 30%' })}
<section class="sec sec-white"><div class="wrap about-intro">
  <div class="prose">
    ${eyebrow('Who we are')}
    <h2>A Chennai kitchen appliance service company</h2>
    <p>MM Enterprises looks after the appliances at the heart of a modern kitchen: chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers. We are an authorised service partner for Elica, and we also service Butterfly, Bosch, LG, Siemens and Whirlpool appliances.</p>
    <p>Our work covers the whole life of an appliance. We install it properly, repair it when something goes wrong, and keep it running with regular maintenance.</p>
    <p>Our approach is simple. We find out what is really wrong, explain the work involved, and carry it out carefully, with respect for your home and your time.</p>
  </div>
  <figure class="team-photo reveal">${pic('mm-enterprises-team-chennai', 'The MM Enterprises kitchen appliance service team in Chennai', { sizes: '(min-width: 1000px) 520px, 100vw', pos: '50% 42%' })}<figcaption>The MM Enterprises team</figcaption></figure>
</div></section>

<section class="sec exp-sec" aria-labelledby="exp-h"><div class="wrap exp-in">
  <div class="exp-figure reveal" aria-hidden="true"><b>${YEARS}<sup>+</sup></b><span>years</span></div>
  <div class="exp-copy">
    ${eyebrow('Our experience', 'on-dark')}
    <h2 id="exp-h">${YEARS} Years of Successful Service Experience</h2>
    <p>For ${YEARS} years, MM Enterprises has been installing, repairing and maintaining kitchen appliances in homes across Chennai. That time has taught us how these appliances are used in Indian kitchens, and where they tend to need help.</p>
    <ul class="exp-list">
      <li>${icon('chimney', 'ic', 20)}<span><b>Kitchen chimneys:</b> installation at the right height and duct route, filter and blower cleaning, and suction repairs.</span></li>
      <li>${icon('hob', 'ic', 20)}<span><b>Built-in hobs and cooktops:</b> careful fitting, burner and ignition servicing, and surface care.</span></li>
      <li>${icon('oven', 'ic', 20)}<span><b>Ovens and microwaves:</b> heating faults, door and seal problems, and thorough cleaning.</span></li>
      <li>${icon('dishwasher', 'ic', 20)}<span><b>Dishwashers:</b> drainage problems, filter cleaning and new connections.</span></li>
      <li>${icon('tools', 'ic', 20)}<span><b>Troubleshooting and repair:</b> finding the real cause of a fault before replacing anything.</span></li>
      <li>${icon('care', 'ic', 20)}<span><b>Preventive maintenance:</b> routine care that helps appliances last longer.</span></li>
    </ul>
    <p>Through all of it, the aim has stayed the same: customers who are happy with the work and comfortable calling us again.</p>
  </div>
</div></section>

<section class="sec sec-light"><div class="wrap proprietor">
  <figure class="prop-photo reveal">${pic('manikandan-proprietor-mm-enterprises', 'Manikandan, proprietor of MM Enterprises, Chennai', { sizes: '(min-width: 900px) 400px, 90vw', pos: '50% 20%' })}</figure>
  <div class="prop-copy">
    ${eyebrow('Proprietor')}
    <h2>${esc(SITE.proprietor)}</h2>
    <p class="prop-role">Proprietor, MM Enterprises</p>
    <p>MM Enterprises is led by ${esc(SITE.proprietor)}, who oversees the company's installation, repair and maintenance work. His focus is simple: careful workmanship and dependable support for every customer who calls.</p>
    <div class="btn-row">${btn(tel, `${icon('phone', 'ic', 20)} Call ${esc(SITE.phone)}`, 'btn-primary')}${btn(wa(), `${icon('whatsapp', 'ic', 20)} WhatsApp`, 'btn-secondary', ext)}</div>
  </div>
</div></section>

<section class="sec sec-white"><div class="wrap">
  ${secHead({ label: 'What we focus on', title: 'What We Focus On', id: 'focus-h', center: true })}
  <ul class="focus-grid">
    <li class="reveal"><span class="why-ic">${icon('chimney', 'ic', 24)}</span><h3>Kitchen appliances only</h3><p>Chimneys, hobs, cooktops, ovens, microwave ovens and dishwashers. This is all we do.</p></li>
    <li class="reveal" style="--d:1"><span class="why-ic">${icon('shield', 'ic', 24)}</span><h3>Elica authorised</h3><p>An authorised service partner for Elica, with experience across other leading brands.</p></li>
    <li class="reveal" style="--d:2"><span class="why-ic">${icon('tools', 'ic', 24)}</span><h3>Install, repair, maintain</h3><p>Setting appliances up properly, putting faults right and keeping them running well.</p></li>
    <li class="reveal" style="--d:3"><span class="why-ic">${icon('response', 'ic', 24)}</span><h3>Easy to reach</h3><p>Phone, WhatsApp or email, with clear updates from your first call to the finished job.</p></li>
  </ul>
</div></section>`;
  add('/about', layout({ path: '/about', ...PAGE_META.about, body, schema: [crumbsLD(crumbs)], ogImage: IMG['mm-enterprises-team-chennai'].src, ogImageAlt: 'The MM Enterprises team' }));
}

function contact() {
  const crumbs = [['Home', '/'], ['Contact', '/contact']];
  const keySet = Boolean(SITE.web3formsKey);
  const field = (id, label, input, iconName, opt = false) => `<div class="field${['f-email', 'f-loc', 'f-msg'].includes(id) ? ' full' : ''}"><label for="${id}">${label} ${opt ? '<span class="opt">(optional)</span>' : '<span class="req" aria-hidden="true">*</span>'}</label><div class="input-wrap">${icon(iconName, 'ic in-ic', 18)}${input}</div><span class="err" id="e-${id.slice(2)}"></span></div>`;
  const body = `
${pageHero({ label: 'Contact', title: 'Contact MM Enterprises', lede: 'Call, WhatsApp or email us, or send a service request with your appliance details and location.', crumbs, image: 'built-in-hob-02' })}
<section class="sec contact-sec"><div class="wrap contact">
  <div class="contact-side">
    <ul class="c-cards">
      <li><span class="c-ic">${icon('phone', 'ic', 22)}</span><div><h2>Phone</h2><a href="${tel}">${esc(SITE.phone)}</a></div></li>
      <li><span class="c-ic is-wa">${icon('whatsapp', 'ic', 22)}</span><div><h2>WhatsApp</h2><a href="${wa()}" ${ext}>${esc(SITE.whatsapp)}</a></div></li>
      <li><span class="c-ic">${icon('mail', 'ic', 22)}</span><div><h2>Email</h2><a href="${mail}">${esc(SITE.email)}</a></div></li>
      <li><span class="c-ic">${icon('pin', 'ic', 22)}</span><div><h2>Location</h2><p>${esc(SITE.city)}, ${esc(SITE.region)}</p><a href="${SITE.googleMapsLink}" ${ext}>Open in Google Maps ${icon('external', 'ic', 16)}</a></div></li>
    </ul>
  </div>
  <div class="form-card" id="enquiry">
    <div class="form-head"><h2>Request a service</h2><p>Tell us about your appliance and where you are. We will call you back to discuss it.</p></div>
    ${keySet ? '' : `<div class="form-inactive" role="note">${icon('phone', 'ic', 20)}<p><strong>Online enquiry form is not yet active.</strong> Please call <a href="${tel}">${esc(SITE.phone)}</a> or WhatsApp <a href="${wa()}" ${ext}>${esc(SITE.whatsapp)}</a>.</p></div>`}
    <form id="enquiry-form" class="enquiry" novalidate data-key="${esc(SITE.web3formsKey)}">
      <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      ${field('f-name', 'Name', '<input id="f-name" name="name" autocomplete="name" required aria-describedby="e-name">', 'person')}
      ${field('f-phone', 'Phone', '<input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="e-phone">', 'phone')}
      ${field('f-email', 'Email', '<input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="e-email">', 'mail', true)}
      ${field('f-loc', 'Location', '<input id="f-loc" name="location" autocomplete="street-address" required placeholder="Enter your location or paste your Google Maps link." aria-describedby="e-loc" maxlength="500">', 'pin')}
      ${field('f-product', 'Product', `<select id="f-product" name="product" required aria-describedby="e-product"><option value="">Choose a product</option>${PRODUCTS.map((p) => `<option>${esc(p.name)}</option>`).join('')}</select>`, 'chimney')}
      ${field('f-service', 'Service type', `<select id="f-service" name="service" required aria-describedby="e-service"><option value="">Choose a service</option>${ENQUIRY_TYPES.map((s) => `<option>${s}</option>`).join('')}</select>`, 'tools')}
      ${field('f-msg', 'Message', '<textarea id="f-msg" name="message" rows="4" required placeholder="Brand, model and what you need help with" aria-describedby="e-msg" maxlength="2000"></textarea>', 'mail')}
      <div class="full form-actions"><button type="submit" class="btn btn-warm btn-lg" id="f-submit">Send request ${icon('arrow', 'ic', 18)}</button><p class="form-note"><span aria-hidden="true">*</span> Required</p></div>
      <div class="full form-status" id="form-status" role="status" aria-live="polite" tabindex="-1"></div>
    </form>
  </div>
</div></section>`;
  add('/contact', layout({ path: '/contact', ...PAGE_META.contact, body, schema: [crumbsLD(crumbs)] }));
}

function reviews() {
  const crumbs = [['Home', '/'], ['Reviews', '/reviews']];
  // Same SAMPLE_REVIEWS data as the Home page: rendered here (works without JavaScript) and handed to main.js,
  // which merges in any reviews published through /admin.
  const site = REVIEWS_PAGE.siteReviews ? SAMPLE_REVIEWS : [];
  const siteData = site.map((r) => ({ name: r.name, initial: r.name.split(' ').pop()[0], rating: r.rating, text: r.text, category: r.product, source: 'site' }));
  const cats = [...new Set(site.map((r) => r.product))];
  const body = `
${pageHero({ label: 'Reviews', title: 'Customer Reviews', lede: 'What customers say after we have installed, repaired or serviced their kitchen appliances.', crumbs, image: 'kitchen-chimney-04', pos: '50% 35%' })}
<section class="sec sec-light reviews-page" aria-labelledby="rvp-h"><div class="wrap">
  <h2 id="rvp-h" class="sr">Published reviews</h2>
  <div class="rvp-bar">
    <div class="g-filters rvp-filters" role="group" aria-label="Filter reviews by service" id="rvp-filters"><button type="button" class="g-chip" data-filter="all" aria-pressed="true">All <span>${site.length}</span></button>${cats.map((c) => `<button type="button" class="g-chip" data-filter="${esc(c)}" aria-pressed="false">${esc(c)} <span>${site.filter((r) => r.product === c).length}</span></button>`).join('')}</div>
    <label class="rvp-sort"><span>Sort by</span><select id="rvp-sort"><option value="custom">Featured</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="high">Highest rating</option><option value="low">Lowest rating</option></select></label>
  </div>
  <p class="rvp-status" id="rvp-status" role="status" aria-live="polite">${site.length ? `Showing ${site.length} of ${site.length} reviews` : 'Loading reviews…'}</p>
  <ul class="rv-grid rvp-grid" id="rvp-grid">${site.map(reviewCard).join('')}</ul>
  <div class="rvp-more"><button type="button" class="btn btn-secondary" id="rvp-more" hidden>Load more reviews</button></div>
  <script type="application/json" id="rvp-data">${JSON.stringify({ site: siteData, admin: REVIEWS_PAGE.adminReviews }).replace(/</g, '\\u003c')}</script>
  <div class="rvp-note">
    <p>Reviews on this page are shared with us directly by customers and published by our team. They are not imported from Google.</p>
    ${arrowLink(SITE.googleMapsLink, 'See MM Enterprises on Google Maps')}
  </div>
</div></section>`;
  add('/reviews', layout({ path: '/reviews', ...PAGE_META.reviews, body, schema: [crumbsLD(crumbs)] }));
}

function admin() {
  const body = `
<section class="sec sec-light admin-sec"><div class="wrap">
  <div id="adm-login" class="adm-card adm-login" hidden>
    <h1>Reviews admin</h1>
    <p>Sign in to manage the reviews shown on the Reviews page.</p>
    <form id="adm-login-form" novalidate>
      <div class="field"><label for="adm-pw">Password</label><input id="adm-pw" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>
  </div>
  <div id="adm-app" hidden>
    <header class="adm-head"><div><h1>Reviews admin</h1><p>Changes appear on the <a href="/reviews" target="_blank" rel="noopener">Reviews page</a> once a review is published. The Home page reviews are separate and are not changed here.</p></div><div class="btn-row"><button class="btn btn-primary" id="adm-new" type="button">Add review</button><button class="btn btn-secondary" id="adm-logout" type="button">Sign out</button></div></header>
    <div class="adm-tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="reviews" id="tab-reviews" aria-controls="pane-reviews">Reviews</button><button role="tab" aria-selected="false" data-tab="cats" id="tab-cats" aria-controls="pane-cats">Categories</button></div>
    <div id="pane-reviews" role="tabpanel" aria-labelledby="tab-reviews"><ul class="adm-list" id="adm-list"></ul></div>
    <div id="pane-cats" role="tabpanel" aria-labelledby="tab-cats" hidden>
      <form id="adm-cat-form" class="adm-inline"><label for="adm-cat-name" class="sr">New category name</label><input id="adm-cat-name" maxlength="40" placeholder="New category name"><button class="btn btn-primary btn-sm" type="submit">Add category</button></form>
      <ul class="adm-cats" id="adm-cats"></ul>
    </div>
  </div>
  <dialog class="adm-dialog" id="adm-dialog" aria-labelledby="adm-dlg-title">
    <form id="adm-form" method="dialog" novalidate>
      <h2 id="adm-dlg-title">Add review</h2>
      <div class="field"><label for="r-name">Customer name</label><input id="r-name" maxlength="80" required></div>
      <div class="adm-row">
        <div class="field"><label for="r-rating">Rating</label><select id="r-rating">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${n} star${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
        <div class="field"><label for="r-date">Review date</label><input id="r-date" type="date" required></div>
      </div>
      <div class="field"><label for="r-cat">Category</label><select id="r-cat"></select></div>
      <div class="field"><label for="r-text">Review</label><textarea id="r-text" rows="5" maxlength="1500" required></textarea></div>
      <label class="adm-check"><input type="checkbox" id="r-pub"> Published (visible on the Reviews page)</label>
      <p class="adm-err" id="adm-form-err" role="alert"></p>
      <div class="btn-row"><button class="btn btn-primary" type="submit" id="adm-save">Save</button><button class="btn btn-secondary" type="button" id="adm-cancel">Cancel</button></div>
    </form>
  </dialog>
  <div class="adm-toast" id="adm-toast" role="status" aria-live="polite"></div>
</div></section>`;
  add('/admin', layout({ path: '/admin', ...PAGE_META.admin, body, noindex: true, bare: true, bodyClass: 'is-admin', scripts: ['admin'] }));
}

function blog() {
  const crumbs = [['Home', '/'], ['Blog', '/blog']];
  const body = `
${pageHero({ label: 'Blog', title: 'Kitchen Appliance Care Guides', lede: 'Practical advice from our service team on looking after your chimney, hob, cooktop, oven, microwave and dishwasher, and on when to call a technician.', crumbs, image: 'kitchen-chimney-02', pos: '50% 40%' })}
<section class="sec sec-light"><div class="wrap">
  <ul class="post-grid">${BLOG.map((b, i) => `<li class="post-card reveal" style="--d:${i % 3}">
    <a class="post-media" href="/blog/${b.slug}" tabindex="-1" aria-hidden="true">${pic(b.image, b.alt, { sizes: '(min-width: 1100px) 380px, (min-width: 640px) 45vw, 92vw', pos: productBySlug(b.product).pos })}<span class="post-tag">${icon(productBySlug(b.product).icon, 'ic', 16)}${esc(productBySlug(b.product).name)}</span></a>
    <div class="post-body">
      <h2><a href="/blog/${b.slug}">${esc(b.title)}</a></h2>
      <p>${esc(b.description)}</p>
      ${arrowLink(`/blog/${b.slug}`, 'Read article')}
    </div>
  </li>`).join('')}</ul>
</div></section>`;
  add('/blog', layout({ path: '/blog', ...PAGE_META.blog, body, schema: [crumbsLD(crumbs)] }));

  for (const b of BLOG) {
    const p = productBySlug(b.product);
    const path_ = `/blog/${b.slug}`;
    const cr = [['Home', '/'], ['Blog', '/blog'], [b.title, path_]];
    const list = (items) => `<ul class="ticks">${items.map((t) => `<li>${icon('check', 'ic', 18)}<span>${esc(t)}</span></li>`).join('')}</ul>`;
    const others = BLOG.filter((x) => x !== b).slice(0, 3);
    const body = `
<article class="article">
  <header class="art-head"><div class="ph-bg" aria-hidden="true">${pic(b.image, '', { sizes: '100vw', eager: true, pos: p.pos })}</div><div class="wrap ph-in">
    ${breadcrumbs(cr)}
    <p class="eyebrow on-dark">${esc(p.name)} care guide</p>
    <h1>${esc(b.title)}</h1>
  </div></header>
  <div class="wrap art-in">
    <div class="art-main prose">
      <p class="art-intro">${esc(b.intro)}</p>
      <figure class="art-fig">${pic(b.image, b.alt, { sizes: '(min-width: 1000px) 720px, 100vw', pos: p.pos })}</figure>
      <h2>Understanding your ${esc(p.single)}</h2>${b.overview.map((t) => `<p>${esc(t)}</p>`).join('')}
      <h2>Common uses and benefits</h2>${list(b.uses)}
      <h2>Features and things to consider</h2>${list(b.considerations)}
      <h2>Common ${esc(p.single)} problems</h2>
      <dl class="problems">${b.problems.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
      <h2>Cleaning and care tips</h2>${list(b.care)}
      <h2>When to call a professional</h2>${list(b.professional)}
      <div class="art-cta">
        <h2>Need ${esc(p.single)} service in ${esc(SITE.city)}?</h2>
        <p>MM Enterprises installs, repairs and maintains ${esc(p.name.toLowerCase())} across Chennai. Service starts from ${rupee(p.price)}.</p>
        <div class="btn-row">${btn(contactUrl(p.name), `Request a Service ${icon('arrow', 'ic', 18)}`, 'btn-warm')}${btn(tel, `${icon('phone', 'ic', 20)} Call ${esc(SITE.phone)}`, 'btn-secondary')}</div>
      </div>
      <nav class="art-links" aria-label="Related links"><a href="/services#${p.slug}">${icon('arrow', 'ic', 18)} ${esc(p.name)} service in Chennai</a><a href="/blog">${icon('chevronLeft', 'ic', 18)} Back to all care guides</a></nav>
    </div>
    <aside class="art-side" aria-label="${esc(p.name)} service">
      <div class="side-card">
        <span class="svc-ic">${icon(p.icon, 'ic', 26)}</span>
        <h2>${esc(p.name)}</h2>
        <p>Installation · Repair · Maintenance</p>
        <p class="side-price">Service starting from <strong>${rupee(p.price)}</strong></p>
        ${btn(contactUrl(p.name), 'Request a Service', 'btn-primary btn-block')}
        ${arrowLink(`/services#${p.slug}`, 'View service details', 'sm on-dark')}
      </div>
      <div class="side-more"><h2>More care guides</h2><ul>${others.map((o) => `<li><a href="/blog/${o.slug}">${esc(o.title)}</a></li>`).join('')}</ul></div>
    </aside>
  </div>
</article>`;
    const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: b.title, description: b.description, image: abs(IMG[b.image].full), mainEntityOfPage: abs(path_), author: { '@type': 'Organization', name: SITE.name, url: SITE.domain + '/' }, publisher: { '@id': SITE.domain + '/#organization' }, about: { '@type': 'Thing', name: p.name }, inLanguage: 'en-IN' };
    add(path_, layout({ path: path_, title: b.metaTitle, description: b.description, body, schema: [crumbsLD(cr), ld], ogType: 'article', ogImage: IMG[b.image].src, ogImageAlt: b.alt }));
  }
}

function legal(p, key, title, sections) {
  const crumbs = [['Home', '/'], [title, p]];
  const body = `${pageHero({ title, crumbs, lede: `Last updated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` })}
<section class="sec sec-white"><div class="wrap prose legal">
  ${sections.map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((t) => `<p>${t}</p>`).join('')}`).join('\n  ')}
</div></section>`;
  add(p, layout({ path: p, ...PAGE_META[key], body, schema: [crumbsLD(crumbs)] }));
}

function privacy() {
  legal('/privacy', 'privacy', 'Privacy Policy', [
    ['Who we are', [`This website belongs to ${esc(SITE.name)}, a kitchen appliance service business in ${esc(SITE.city)}, ${esc(SITE.region)}, India.`]],
    ['What the enquiry form collects', ['When you send a service enquiry, the form collects your name, phone number, email address (optional), your location or Google Maps link, the product and service type you are asking about, and your message.']],
    ['How it is sent', [`The form is delivered by <a href="https://web3forms.com" ${ext}>Web3Forms</a>, a form delivery service, which passes your enquiry to ${esc(SITE.name)} by email. Web3Forms processes the data under its own privacy policy.`]],
    ['How we use your details', ['We use your details only to respond to your enquiry and to arrange the service you ask about. We do not sell your details.']],
    ['Reviews', ['Reviews on our Reviews page are published by our team with the customer\'s agreement. If you would like a review about you removed, contact us.']],
    ['Calls, WhatsApp and email', ['If you contact us by phone, WhatsApp or email, those services handle your messages under their own terms and privacy policies.']],
    ['Your choices', [`To ask what details we hold about you, or to have them deleted, contact us at <a href="${mail}">${esc(SITE.email)}</a> or call <a href="${tel}">${esc(SITE.phone)}</a>.`]],
  ]);
}

function terms() {
  legal('/terms', 'terms', 'Terms and Conditions', [
    ['About these terms', [`These terms apply to your use of the ${esc(SITE.name)} website and to enquiries made through it.`]],
    ['Service enquiries', ['Sending an enquiry through the website, by phone or by WhatsApp is a request for contact, not a confirmed booking. We will contact you to discuss your requirement.']],
    ['Prices', [`Prices shown on this website are starting prices and are a guide only. ${esc(PRICE_NOTE.replace(/^These are starting prices\. /, ''))}`]],
    ['Brands', [`${esc(SITE.name)} is an authorised service partner for Elica. Other brands named on this website are brands we service; we are not their authorised partner, and their names and trademarks belong to their owners.`]],
    ['Website content', ['We aim to keep the information on this website accurate, but it is general guidance and may change without notice. Blog articles are general care tips and do not replace your appliance manufacturer\'s instructions.']],
    ['Images', ['Some images on this website are representative stock photographs and are labelled as such.']],
    ['Contact', [`Questions about these terms: <a href="${mail}">${esc(SITE.email)}</a> or <a href="${tel}">${esc(SITE.phone)}</a>.`]],
  ]);
}

function notFound() {
  const body = `<section class="sec sec-dark nf"><div class="wrap nf-in">
  ${eyebrow('Error 404', 'on-dark')}
  <h1>We couldn't find that page.</h1>
  <p class="lede">The link may be old or mistyped. Try one of these instead.</p>
  <div class="btn-row">${btn('/', 'Back to home', 'btn-primary')}${btn('/services', 'Our services', 'btn-ghost')}</div>
</div></section>`;
  add('/404', layout({ path: '/404', ...PAGE_META.notFound, body, noindex: true }));
}

// ---------- write ----------
await processImages();
await processLogo();
await processBrands();
home(); about(); services(); pricing(); areas(); gallery(); blog(); reviews(); contact(); privacy(); terms(); notFound(); admin();

for (const [p, html] of pages) {
  const file = p === '/' ? 'index.html' : p.slice(1) + '.html';
  const out = path.join(DIST, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

const today = new Date().toISOString().slice(0, 10);
const prio = (p) => (p === '/' ? '1.0' : p.startsWith('/blog/') ? '0.6' : '0.8');
const indexable = pages.filter(([p]) => !['/404', '/admin'].includes(p));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(([p]) => `  <url><loc>${abs(p)}</loc><lastmod>${today}</lastmod><priority>${prio(p)}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE.domain}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify({ name: SITE.name, short_name: 'MM Enterprises', start_url: '/', display: 'standalone', background_color: '#071D33', theme_color: SITE.themeColor, icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));

// Cache headers for Cloudflare (static assets); the Worker adds security headers.
fs.writeFileSync(path.join(DIST, '_headers'), `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/img/*
  Cache-Control: public, max-age=31536000, immutable
/admin
  Cache-Control: no-store
  X-Robots-Tag: noindex, nofollow
`);

console.log(`Built ${pages.length} pages into dist/  (images: ${Object.keys(IMG).length}, brand logos: ${Object.keys(BRAND_DIMS).length}, WebP: ${sharp ? 'on' : 'off'}, Web3Forms key: ${SITE.web3formsKey ? 'set' : 'NOT SET'})`);
