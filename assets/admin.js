// MM Enterprises: reviews admin dashboard (talks to the Worker API at /api/admin/*).
// All data is rendered with textContent; nothing from the database is injected as HTML.
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var make = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  var loginBox = $('#adm-login'), app = $('#adm-app'), list = $('#adm-list'), catList = $('#adm-cats');
  var dlg = $('#adm-dialog'), form = $('#adm-form'), formErr = $('#adm-form-err'), toastEl = $('#adm-toast');
  var reviews = [], categories = [], editing = null, toastTimer;

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('is-error', !!isError);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  function api(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', headers: { Accept: 'application/json', 'X-Requested-With': 'mm-admin' } };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Unexpected server response.' }; }).then(function (j) {
        if (r.status === 401 && path !== '/api/admin/login') { showLogin(); }
        if (!r.ok || !j.ok) throw new Error(j.error || 'Request failed.');
        return j.data;
      });
    });
  }

  function showLogin() { app.hidden = true; loginBox.hidden = false; $('#adm-pw').focus(); }
  function showApp() { loginBox.hidden = true; app.hidden = false; load(); }

  function load() {
    return Promise.all([api('GET', '/api/admin/reviews'), api('GET', '/api/admin/categories')])
      .then(function (res) { reviews = res[0]; categories = res[1]; renderReviews(); renderCats(); })
      .catch(function (e) { toast(e.message, true); });
  }

  // ---------- reviews list ----------
  function renderReviews() {
    list.textContent = '';
    if (!reviews.length) { list.appendChild(make('li', 'adm-empty', 'No reviews yet. Use "Add review" to create the first one.')); return; }
    reviews.forEach(function (r, i) {
      var li = make('li', 'adm-item ' + (r.published ? 'is-live' : 'is-draft'));
      var main = make('div');
      var meta = make('div', 'adm-meta');
      meta.appendChild(make('strong', null, r.name));
      meta.appendChild(make('span', null, r.rating + ' / 5'));
      meta.appendChild(make('span', null, r.review_date));
      meta.appendChild(make('span', null, r.category || 'No category'));
      meta.appendChild(make('span', 'adm-badge ' + (r.published ? 'live' : 'draft'), r.published ? 'Published' : 'Unpublished'));
      main.appendChild(meta);
      main.appendChild(make('p', 'adm-text', r.text));
      li.appendChild(main);
      var act = make('div', 'adm-actions');
      var b = function (label, fn, cls, disabled, aria) { var x = make('button', cls || null, label); x.type = 'button'; x.disabled = !!disabled; if (aria) x.setAttribute('aria-label', aria); x.addEventListener('click', fn); act.appendChild(x); };
      b('↑', function () { move(i, -1); }, null, i === 0, 'Move up: ' + r.name);
      b('↓', function () { move(i, 1); }, null, i === reviews.length - 1, 'Move down: ' + r.name);
      b(r.published ? 'Unpublish' : 'Publish', function () { togglePublish(r); });
      b('Edit', function () { openForm(r); });
      b('Delete', function () { remove(r); }, 'danger');
      li.appendChild(act);
      list.appendChild(li);
    });
  }

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= reviews.length) return;
    var copy = reviews.slice(); var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
    api('PUT', '/api/admin/reviews/order', { ids: copy.map(function (r) { return r.id; }) })
      .then(function () { reviews = copy; renderReviews(); toast('Order updated.'); })
      .catch(function (e) { toast(e.message, true); });
  }
  function togglePublish(r) {
    api('PUT', '/api/admin/reviews/' + r.id, { published: !r.published })
      .then(function (row) { Object.assign(r, row); renderReviews(); toast(row.published ? 'Review published.' : 'Review unpublished.'); })
      .catch(function (e) { toast(e.message, true); });
  }
  function remove(r) {
    if (!window.confirm('Delete the review from ' + r.name + '? This cannot be undone.')) return;
    api('DELETE', '/api/admin/reviews/' + r.id)
      .then(function () { reviews = reviews.filter(function (x) { return x.id !== r.id; }); renderReviews(); renderCats(); toast('Review deleted.'); })
      .catch(function (e) { toast(e.message, true); });
  }

  // ---------- add / edit dialog ----------
  function fillCatSelect(current) {
    var sel = $('#r-cat'); sel.textContent = '';
    sel.appendChild(make('option', null, 'No category')).value = '';
    categories.forEach(function (c) { var o = make('option', null, c.name); o.value = c.name; sel.appendChild(o); });
    sel.value = current || '';
  }
  function openForm(r) {
    editing = r || null;
    $('#adm-dlg-title').textContent = r ? 'Edit review' : 'Add review';
    $('#r-name').value = r ? r.name : '';
    $('#r-rating').value = r ? String(r.rating) : '5';
    $('#r-date').value = r ? r.review_date : new Date().toISOString().slice(0, 10);
    $('#r-date').max = new Date().toISOString().slice(0, 10);
    $('#r-text').value = r ? r.text : '';
    $('#r-pub').checked = r ? !!r.published : false;
    fillCatSelect(r ? r.category : '');
    formErr.textContent = '';
    dlg.showModal();
    $('#r-name').focus();
  }
  $('#adm-new').addEventListener('click', function () { openForm(null); });
  $('#adm-cancel').addEventListener('click', function () { dlg.close(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = {
      name: $('#r-name').value.trim(), rating: Number($('#r-rating').value), review_date: $('#r-date').value,
      text: $('#r-text').value.trim(), category: $('#r-cat').value, published: $('#r-pub').checked,
    };
    if (body.name.length < 2) { formErr.textContent = 'Please enter the customer name.'; return; }
    if (!body.review_date) { formErr.textContent = 'Please choose the review date.'; return; }
    if (body.text.length < 5) { formErr.textContent = 'Please enter the review text.'; return; }
    var save = $('#adm-save'); save.disabled = true;
    (editing ? api('PUT', '/api/admin/reviews/' + editing.id, body) : api('POST', '/api/admin/reviews', body))
      .then(function (row) {
        if (editing) Object.assign(editing, row); else reviews.push(row);
        dlg.close(); renderReviews(); renderCats(); toast(editing ? 'Review updated.' : 'Review added.');
      })
      .catch(function (err) { formErr.textContent = err.message; })
      .then(function () { save.disabled = false; });
  });

  // ---------- categories ----------
  function renderCats() {
    catList.textContent = '';
    categories.forEach(function (c) {
      var used = reviews.filter(function (r) { return r.category === c.name; }).length;
      var li = make('li');
      li.appendChild(make('span', null, c.name + ' (' + used + ' review' + (used === 1 ? '' : 's') + ')'));
      var act = make('div', 'adm-actions');
      var rename = make('button', null, 'Rename'); rename.type = 'button';
      rename.addEventListener('click', function () {
        var name = window.prompt('New name for "' + c.name + '"', c.name);
        if (!name || name.trim() === c.name) return;
        api('PUT', '/api/admin/categories/' + c.id, { name: name.trim() })
          .then(function () { var old = c.name; c.name = name.trim(); reviews.forEach(function (r) { if (r.category === old) r.category = c.name; }); renderCats(); renderReviews(); toast('Category renamed.'); })
          .catch(function (e) { toast(e.message, true); });
      });
      var del = make('button', 'danger', 'Delete'); del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Delete the category "' + c.name + '"?')) return;
        api('DELETE', '/api/admin/categories/' + c.id)
          .then(function () { categories = categories.filter(function (x) { return x.id !== c.id; }); renderCats(); toast('Category deleted.'); })
          .catch(function (e) { toast(e.message, true); });
      });
      act.appendChild(rename); act.appendChild(del); li.appendChild(act);
      catList.appendChild(li);
    });
  }
  $('#adm-cat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#adm-cat-name'), name = input.value.trim();
    if (name.length < 2) { toast('Category name must be at least 2 characters.', true); return; }
    api('POST', '/api/admin/categories', { name: name })
      .then(function (row) { categories.push(row); input.value = ''; renderCats(); toast('Category added.'); })
      .catch(function (err) { toast(err.message, true); });
  });

  // ---------- tabs ----------
  $$('.adm-tabs button').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.adm-tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
      $('#pane-reviews').hidden = t.dataset.tab !== 'reviews';
      $('#pane-cats').hidden = t.dataset.tab !== 'cats';
    });
  });

  // ---------- login / logout ----------
  $('#adm-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = $('#adm-pw');
    if (!pw.value) { toast('Please enter the password.', true); return; }
    api('POST', '/api/admin/login', { password: pw.value })
      .then(function () { pw.value = ''; showApp(); toast('Signed in.'); })
      .catch(function (err) { toast(err.message, true); pw.select(); });
  });
  $('#adm-logout').addEventListener('click', function () {
    api('POST', '/api/admin/logout').catch(function () {}).then(function () { reviews = []; showLogin(); toast('Signed out.'); });
  });

  api('GET', '/api/admin/session')
    .then(function (d) { if (d.authenticated) showApp(); else showLogin(); })
    .catch(function (e) { showLogin(); toast(e.message === 'Request failed.' ? 'The reviews service is not available here.' : e.message, true); });
})();
