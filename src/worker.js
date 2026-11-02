// ============================================================================
//  Cloudflare Worker: serves the static site from dist/ and the reviews API.
//  Bindings (wrangler.jsonc): ASSETS (static files), DB (D1 database).
//  Secrets (never in source): ADMIN_PASSWORD, SESSION_SECRET
//    npx wrangler secret put ADMIN_PASSWORD
//    npx wrangler secret put SESSION_SECRET
// ============================================================================
const CANONICAL_HOST = 'mm-enterprises-service.com';
const COOKIE = 'mm_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_FAILS = 5;
const FAIL_WINDOW_SECONDS = 15 * 60;

const enc = new TextEncoder();
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const ok = (data, status = 200, headers) => json({ ok: true, data }, status, headers);
const fail = (error, status = 400) => json({ ok: false, error }, status);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Cloudflare's edge sets CF-Visitor; it is absent under `wrangler dev`, which we treat as local.
    const visitor = request.headers.get('CF-Visitor');
    const local = !visitor;
    const plainHttp = /"scheme":"http"/.test(visitor || '');

    // one canonical address: https://mm-enterprises-service.com
    if (!local && (url.hostname === 'www.' + CANONICAL_HOST || (plainHttp && url.hostname === CANONICAL_HOST))) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    let res;
    if (url.pathname.startsWith('/api/')) {
      try {
        res = await api(request, env, url, local);
      } catch (err) {
        console.error(err);
        res = fail('Something went wrong on the server. Please try again.', 500);
      }
    } else {
      res = await env.ASSETS.fetch(request);
      if (url.pathname === '/admin' || url.pathname === '/admin.html') {
        res = new Response(res.body, res);
        res.headers.set('Cache-Control', 'no-store');
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      }
    }
    res = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    if (!local) res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return res;
  },
};

// ---------------------------------------------------------------------------
async function api(request, env, url, local) {
  const { pathname } = url;
  const method = request.method;
  if (!env.DB) return fail('Reviews database is not configured.', 503);

  // ---------- public ----------
  if (pathname === '/api/reviews' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT id, name, rating, text, review_date, category, source FROM reviews WHERE published = 1 ORDER BY sort_order ASC, review_date DESC, id DESC',
    ).all();
    const cats = await env.DB.prepare('SELECT name FROM categories ORDER BY sort_order, name').all();
    return ok({ reviews: results, categories: cats.results.map((c) => c.name) }, 200, { 'Cache-Control': 'public, max-age=60' });
  }

  if (!pathname.startsWith('/api/admin/')) return fail('Not found.', 404);

  // ---------- admin: login / logout / session ----------
  if (pathname === '/api/admin/login' && method === 'POST') {
    if (!sameOrigin(request, url)) return fail('Request blocked.', 403);
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return fail('Admin login is not configured on the server.', 503);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(now - FAIL_WINDOW_SECONDS).run();
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?').bind(ip).first();
    if (n >= MAX_FAILS) return fail('Too many failed attempts. Please wait 15 minutes and try again.', 429);
    const body = await readJson(request);
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!(await safeEqual(password, env.ADMIN_PASSWORD, env.SESSION_SECRET))) {
      await env.DB.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)').bind(ip, now).run();
      return fail('Incorrect password.', 401);
    }
    await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    const exp = now + SESSION_SECONDS;
    const token = `${exp}.${await sign(`admin.${exp}`, env.SESSION_SECRET)}`;
    return ok({ expires: exp }, 200, { 'Set-Cookie': cookie(token, SESSION_SECONDS, local) });
  }

  if (pathname === '/api/admin/logout' && method === 'POST') {
    return ok(true, 200, { 'Set-Cookie': cookie('', 0, local) });
  }

  const authed = await isAuthed(request, env);
  if (pathname === '/api/admin/session' && method === 'GET') return ok({ authenticated: authed });
  if (!authed) return fail('Please sign in.', 401);
  if (method !== 'GET' && !sameOrigin(request, url)) return fail('Request blocked.', 403);

  // ---------- admin: reviews ----------
  if (pathname === '/api/admin/reviews' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM reviews ORDER BY sort_order ASC, review_date DESC, id DESC').all();
    return ok(results);
  }
  if (pathname === '/api/admin/reviews' && method === 'POST') {
    const v = await validateReview(await readJson(request), env);
    if (v.error) return fail(v.error);
    const { m } = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM reviews').first();
    const row = await env.DB.prepare(
      'INSERT INTO reviews (name, rating, text, review_date, category, published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *',
    ).bind(v.name, v.rating, v.text, v.review_date, v.category, v.published, m + 1).first();
    return ok(row, 201);
  }
  if (pathname === '/api/admin/reviews/order' && method === 'PUT') {
    const body = await readJson(request);
    const ids = Array.isArray(body?.ids) ? body.ids.map(Number) : null;
    if (!ids || !ids.length || ids.some((i) => !Number.isInteger(i) || i < 1)) return fail('Invalid order.');
    await env.DB.batch(ids.map((id, i) => env.DB.prepare("UPDATE reviews SET sort_order = ?, updated_at = datetime('now') WHERE id = ?").bind(i + 1, id)));
    return ok(true);
  }
  const rm = pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
  if (rm) {
    const id = Number(rm[1]);
    const existing = await env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first();
    if (!existing) return fail('Review not found.', 404);
    if (method === 'PUT') {
      const v = await validateReview({ ...existing, ...(await readJson(request)) }, env);
      if (v.error) return fail(v.error);
      const row = await env.DB.prepare(
        "UPDATE reviews SET name = ?, rating = ?, text = ?, review_date = ?, category = ?, published = ?, updated_at = datetime('now') WHERE id = ? RETURNING *",
      ).bind(v.name, v.rating, v.text, v.review_date, v.category, v.published, id).first();
      return ok(row);
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
      return ok(true);
    }
  }

  // ---------- admin: categories ----------
  if (pathname === '/api/admin/categories' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT c.id, c.name, c.sort_order, (SELECT COUNT(*) FROM reviews r WHERE r.category = c.name) AS used FROM categories c ORDER BY c.sort_order, c.name',
    ).all();
    return ok(results);
  }
  if (pathname === '/api/admin/categories' && method === 'POST') {
    const name = cleanText((await readJson(request))?.name, 40);
    if (!name || name.length < 2) return fail('Category name must be 2 to 40 characters.');
    const dup = await env.DB.prepare('SELECT id FROM categories WHERE name = ?').bind(name).first();
    if (dup) return fail('That category already exists.');
    const { m } = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories').first();
    const row = await env.DB.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?) RETURNING *').bind(name, m + 1).first();
    return ok(row, 201);
  }
  const cm = pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
  if (cm) {
    const id = Number(cm[1]);
    const cat = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    if (!cat) return fail('Category not found.', 404);
    if (method === 'PUT') {
      const name = cleanText((await readJson(request))?.name, 40);
      if (!name || name.length < 2) return fail('Category name must be 2 to 40 characters.');
      const dup = await env.DB.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').bind(name, id).first();
      if (dup) return fail('That category already exists.');
      await env.DB.batch([
        env.DB.prepare('UPDATE categories SET name = ? WHERE id = ?').bind(name, id),
        env.DB.prepare("UPDATE reviews SET category = ?, updated_at = datetime('now') WHERE category = ?").bind(name, cat.name),
      ]);
      return ok({ ...cat, name });
    }
    if (method === 'DELETE') {
      const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM reviews WHERE category = ?').bind(cat.name).first();
      if (n > 0) return fail(`This category is used by ${n} review${n === 1 ? '' : 's'}. Move them to another category first.`, 409);
      await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
      return ok(true);
    }
  }
  return fail('Not found.', 404);
}

