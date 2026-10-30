/* Catalogue: client-side filter + sort, state mirrored in the URL query. */
(function () {
  var FA = window.FA;
  var PRICE = {
    'under-50': { label: 'Under $50', test: function (p) { return p.price < 50; } },
    '50-100': { label: '$50–$100', test: function (p) { return p.price >= 50 && p.price <= 100; } },
    'over-100': { label: 'Over $100', test: function (p) { return p.price > 100; } }
  };
  var SORTS = { featured: 'Featured', 'price-asc': 'Price, low to high', 'price-desc': 'Price, high to low', catno: 'Catalog no.' };
  var catName = {}; FA.CATEGORIES.forEach(function (c) { catName[FA.slug(c)] = c; });

  var state = { cat: [], type: [], price: [], stock: false, sort: 'featured', q: '' };

  function readURL() {
    var u = new URLSearchParams(location.search);
    function list(k, valid) { return (u.get(k) || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(function (s) { return s && valid(s); }); }
    state.cat = list('cat', function (s) { return catName[s]; });
    state.type = list('type', function (s) { return s === 'product' || s === 'service'; });
    state.price = list('price', function (s) { return PRICE[s]; });
    state.stock = u.get('stock') === '1';
    state.sort = SORTS[u.get('sort')] ? u.get('sort') : 'featured';
    state.q = (u.get('q') || '').trim();
  }
  function writeURL() {
    var u = new URLSearchParams();
    if (state.q) u.set('q', state.q);
    if (state.cat.length) u.set('cat', state.cat.join(','));
    if (state.type.length) u.set('type', state.type.join(','));
    if (state.price.length) u.set('price', state.price.join(','));
    if (state.stock) u.set('stock', '1');
    if (state.sort !== 'featured') u.set('sort', state.sort);
    var qs = u.toString().replace(/%2C/g, ',');
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) {}
  }

  function matches(p, skip) {
    if (skip !== 'cat' && state.cat.length && state.cat.indexOf(FA.slug(p.category)) < 0) return false;
    if (skip !== 'type' && state.type.length && state.type.indexOf(p.type.toLowerCase()) < 0) return false;
    if (skip !== 'price' && state.price.length && !state.price.some(function (k) { return PRICE[k].test(p); })) return false;
    if (skip !== 'stock' && state.stock && p.soldOut) return false;
    if (state.q) {
      var hay = (p.id + ' ' + p.name + ' ' + p.category + ' ' + p.type + ' ' + p.blurb).toLowerCase();
      var ok = state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
      if (!ok) return false;
    }
    return true;
  }
  function sorted(list) {
    var l = list.slice();
    if (state.sort === 'price-asc') l.sort(function (a, b) { return a.price - b.price || a.order - b.order; });
    else if (state.sort === 'price-desc') l.sort(function (a, b) { return b.price - a.price || a.order - b.order; });
    else if (state.sort === 'catno') l.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    else l.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.order - b.order; });
    return l;
  }
  function filterCount() { return state.cat.length + state.type.length + state.price.length + (state.stock ? 1 : 0); }

  var form, results, empty, chips;

  function syncForm() {
    form.querySelectorAll('input[name="cat"]').forEach(function (i) { i.checked = state.cat.indexOf(i.value) >= 0; });
    form.querySelectorAll('input[name="type"]').forEach(function (i) { i.checked = state.type.indexOf(i.value) >= 0; });
    form.querySelectorAll('input[name="price"]').forEach(function (i) { i.checked = state.price.indexOf(i.value) >= 0; });
    form.querySelector('input[name="stock"]').checked = state.stock;
    form.querySelectorAll('input[name="sort-m"]').forEach(function (i) { i.checked = i.value === state.sort; });
    document.getElementById('sort').value = state.sort;
    document.getElementById('q').value = state.q;
  }

  function setCount(sel, n) { var el = document.querySelector('[data-count="' + sel + '"]'); if (el) el.textContent = n; }

  function render() {
    var list = sorted(FA.PRODUCTS.filter(function (p) { return matches(p); }));
    results.innerHTML = list.map(function (p) { return FA.card(p); }).join('');
    empty.hidden = list.length > 0;
    results.hidden = list.length === 0;
    document.querySelectorAll('[data-result-count]').forEach(function (el) { el.textContent = list.length; });
    document.querySelectorAll('[data-filter-count]').forEach(function (el) { el.textContent = filterCount(); });
    document.querySelectorAll('[data-sort-label]').forEach(function (el) { el.textContent = SORTS[state.sort].replace('Price, ', ''); });

    // facet counts (respecting the other active filters)
    Object.keys(catName).forEach(function (s) {
      setCount('cat:' + s, FA.PRODUCTS.filter(function (p) { return FA.slug(p.category) === s && matches(p, 'cat'); }).length);
      setCount('tab:' + s, FA.PRODUCTS.filter(function (p) { return FA.slug(p.category) === s; }).length);
    });
    setCount('all', FA.PRODUCTS.length);
    ['product', 'service'].forEach(function (t) { setCount('type:' + t, FA.PRODUCTS.filter(function (p) { return p.type.toLowerCase() === t && matches(p, 'type'); }).length); });
    Object.keys(PRICE).forEach(function (k) { setCount('price:' + k, FA.PRODUCTS.filter(function (p) { return PRICE[k].test(p) && matches(p, 'price'); }).length); });

    // folder tabs: active when 0 or exactly 1 category selected
    document.querySelectorAll('.folder-tab').forEach(function (t) {
      var v = t.getAttribute('data-tab');
      var on = v === '' ? state.cat.length === 0 : (state.cat.length === 1 && state.cat[0] === v);
      t.setAttribute('aria-pressed', String(on));
    });

    // chips
    var c = [];
    if (state.q) c.push(['q', '', 'Search: “' + state.q + '”']);
    state.cat.forEach(function (v) { c.push(['cat', v, catName[v]]); });
    state.type.forEach(function (v) { c.push(['type', v, v === 'product' ? 'Products' : 'Services']); });
    state.price.forEach(function (v) { c.push(['price', v, PRICE[v].label]); });
    if (state.stock) c.push(['stock', '', 'In stock only']);
    chips.innerHTML = c.map(function (x) {
      return '<button type="button" class="chip" data-chip="' + x[0] + '" data-val="' + FA.esc(x[1]) + '">' + FA.esc(x[2]) + ' <span aria-hidden="true">✕</span><span class="sr-only">, remove filter</span></button>';
    }).join('') + (c.length > 1 ? '<button type="button" class="btn btn--tertiary" data-clear>Clear all</button>' : '');
    chips.hidden = c.length === 0;

    var title = state.cat.length === 1 ? catName[state.cat[0]] + ' · Catalogue' : 'Catalogue';
    document.title = title + ' · The Family Archive';
    writeURL();
  }

  function fromForm() {
    function vals(n) { return Array.prototype.map.call(form.querySelectorAll('input[name="' + n + '"]:checked'), function (i) { return i.value; }); }
    state.cat = vals('cat'); state.type = vals('type'); state.price = vals('price');
    state.stock = form.querySelector('input[name="stock"]').checked;
    var s = form.querySelector('input[name="sort-m"]:checked'); if (s) state.sort = s.value;
    document.getElementById('sort').value = state.sort;
    render();
  }
  function clearAll() {
    state.cat = []; state.type = []; state.price = []; state.stock = false; state.q = '';
    syncForm(); render();
    FA.announce('Filters cleared. ' + FA.PRODUCTS.length + ' items.');
  }

  /* ---- bottom sheet (mobile) ---- */
  var sheet, backdrop, lastTrigger;
  var mq = window.matchMedia('(max-width: 899px)');
  function openSheet(mode, trigger) {
    lastTrigger = trigger;
    sheet.classList.add('is-open');
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    backdrop.hidden = false; document.body.classList.add('sheet-open');
    document.querySelectorAll('[data-open-sheet]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    document.getElementById('filters-title').textContent = mode === 'sort' ? 'Sort & filter' : 'Filter';
    var target = mode === 'sort' ? sheet.querySelector('input[name="sort-m"]:checked') : sheet.querySelector('.filters__close');
    window.setTimeout(function () { target.focus(); }, 30);
  }
  function closeSheet() {
    if (!sheet.classList.contains('is-open')) return;
    sheet.classList.remove('is-open');
    sheet.removeAttribute('role'); sheet.removeAttribute('aria-modal');
    backdrop.hidden = true; document.body.classList.remove('sheet-open');
    document.querySelectorAll('[data-open-sheet]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (lastTrigger) lastTrigger.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    form = document.getElementById('filter-form');
    results = document.getElementById('results');
    empty = document.getElementById('empty');
    chips = document.getElementById('chips');
    sheet = document.getElementById('filters');
    backdrop = document.querySelector('.sheet-backdrop');

    readURL(); syncForm(); render();

    form.addEventListener('change', fromForm);
    document.getElementById('sort').addEventListener('change', function (e) { state.sort = e.target.value; syncForm(); render(); });
    document.getElementById('search-form').addEventListener('submit', function (e) {
      e.preventDefault(); state.q = document.getElementById('q').value.trim(); render();
      FA.announce(document.querySelector('[data-result-count]').textContent + ' items found.');
    });
    document.querySelectorAll('.folder-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        var v = t.getAttribute('data-tab');
        state.cat = v ? [v] : [];
        syncForm(); render();
      });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) { clearAll(); return; }
      var chip = e.target.closest('[data-chip]');
      if (chip) {
        var k = chip.getAttribute('data-chip'), v = chip.getAttribute('data-val');
        if (k === 'q') state.q = '';
        else if (k === 'stock') state.stock = false;
        else state[k] = state[k].filter(function (x) { return x !== v; });
        syncForm(); render();
        var next = chips.querySelector('.chip') || document.getElementById('q');
        next.focus();
        return;
      }
      var opener = e.target.closest('[data-open-sheet]');
      if (opener) openSheet(opener.getAttribute('data-open-sheet'), opener);
    });
    sheet.querySelector('.filters__close').addEventListener('click', closeSheet);
    sheet.querySelector('.filters__done').addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSheet();
      if (e.key === 'Tab' && sheet.classList.contains('is-open')) {
        var f = Array.prototype.filter.call(sheet.querySelectorAll('button, input'), function (el) { return el.offsetParent !== null; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { if (!mq.matches) closeSheet(); });
  });
})();
