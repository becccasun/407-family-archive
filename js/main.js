/* The Family Archive — cart store + shared UI (header, drawer, cards, footer). */
(function () {
  var FA = window.FA = window.FA || {};
  FA.base = document.documentElement.getAttribute('data-base') || '';
  FA.url = function (path) { return FA.base + path; };

  /* ---------- storage (always wrapped: private windows can throw) ---------- */
  var CART_KEY = 'fa-cart-v1', PROMO_KEY = 'fa-promo-v1';
  var memory = {};
  function read(key, fallback) {
    try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return key in memory ? memory[key] : fallback; }
  }
  function write(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }

  /* ---------- cart ---------- */
  var PROMOS = { ARCHIVE10: { label: 'ARCHIVE10 — 10% off', rate: 0.10 } };
  var TAX_RATE = 0.06;

  function itemPrice(line) {
    var p = FA.getProduct(line.id); if (!p) return 0;
    if (p.sizes && line.size) {
      for (var i = 0; i < p.sizes.length; i++) if (p.sizes[i].id === line.size) return p.sizes[i].price;
    }
    return p.price;
  }
  function sizeLabel(line) {
    var p = FA.getProduct(line.id);
    if (!p || !p.sizes) return '';
    for (var i = 0; i < p.sizes.length; i++) if (p.sizes[i].id === line.size) return p.sizes[i].label;
    return '';
  }

  FA.cart = {
    items: function () {
      var items = read(CART_KEY, []);
      if (!Array.isArray(items)) return [];
      return items.filter(function (l) { return l && FA.getProduct(l.id) && l.qty > 0; });
    },
    save: function (items) { write(CART_KEY, items); FA.updateCartCount(); document.dispatchEvent(new CustomEvent('fa:cart')); },
    add: function (id, qty, size) {
      var items = this.items(), key = id + (size ? ':' + size : '');
      qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
      var found = items.filter(function (l) { return l.key === key; })[0];
      if (found) found.qty = Math.min(99, found.qty + qty);
      else items.push({ key: key, id: id, size: size || null, qty: qty });
      this.save(items);
    },
    setQty: function (key, qty) {
      var items = this.items();
      items.forEach(function (l) { if (l.key === key) l.qty = Math.max(1, Math.min(99, qty)); });
      this.save(items);
    },
    remove: function (key) { this.save(this.items().filter(function (l) { return l.key !== key; })); },
    clear: function () { this.save([]); write(PROMO_KEY, null); },
    count: function () { return this.items().reduce(function (n, l) { return n + l.qty; }, 0); },
    loadSample: function () {
      this.save([{ key: 'FA-K01:M', id: 'FA-K01', size: 'M', qty: 1 }, { key: 'FA-P01', id: 'FA-P01', size: null, qty: 1 }]);
    },
    price: itemPrice,
    sizeLabel: sizeLabel,
    promo: function () { var c = read(PROMO_KEY, null); return c && PROMOS[c] ? c : null; },
    applyPromo: function (code) {
      code = String(code || '').trim().toUpperCase();
      if (!PROMOS[code]) return false;
      write(PROMO_KEY, code); document.dispatchEvent(new CustomEvent('fa:cart')); return true;
    },
    removePromo: function () { write(PROMO_KEY, null); document.dispatchEvent(new CustomEvent('fa:cart')); },
    totals: function (shipping) {
      var subtotal = this.items().reduce(function (s, l) { return s + itemPrice(l) * l.qty; }, 0);
      var code = this.promo();
      var discount = code ? Math.round(subtotal * PROMOS[code].rate * 100) / 100 : 0;
      shipping = shipping || 0;
      var tax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100;
      return { subtotal: subtotal, discount: discount, promo: code, promoLabel: code ? PROMOS[code].label : '', shipping: shipping, tax: tax, total: Math.round((subtotal - discount + shipping + tax) * 100) / 100 };
    }
  };

  FA.updateCartCount = function () {
    var n = FA.cart.count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; });
    document.querySelectorAll('[data-cart-label]').forEach(function (el) {
      el.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items'));
    });
  };

  /* ---------- small helpers ---------- */
  FA.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  FA.img = function (key, opts) {
    opts = opts || {};
    var im = FA.IMAGES[key];
    var alt = opts.decorative ? '' : im.alt;
    return '<img src="' + FA.url(im.url) + '" alt="' + FA.esc(alt) + '" width="' + im.w + '" height="' + im.h + '"' +
      (opts.eager ? '' : ' loading="lazy"') + ' decoding="async">';
  };
  FA.announce = function (msg) {
    var el = document.getElementById('fa-live');
    if (!el) return;
    el.textContent = '';
    window.setTimeout(function () { el.textContent = msg; }, 50);
  };

  /* Index-card product card */
  FA.card = function (p, opts) {
    opts = opts || {};
    var href = FA.url('product.html?id=' + p.id);
    var from = p.sizes ? 'From ' + FA.moneyShort(p.price) : FA.moneyShort(p.price);
    var action;
    if (p.soldOut) action = '<button class="btn btn--disabled btn--sm" type="button" disabled>Sold out</button>';
    else if (p.sizes) action = '<a class="btn btn--secondary btn--sm card__action" href="' + href + '">Choose size<span class="sr-only"> for ' + FA.esc(p.name) + '</span></a>';
    else action = '<button class="btn btn--secondary btn--sm card__action" type="button" data-add="' + p.id + '">Add<span class="sr-only"> ' + FA.esc(p.name) + ' to cart</span></button>';
    var badge = p.isNew ? '<span class="tag tag--solid">New</span>' : (p.featured ? '<span class="tag">Featured</span>' : '');
    var H = opts.heading || 'h3';
    return '<article class="card' + (p.soldOut ? ' card--soldout' : '') + '">' +
      '<div class="card__top"><span class="catno">' + p.id + '</span>' + badge + '</div>' +
      '<div class="card__media">' + FA.img(p.images[0]) + (p.soldOut ? '<span class="stamp" aria-hidden="true">Sold out</span>' : '') + '</div>' +
      '<div class="card__body">' +
        '<p class="card__cat">' + FA.esc(p.category) + ' · ' + p.type + '</p>' +
        '<' + H + ' class="card__title"><a class="card__link" href="' + href + '">' + FA.esc(p.name) + '</a></' + H + '>' +
      '</div>' +
      '<div class="card__foot"><span class="price">' + from + (p.soldOut ? '<span class="sr-only"> (sold out)</span>' : '') + '</span>' + action + '</div>' +
    '</article>';
  };

  /* Delegated "Add" buttons on cards */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var p = FA.getProduct(btn.getAttribute('data-add'));
    if (!p) return;
    FA.cart.add(p.id, 1, null);
    var original = btn.innerHTML;
    btn.innerHTML = 'Added ✓<span class="sr-only"> ' + FA.esc(p.name) + '</span>';
    FA.announce(p.name + ' added to cart. Cart has ' + FA.cart.count() + ' items.');
    window.setTimeout(function () { btn.innerHTML = original; }, 1600);
  });

  /* ---------- mobile nav drawer ---------- */
  function initDrawer() {
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.getElementById('nav-drawer');
    if (!toggle || !drawer) return;
    function open() {
      drawer.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.querySelector('.nav-toggle__label').textContent = 'Close';
      document.body.classList.add('drawer-open');
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    }
    function close(returnFocus) {
      drawer.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.nav-toggle__label').textContent = 'Menu';
      document.body.classList.remove('drawer-open');
      if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { drawer.hidden ? open() : close(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) close(true);
    });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = drawer.querySelectorAll('a, button, input');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900 && !drawer.hidden) close(false); });
  }

  /* ---------- newsletter (footer) ---------- */
  function initNewsletter() {
    var form = document.getElementById('newsletter');
    if (!form) return;
    var input = form.querySelector('input'), err = document.getElementById('newsletter-error'), ok = document.getElementById('newsletter-ok');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        err.textContent = v ? 'That email doesn’t look right. Try name@example.com.' : 'Enter your email to sign up.';
        input.setAttribute('aria-invalid', 'true'); ok.textContent = ''; input.focus(); return;
      }
      input.removeAttribute('aria-invalid'); err.textContent = '';
      ok.textContent = 'Filed. You’ll get one letter a month, nothing more.';
      form.reset();
    });
  }

  /* ---------- accordions (shared) ---------- */
  FA.initAccordions = function (root) {
    (root || document).querySelectorAll('.accordion__trigger').forEach(function (btn) {
      if (btn.dataset.bound) return; btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    FA.updateCartCount();
    initDrawer();
    initNewsletter();
    FA.initAccordions();
    document.querySelectorAll('[data-render-featured]').forEach(function (el) {
      var ids = el.getAttribute('data-render-featured').split(',');
      el.innerHTML = ids.map(function (id) { return FA.card(FA.getProduct(id)); }).join('');
    });
  });
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) { FA.updateCartCount(); document.dispatchEvent(new CustomEvent('fa:cart')); } });
})();