// ---------------------------------------------------------------------------
async function validateReview(b, env) {
  if (!b || typeof b !== 'object') return { error: 'Invalid request.' };
  const name = cleanText(b.name, 80);
  const text = cleanText(b.text, 1500, true);
  const rating = Number(b.rating);
  const date = String(b.review_date || '').trim();
  const category = cleanText(b.category, 40) || '';
  const published = b.published === true || b.published === 1 || b.published === '1' ? 1 : 0;
  if (!name || name.length < 2) return { error: 'Customer name must be 2 to 80 characters.' };
  if (!text || text.length < 5) return { error: 'Review text must be 5 to 1500 characters.' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Rating must be a whole number from 1 to 5.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) return { error: 'Please enter a valid review date.' };
  if (Date.parse(date + 'T00:00:00Z') > Date.now() + 36 * 3600 * 1000) return { error: 'The review date cannot be in the future.' };
  if (category) {
    const c = await env.DB.prepare('SELECT name FROM categories WHERE name = ?').bind(category).first();
    if (!c) return { error: 'Please choose a category from the list.' };
  }
  return { name, text, rating, review_date: date, category, published };
}

function cleanText(v, max, multiline = false) {
  if (typeof v !== 'string') return '';
  let s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : s.replace(/\s+/g, ' ').trim();
  return s.length > max ? '' : s;
}

async function readJson(request) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > 20000) return null;
  try { return await request.json(); } catch { return null; }
}

// Mutating admin requests must come from this site (blocks cross-site form posts).
function sameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return false;
  return request.headers.get('X-Requested-With') === 'mm-admin';
}

async function hmac(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function sign(data, secret) {
  const sig = await crypto.subtle.sign('HMAC', await hmac(secret), enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// constant-time comparison of two strings (compares HMACs of equal length)
async function safeEqual(a, b, secret) {
  const [x, y] = await Promise.all([sign('pw.' + a, secret), sign('pw.' + b, secret)]);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}
async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false;
  const raw = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(`admin.${exp}`, env.SESSION_SECRET), env.SESSION_SECRET);
}
function cookie(value, maxAge, local) {
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${local ? '' : '; Secure'}`;
}
