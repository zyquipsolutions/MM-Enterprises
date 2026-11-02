// MM Enterprises: small progressive enhancements (the site works without JS).
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- sticky header shadow ----------
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- mobile menu ----------
  var menuBtn = $('.menu-btn');
  var drawer = $('#drawer');
  function setMenu(open) {
    if (!menuBtn || !drawer) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add('open'); });
    } else {
      drawer.classList.remove('open');
      setTimeout(function () { if (!drawer.classList.contains('open')) drawer.hidden = true; }, 200);
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1240) setMenu(false); });
  }

  // ---------- scroll reveal ----------
  var io = null;
  function reveal(els) {
    if (!io) { els.forEach(function (t) { t.classList.add('in'); }); return; }
    els.forEach(function (t) { io.observe(t); });
  }
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }
  reveal($$('.reveal'));

  // ---------- service areas: instant search + district filter ----------
  var locGrid = $('#loc-grid');
  if (locGrid) {
    var cards = $$('.loc-card', locGrid);
    var q = $('#area-q'), clearBtn = $('.area-clear'), tabs = $$('.area-tab');
    var countEl = $('#area-count'), empty = $('#area-empty');
    var group = 'all';
    var originals = cards.map(function (c) { return $('.loc-names', c).textContent; });
    var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    var escHtml = function (s) { return s.replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
    var apply = function () {
      var term = norm(q.value || '');
      var words = term ? term.split(' ') : [];
      var shown = 0;
      cards.forEach(function (c, i) {
        var hay = c.dataset.search;
        var ok = (group === 'all' || c.dataset.group === group) && words.every(function (w) { return hay.indexOf(w) > -1; });
        c.hidden = !ok;
        var names = $('.loc-names', c);
        if (ok && words.length) {
          var html = escHtml(originals[i]);
          words.forEach(function (w) { if (w.length > 1) html = html.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
          names.innerHTML = html;
        } else if (names.innerHTML !== escHtml(originals[i])) {
          names.textContent = originals[i];
        }
        if (ok) shown++;
      });
      clearBtn.hidden = !q.value;
      empty.hidden = shown > 0;
      countEl.textContent = shown ? (shown === cards.length ? 'Showing all ' + shown + ' locations' : 'Showing ' + shown + ' matching location' + (shown === 1 ? '' : 's')) : 'No matching locations';
    };
    q.addEventListener('input', apply);
    clearBtn.addEventListener('click', function () { q.value = ''; apply(); q.focus(); });
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        group = t.dataset.group;
        tabs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
        apply();
      });
    });
  }

  // ---------- gallery: filters + lightbox ----------
  var gItems = $$('.g-item');
  if (gItems.length) {
    var chips = $$('.g-chip');
    var gStatus = $('#g-status');
    var visible = function () { return gItems.filter(function (li) { return !li.hidden; }); };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.dataset.filter;
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        gItems.forEach(function (li) {
          var keep = f === 'all' || li.dataset.cat === f;
          if (keep && li.hidden) {
            li.hidden = false;
            li.classList.add('in');
            if (!reduceMotion) { li.classList.remove('g-enter'); void li.offsetWidth; li.classList.add('g-enter'); }
          } else if (!keep) {
            li.hidden = true;
          }
        });
        if (gStatus) gStatus.textContent = visible().length + ' images shown';
      });
    });

    var lb = $('#lb');
    if (lb && typeof lb.showModal === 'function') {
      var lbImg = $('#lb-img'), lbTitle = $('#lb-title'), lbCat = $('#lb-cat'), lbRep = $('#lb-rep'), lbCount = $('#lb-count');
      var idx = 0, opener = null;
      var show = function (i) {
        var list = visible();
        if (!list.length) return;
        idx = (i + list.length) % list.length;
        var b = $('.g-card', list[idx]);
        lbImg.src = b.dataset.full;
        lbImg.alt = b.dataset.alt;
        lbTitle.textContent = b.dataset.title;
        lbCat.textContent = b.dataset.cat;
        lbRep.hidden = !b.dataset.stock;
        lbCount.textContent = (idx + 1) + ' of ' + list.length;
      };
      $$('.g-card').forEach(function (b) {
        b.addEventListener('click', function () {
          opener = b;
          show(visible().indexOf(b.closest('.g-item')));
          lb.showModal();
          document.documentElement.classList.add('lb-open');
        });
      });
      $('.lb-x', lb).addEventListener('click', function () { lb.close(); });
      $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
      $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-in')) lb.close(); });
      lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
      lb.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); lbImg.removeAttribute('src'); if (opener) opener.focus(); });
      var tx = null;
      lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); tx = null; });
    }
  }

  // ---------- public reviews page ----------
  // Starts from the site reviews embedded at build time (the same SAMPLE_REVIEWS data as the Home page),
  // then adds any reviews published through /admin (loaded from /api/reviews).
  var rvGrid = $('#rvp-grid');
  if (rvGrid) {
    var PAGE = 12;
    var cfg = { site: [], admin: false };
    try { cfg = JSON.parse($('#rvp-data').textContent); } catch (e) { /* keep defaults */ }
    var all = (cfg.site || []).map(function (r, i) { r.order = i; return r; });
    var filtered = [], shownCount = 0, cat = 'all';
    var rvStatus = $('#rvp-status'), moreBtn = $('#rvp-more'), sortSel = $('#rvp-sort'), filters = $('#rvp-filters');
    var make = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    var svgNS = 'http://www.w3.org/2000/svg';
    var starRow = function (n) {
      var wrap = make('span', 'stars'); wrap.setAttribute('aria-hidden', 'true');
      for (var i = 1; i <= 5; i++) {
        var s = document.createElementNS(svgNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '18'); s.setAttribute('height', '18'); s.setAttribute('class', i <= n ? 'on' : 'off');
        var p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', 'M12 2.8l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.2l-5.2 2.7 1-5.8L3.5 9l5.9-.9z'); s.appendChild(p); wrap.appendChild(s);
      }
      return wrap;
    };
    var fmtDate = function (d) { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
    var card = function (r) {
      var li = make('li', 'rv-card');
      var top = make('div', 'rv-top'); top.appendChild(starRow(r.rating));
      var num = make('span', 'rv-num', Number(r.rating).toFixed(1)); num.appendChild(make('span', 'sr', ' out of 5')); top.appendChild(num);
      if (r.review_date) { var t = make('time', 'rv-date', fmtDate(r.review_date)); t.setAttribute('datetime', r.review_date); top.appendChild(t); }
      li.appendChild(top);
      var bq = make('blockquote'); bq.appendChild(make('p', null, r.text)); li.appendChild(bq);
      var f = make('footer'); var av = make('span', 'rv-av', (r.initial || (r.name || '?').trim().charAt(0)).toUpperCase()); av.setAttribute('aria-hidden', 'true'); f.appendChild(av);
      var who = make('span'); who.appendChild(make('strong', null, r.name)); who.appendChild(make('small', null, r.category || 'Customer review')); f.appendChild(who);
      li.appendChild(f);
      return li;
    };
    // undated reviews keep their original order and sit after dated ones when sorting by date
    var byDate = function (dir) { return function (a, b) { if (!a.review_date || !b.review_date) return (a.review_date ? -1 : b.review_date ? 1 : a.order - b.order); return dir * a.review_date.localeCompare(b.review_date) || a.order - b.order; }; };
    var sorters = {
      custom: function (a, b) { return a.order - b.order; },
      newest: byDate(-1),
      oldest: byDate(1),
      high: function (a, b) { return b.rating - a.rating || a.order - b.order; },
      low: function (a, b) { return a.rating - b.rating || a.order - b.order; },
    };
    var buildFilters = function () {
      var counts = {}, order = [];
      all.forEach(function (r) { if (!r.category) return; if (!counts[r.category]) { counts[r.category] = 0; order.push(r.category); } counts[r.category]++; });
      filters.textContent = '';
      var chip = function (label, value, n) { var b = make('button', 'g-chip', label + ' '); b.type = 'button'; b.dataset.filter = value; b.setAttribute('aria-pressed', String(cat === value)); b.appendChild(make('span', null, String(n))); filters.appendChild(b);
        b.addEventListener('click', function () { cat = value; $$('.g-chip', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); render(true); }); };
      if (cat !== 'all' && !counts[cat]) cat = 'all';
      chip('All', 'all', all.length);
      order.forEach(function (c) { chip(c, c, counts[c]); });
    };
    var render = function (reset) {
      if (reset) {
        filtered = all.filter(function (r) { return cat === 'all' || r.category === cat; }).slice().sort(sorters[sortSel.value] || sorters.custom);
        rvGrid.textContent = ''; shownCount = 0;
      }
      var next = filtered.slice(shownCount, shownCount + PAGE);
      next.forEach(function (r) { rvGrid.appendChild(card(r)); });
      shownCount += next.length;
      moreBtn.hidden = shownCount >= filtered.length;
      rvStatus.textContent = all.length === 0 ? 'No reviews have been published yet.' : filtered.length === 0 ? 'No reviews in this category yet.' : 'Showing ' + shownCount + ' of ' + filtered.length + ' review' + (filtered.length === 1 ? '' : 's');
    };
    buildFilters();
    render(true);
    sortSel.addEventListener('change', function () { render(true); });
    moreBtn.addEventListener('click', function () { render(false); });
    if (cfg.admin) {
      fetch('/api/reviews', { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) throw new Error('bad');
          var extra = (j.data.reviews || []).map(function (r, i) { r.order = all.length + i; return r; });
          if (!extra.length) return;
          all = all.concat(extra);
          buildFilters();
          render(true);
        })
        .catch(function () { if (!all.length) rvStatus.textContent = 'Reviews could not be loaded right now. Please try again later.'; });
    }
  }

  // ---------- contact form (Web3Forms) ----------
  var form = $('#enquiry-form');
  if (form) {
    var key = form.dataset.key || '';
    var status = $('#form-status');
    var submit = $('#f-submit');
    var sending = false;

    // pre-fill from the link (?product=…&service=…&message=…)
    var params = new URLSearchParams(location.search);
    [['product', '#f-product'], ['service', '#f-service']].forEach(function (p) {
      var v = params.get(p[0]), sel = $(p[1]);
      if (!v || !sel) return;
      Array.prototype.forEach.call(sel.options, function (o) { if (o.value && o.value.toLowerCase() === v.toLowerCase()) sel.value = o.value; });
    });
    var pm = params.get('message');
    if (pm) form.elements.message.value = pm.slice(0, 2000);

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      phone: function (v) { var d = v.replace(/\D/g, ''); if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? '' : 'Please enter a valid 10 digit mobile number.'; },
      email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address, or leave it blank.'; },
      location: function (v) { return v.trim().length >= 3 ? '' : 'Please enter your location or paste your Google Maps link.'; },
      product: function (v) { return v ? '' : 'Please choose a product.'; },
      service: function (v) { return v ? '' : 'Please choose a service type.'; },
      message: function (v) { return v.trim().length >= 5 ? '' : 'Please add a short message about what you need.'; },
    };
    var errId = { name: 'e-name', phone: 'e-phone', email: 'e-email', location: 'e-loc', product: 'e-product', service: 'e-service', message: 'e-msg' };
    var check = function (el) {
      var msg = rules[el.name] ? rules[el.name](el.value) : '';
      var err = document.getElementById(errId[el.name]);
      el.closest('.field').classList.toggle('has-error', !!msg);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    };
    var fields = Object.keys(rules).map(function (n) { return form.elements[n]; });
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) check(el); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });
    var setStatus = function (type, html) {
      status.className = 'full form-status is-' + type;
      status.innerHTML = html;
      status.focus();
    };
    var fallback = 'Please call <a href="tel:+919840871541">98408 71541</a> or WhatsApp <a href="https://wa.me/919750656371" target="_blank" rel="noopener">97506 56371</a>.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var firstBad = null;
      fields.forEach(function (el) { if (!check(el) && !firstBad) firstBad = el; });
      if (firstBad) { firstBad.focus(); return; }
      if (form.elements.botcheck.checked) return;
      if (!key) {
        setStatus('info', '<p><strong>Online enquiry form is not yet active.</strong> ' + fallback + '</p>');
        return;
      }
      sending = true;
      submit.disabled = true;
      submit.classList.add('is-loading');
      submit.setAttribute('aria-busy', 'true');
      status.className = 'full form-status';
      status.textContent = '';
      var data = {
        access_key: key,
        subject: 'Service request: ' + form.elements.product.value + ' (' + form.elements.service.value + ')',
        from_name: 'MM Enterprises website',
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        location: form.elements.location.value.trim(),
        product: form.elements.product.value,
        service: form.elements.service.value,
        message: form.elements.message.value.trim(),
        botcheck: '',
      };
      if (!data.email) delete data.email;
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body && res.body.success === true) {
            form.reset();
            fields.forEach(function (el) { el.removeAttribute('aria-invalid'); });
            setStatus('ok', '<p><strong>Thank you, your request has been sent.</strong> MM Enterprises will call you back soon.</p>');
          } else {
            setStatus('error', '<p><strong>Sorry, your request could not be sent.</strong> ' + fallback + '</p>');
          }
        })
        .catch(function () {
          setStatus('error', '<p><strong>Sorry, your request could not be sent</strong> (network problem). ' + fallback + '</p>');
        })
        .then(function () {
          clearTimeout(timer);
          sending = false;
          submit.disabled = false;
          submit.classList.remove('is-loading');
          submit.removeAttribute('aria-busy');
        });
    });
  }
})();
