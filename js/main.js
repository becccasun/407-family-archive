/* The Family Archive: cart + saved stores and shared UI (header, drawer, cards, quick view, toast, footer). */
(function () {
  var FA = window.FA = window.FA || {};
  FA.base = document.documentElement.getAttribute('data-base') || '';
  FA.url = function (path) { return FA.base + path; };

  /* ---------- storage (always wrapped: private windows can throw) ---------- */
  var CART_KEY = 'fa-cart-v1', PROMO_KEY = 'fa-promo-v1', SAVED_KEY = 'fa-saved-v1';
  var memory = {};
  function read(key, fallback) {
    try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : (key in memory ? memory[key] : fallback); }
    catch (e) { return key in memory ? memory[key] : fallback; }
  }
  function write(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* memory only */ }
  }
  function lineKey(id, size) { return id + (size ? ':' + size : ''); }

  /* ---------- small helpers ---------- */
  FA.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  FA.icon = function (name, cls) {
    return '<svg class="' + (cls || 'icon') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
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
  FA.sizeOf = function (p, sizeId) {
    if (!p || !p.sizes) return null;
    for (var i = 0; i < p.sizes.length; i++) if (p.sizes[i].id === sizeId) return p.sizes[i];
    return null;
  };

  /* ---------- cart ---------- */
  var PROMOS = { ARCHIVE10: { label: 'ARCHIVE10 · 10% off', rate: 0.10 } };
  var TAX_RATE = 0.06;

  function itemPrice(line) {
    var p = FA.getProduct(line.id); if (!p) return 0;
    var s = FA.sizeOf(p, line.size);
    return s ? s.price : p.price;
  }
  function sizeLabel(line) { var s = FA.sizeOf(FA.getProduct(line.id), line.size); return s ? s.label : ''; }

  FA.cart = {
    items: function () {
      var items = read(CART_KEY, []);
      if (!Array.isArray(items)) return [];
      return items.filter(function (l) { return l && FA.getProduct(l.id) && l.qty > 0; });
    },
    save: function (items) { write(CART_KEY, items); FA.updateCounts(); document.dispatchEvent(new CustomEvent('fa:cart')); },
    add: function (id, qty, size) {
      var items = this.items(), key = lineKey(id, size);
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

  /* ---------- saved for later ---------- */
  FA.saved = {
    items: function () {
      var items = read(SAVED_KEY, []);
      if (!Array.isArray(items)) return [];
      return items.filter(function (s) { return s && FA.getProduct(s.id); });
    },
    write: function (items) { write(SAVED_KEY, items); FA.updateCounts(); FA.syncSaveButtons(); document.dispatchEvent(new CustomEvent('fa:saved')); },
    has: function (id) { return this.items().some(function (s) { return s.id === id; }); },
    add: function (id, size, qty) {
      var key = lineKey(id, size);
      var items = this.items().filter(function (s) { return s.key !== key; });
      items.unshift({ key: key, id: id, size: size || null, qty: Math.max(1, qty || 1) });
      this.write(items);
    },
    remove: function (key) { this.write(this.items().filter(function (s) { return s.key !== key; })); },
    removeId: function (id) { this.write(this.items().filter(function (s) { return s.id !== id; })); },
    toggle: function (id, size) { if (this.has(id)) { this.removeId(id); return false; } this.add(id, size, 1); return true; },
    count: function () { return this.items().length; }
  };

  var lastCartCount = null;
  FA.updateCounts = function () {
    var n = FA.cart.count(), s = FA.saved.count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; });
    document.querySelectorAll('[data-saved-count]').forEach(function (el) { el.textContent = s; });
    document.querySelectorAll('[data-cart-label]').forEach(function (el) {
      el.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items'));
    });
    if (lastCartCount !== null && n > lastCartCount) {
      document.querySelectorAll('[data-cart-bump]').forEach(function (el) {
        el.classList.remove('is-bumping'); void el.offsetWidth; el.classList.add('is-bumping');
      });
    }
    lastCartCount = n;
  };
  FA.updateCartCount = FA.updateCounts;

  /* ---------- save buttons (cards, quick view, product page) ---------- */
  function saveText(p, on) { return on ? 'Saved' : (p.soldOut ? 'Save for when it’s back' : 'Save'); }
  FA.saveButton = function (p, cls) {
    var on = FA.saved.has(p.id);
    return '<button class="btn btn--secondary ' + (cls || '') + ' save-btn" type="button" data-save="' + p.id + '" aria-pressed="' + on + '">' +
      FA.icon(on ? 'heart-filled' : 'heart') + '<span class="save-btn__label">' + saveText(p, on) + '</span><span class="sr-only"> ' + FA.esc(p.name) + '</span></button>';
  };
  FA.syncSaveButtons = function () {
    document.querySelectorAll('[data-save]').forEach(function (b) {
      var p = FA.getProduct(b.getAttribute('data-save')); if (!p) return;
      var on = FA.saved.has(p.id);
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('use').setAttribute('href', on ? '#i-heart-filled' : '#i-heart');
      b.querySelector('.save-btn__label').textContent = saveText(p, on);
    });
  };

  /* ---------- shared form bits ---------- */
  FA.sizeOptions = function (p, name, checkedId) {
    return '<fieldset><legend class="label">Size: how much do you have?</legend><div class="options options--3">' +
      p.sizes.map(function (s) {
        return '<label class="option"><input type="radio" name="' + name + '" value="' + s.id + '"' + (s.id === checkedId ? ' checked' : '') + '>' +
          '<span class="option__box"><span class="option__dot" aria-hidden="true"></span><span class="option__name">' + s.label + '</span>' +
          '<span class="option__detail">' + s.detail + '</span><span class="option__price">' + FA.moneyShort(s.price) + '</span></span></label>';
      }).join('') + '</div></fieldset>';
  };
  FA.stepper = function (id) {
    return '<div class="stepper"><button type="button" data-step="-1" aria-label="Decrease quantity" disabled>' + FA.icon('minus') + '</button>' +
      '<input id="' + id + '" type="number" inputmode="numeric" min="1" max="99" value="1"><button type="button" data-step="1" aria-label="Increase quantity">' + FA.icon('plus') + '</button></div>';
  };

  /* Index-card product card */
  FA.card = function (p, opts) {
    opts = opts || {};
    var href = FA.url(FA.productUrl(p));
    var from = p.sizes ? 'From ' + FA.moneyShort(p.price) : FA.moneyShort(p.price);
    var add = p.soldOut
      ? '<button class="btn btn--disabled btn--sm card__add" type="button" disabled>Sold out<span class="sr-only">: ' + FA.esc(p.name) + '</span></button>'
      : '<button class="btn btn--primary btn--sm card__add" type="button" data-add="' + p.id + '"' + (p.sizes ? ' aria-haspopup="dialog"' : '') + '>' +
        '<span class="card__add-label">Add to cart</span><span class="sr-only">: ' + FA.esc(p.name) + (p.sizes ? ', choose a size' : '') + '</span></button>';
    var badge = p.isNew ? '<span class="tag tag--solid">New</span>' : (p.featured ? '<span class="tag">Featured</span>' : '');
    var H = opts.heading || 'h3';
    return '<article class="card' + (p.soldOut ? ' card--soldout' : '') + '">' +
      '<div class="card__media">' + FA.img(p.images[0]) + (badge ? '<span class="card__badge">' + badge + '</span>' : '') + (p.soldOut ? '<span class="stamp" aria-hidden="true">Sold out</span>' : '') +
        '<button class="icon-btn card__quick" type="button" data-quick="' + p.id + '" aria-haspopup="dialog" aria-label="Quick view: ' + FA.esc(p.name) + '" data-tip="Quick view">' + FA.icon('eye') + '</button>' +
      '</div>' +
      '<div class="card__body">' +
        '<' + H + ' class="card__title"><a class="card__link" href="' + href + '">' + FA.esc(p.name) + '</a></' + H + '>' +
        '<p class="card__meta"><span class="price">' + from + (p.soldOut ? '<span class="sr-only"> (sold out)</span>' : '') + '</span></p>' +
      '</div>' +
      '<div class="card__foot">' + add + FA.saveButton(p, 'btn--sm card__save') + '</div>' +
    '</article>';
  };

  /* ---------- toast: "Added to your cart" ---------- */
  var toastRegion, toastTimer, toastLeft = 0, toastStart = 0, TOAST_MS = 5000;
  function toastEl() {
    if (toastRegion) return toastRegion;
    toastRegion = document.createElement('div');
    toastRegion.className = 'toast-region';
    toastRegion.setAttribute('aria-live', 'polite');
    toastRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastRegion);
    toastRegion.addEventListener('click', function (e) { if (e.target.closest('[data-toast-close]')) hideToast(); });
    toastRegion.addEventListener('mouseenter', pauseToast);
    toastRegion.addEventListener('mouseleave', resumeToast);
    toastRegion.addEventListener('focusin', pauseToast);
    toastRegion.addEventListener('focusout', function (e) { if (!toastRegion.contains(e.relatedTarget)) resumeToast(); });
    return toastRegion;
  }
  function pauseToast() { if (!toastTimer) return; window.clearTimeout(toastTimer); toastTimer = null; toastLeft -= Date.now() - toastStart; }
  function resumeToast() {
    if (toastTimer || !toastRegion || !toastRegion.querySelector('.toast.is-in')) return;
    toastStart = Date.now(); toastTimer = window.setTimeout(function () { hideToast(); }, Math.max(1500, toastLeft));
  }
  function hideToast() {
    window.clearTimeout(toastTimer); toastTimer = null;
    var t = toastRegion && toastRegion.querySelector('.toast');
    if (!t) return;
    if (t.contains(document.activeElement)) { var m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); }
    t.classList.remove('is-in');
    window.setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
  }
  FA.toastAdded = function (p, size, qty) {
    var r = toastEl();
    window.clearTimeout(toastTimer);
    var s = FA.sizeOf(p, size);
    r.innerHTML = '<div class="toast">' +
      '<span class="toast__thumb">' + FA.img(p.images[0], { decorative: true, eager: true }) + '</span>' +
      '<div class="toast__text"><p class="toast__title">' + FA.icon('check') + 'Added to your cart</p>' +
        '<p class="toast__item">' + FA.esc(p.name) + (s ? ', ' + s.label : '') + ' · Qty ' + qty + '</p></div>' +
      '<button class="icon-btn toast__close" type="button" data-toast-close aria-label="Dismiss" data-tip="Dismiss">' + FA.icon('close') + '</button>' +
      '<a class="btn btn--secondary btn--sm toast__cta" href="' + FA.url('cart.html') + '">' + FA.icon('cart') + 'View cart</a>' +
    '</div>';
    var t = r.firstChild;
    void t.offsetWidth;
    t.classList.add('is-in');
    toastLeft = TOAST_MS; toastStart = Date.now();
    toastTimer = window.setTimeout(function () { hideToast(); }, TOAST_MS);
  };
  FA.addToCart = function (p, qty, size) {
    FA.cart.add(p.id, qty, size);
    FA.toastAdded(p, size, Math.max(1, Math.min(99, parseInt(qty, 10) || 1)));
  };

  /* ---------- quick view dialog ---------- */
  var qv, qvTrigger, qvOnAdded;
  function qvBuild() {
    if (qv) return qv;
    qv = document.createElement('div');
    qv.className = 'qv-overlay';
    qv.hidden = true;
    qv.innerHTML = '<div class="qv" role="dialog" aria-modal="true" aria-labelledby="qv-title"></div>';
    document.body.appendChild(qv);
    qv.addEventListener('mousedown', function (e) { if (e.target === qv) qvClose(); });
    qv.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); qvClose(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(qv.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])'), function (el) { return el.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1], cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur.id === 'qv-title')) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return qv;
  }
  FA.quickView = function (id, trigger, opts) {
    var p = FA.getProduct(id); if (!p) return;
    opts = opts || {};
    qvBuild();
    hideToast();
    qvTrigger = trigger || document.activeElement;
    qvOnAdded = opts.onAdded || null;
    var startSize = opts.size || (p.sizes ? p.sizes[1].id : null);
    var unit = function (sz) { var s = FA.sizeOf(p, sz); return s ? s.price : p.price; };
    var dialog = qv.querySelector('.qv');
    dialog.innerHTML =
      '<button class="icon-btn qv__close" type="button" data-qv-close aria-label="Close quick view" data-tip="Close">' + FA.icon('close') + '</button>' +
      '<div class="qv__grid">' +
        '<div class="qv__media"><div class="figure__frame">' + FA.img(p.images[0], { eager: true }) + (p.soldOut ? '<span class="stamp" aria-hidden="true">Sold out</span>' : '') + '</div></div>' +
        '<form class="qv__info" novalidate>' +
          '<h2 id="qv-title" tabindex="-1">' + FA.esc(p.name) + '</h2>' +
          '<p class="pdp__price"><span data-qv-price>' + FA.moneyShort(unit(startSize)) + '</span>' + (p.unit ? '<small>' + p.unit + '</small>' : '') +
            (p.soldOut ? '<span class="sr-only"> (sold out)</span>' : '') + '</p>' +
          '<div class="pdp__meta"><span class="tag">' + FA.esc(p.category) + '</span>' + (p.soldOut ? '<span class="tag tag--alert">Sold out</span>' : '') + '</div>' +
          '<p>' + FA.esc(p.blurb) + '</p>' +
          (p.sizes && !p.soldOut ? FA.sizeOptions(p, 'qv-size', startSize) : '') +
          (p.soldOut ? '' : '<div class="field"><label for="qv-qty">Quantity</label>' + FA.stepper('qv-qty') + '</div>') +
          '<div class="qv__actions">' +
            (p.soldOut ? '<button class="btn btn--disabled" type="button" disabled>Sold out</button>'
                       : '<button class="btn btn--primary" type="submit">Add to cart</button>') +
            FA.saveButton(p) +
          '</div>' +
          '<a class="qv__more" href="' + FA.url(FA.productUrl(p)) + '">See full details</a>' +
        '</form>' +
      '</div>';
    var form = dialog.querySelector('form'), qty = dialog.querySelector('#qv-qty');
    function q() { var n = parseInt(qty.value, 10); return isNaN(n) ? 1 : Math.max(1, Math.min(99, n)); }
    function size() { var c = form.querySelector('input[name="qv-size"]:checked'); return c ? c.value : null; }
    function update() {
      if (!qty) return;
      dialog.querySelector('[data-qv-price]').textContent = FA.moneyShort(unit(size()));
      form.querySelector('[data-step="-1"]').disabled = q() <= 1;
      form.querySelector('[data-step="1"]').disabled = q() >= 99;
    }
    if (qty) {
      form.addEventListener('change', function (e) { if (e.target === qty) qty.value = q(); update(); });
      qty.addEventListener('input', update);
      form.querySelectorAll('[data-step]').forEach(function (b) {
        b.addEventListener('click', function () { qty.value = q() + (+b.getAttribute('data-step')); qty.value = q(); update(); if (b.disabled) qty.focus(); });
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (p.soldOut) return;
      var sz = size(), n = q(), cb = qvOnAdded;
      qvClose();
      FA.addToCart(p, n, sz);
      if (cb) cb(sz, n);
    });
    dialog.querySelector('[data-qv-close]').addEventListener('click', qvClose);
    qv.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(function () { dialog.querySelector('#qv-title').focus(); }, 20);
  };
  function qvClose() {
    if (!qv || qv.hidden) return;
    qv.hidden = true;
    document.body.classList.remove('modal-open');
    var t = qvTrigger; qvTrigger = null; qvOnAdded = null;
    if (t && document.body.contains(t)) t.focus();
  }
  FA.closeQuickView = qvClose;

  /* ---------- delegated card actions ---------- */
  document.addEventListener('click', function (e) {
    var quick = e.target.closest('[data-quick]');
    if (quick) { FA.quickView(quick.getAttribute('data-quick'), quick); return; }

    var save = e.target.closest('[data-save]');
    if (save) {
      var sp = FA.getProduct(save.getAttribute('data-save')); if (!sp) return;
      var sizeInput = save.form && save.form.querySelector('input[type="radio"]:checked');
      var on = FA.saved.toggle(sp.id, sizeInput ? sizeInput.value : null);
      FA.announce(on ? sp.name + ' saved. Find it in your cart under Saved for later.' : sp.name + ' removed from saved.');
      return;
    }

    var btn = e.target.closest('[data-add]');
    if (!btn) return;
    var p = FA.getProduct(btn.getAttribute('data-add'));
    if (!p) return;
    if (p.sizes) { FA.quickView(p.id, btn); return; }
    FA.addToCart(p, 1, null);
    var label = btn.querySelector('.card__add-label');
    if (label && !btn.dataset.busy) {
      btn.dataset.busy = '1';
      label.innerHTML = FA.icon('check') + 'Added';
      window.setTimeout(function () { label.textContent = 'Add to cart'; delete btn.dataset.busy; }, 1600);
    }
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
    drawer.addEventListener('click', function (e) { if (e.target.closest('a[href*="#"]')) close(false); });
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
      ok.textContent = 'You’re on the list. One letter a month, nothing more.';
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
    FA.updateCounts();
    initDrawer();
    initNewsletter();
    FA.initAccordions();
    document.querySelectorAll('[data-render-featured]').forEach(function (el) {
      var ids = el.getAttribute('data-render-featured').split(',');
      el.innerHTML = ids.map(function (id) { return FA.card(FA.getProduct(id)); }).join('');
    });
  });
  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) { FA.updateCounts(); document.dispatchEvent(new CustomEvent('fa:cart')); }
    if (e.key === SAVED_KEY) { FA.updateCounts(); FA.syncSaveButtons(); document.dispatchEvent(new CustomEvent('fa:saved')); }
  });
})();
