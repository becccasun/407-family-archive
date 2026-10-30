/* One-page checkout: Contact, Shipping, Payment -> confirmation. */
(function () {
  var FA = window.FA;
  var form, submitted = false;

  var RULES = {
    email: function (v) { return !v ? 'Enter your email address.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Enter an email like name@example.com.'); },
    name: function (v) { return v ? '' : 'Enter the name for the shipping label.'; },
    street: function (v) { return v ? '' : 'Enter a street address.'; },
    city: function (v) { return v ? '' : 'Enter a city.'; },
    state: function (v) { return v ? '' : 'Choose a state.'; },
    zip: function (v) { return !v ? 'Enter a ZIP code.' : (/^\d{5}(-\d{4})?$/.test(v) ? '' : 'ZIP should be 5 digits, like 48104.'); },
    card: function (v) { var d = v.replace(/\s/g, ''); return !d ? 'Enter a card number.' : (/^\d{15,16}$/.test(d) ? '' : 'Card number should be 15 or 16 digits.'); },
    ccname: function (v) { return v ? '' : 'Enter the name as it appears on the card.'; },
    exp: function (v) {
      if (!v) return 'Enter the expiry date.';
      var m = /^(\d{2})\/(\d{2})$/.exec(v);
      if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY, like 04/28.';
      var now = new Date(), y = 2000 + +m[2];
      if (y < now.getFullYear() || (y === now.getFullYear() && +m[1] < now.getMonth() + 1)) return 'This card has expired.';
      return '';
    },
    cvc: function (v) { return !v ? 'Enter the 3- or 4-digit code on the back.' : (/^\d{3,4}$/.test(v) ? '' : 'CVC should be 3 or 4 digits.'); }
  };
  var LABELS = { email: 'Email', name: 'Full name', street: 'Street address', city: 'City', state: 'State', zip: 'ZIP', card: 'Card number', ccname: 'Name on card', exp: 'Expiry', cvc: 'CVC' };

  function shipping() { return form.querySelector('input[name="ship"]:checked').value === 'express' ? 12 : 0; }

  function check(id) {
    var el = document.getElementById(id), msg = RULES[id](el.value.trim());
    document.getElementById(id + '-error').textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return msg;
  }

  function renderSummaries() {
    var ship = shipping();
    var common = { items: true, shipping: ship, shippingLabel: 'Shipping (insured, both ways)', taxLabel: 'Estimated tax' };
    var t = FA.renderSummary(document.getElementById('summary-desktop'), Object.assign({ prefix: 'sd', headingId: 'summary-title' }, common));
    FA.renderSummary(document.getElementById('summary-mobile'), Object.assign({ prefix: 'sm', heading: false }, common));
    document.querySelectorAll('[data-total]').forEach(function (el) { el.textContent = FA.money(t.total); });
    return t;
  }

  function showView(which) {
    document.getElementById('checkout-view').hidden = which !== 'checkout';
    document.getElementById('empty-view').hidden = which !== 'empty';
    document.getElementById('confirm-view').hidden = which !== 'confirm';
  }

  function submit(e) {
    e.preventDefault();
    submitted = true;
    var errors = Object.keys(RULES).map(function (id) { return [id, check(id)]; }).filter(function (x) { return x[1]; });
    var box = document.getElementById('error-summary');
    if (errors.length) {
      box.querySelector('ul').innerHTML = errors.map(function (x) { return '<li><a href="#' + x[0] + '">' + LABELS[x[0]] + ': ' + x[1] + '</a></li>'; }).join('');
      box.querySelector('h2').textContent = errors.length === 1 ? 'One thing needs fixing' : errors.length + ' things need fixing';
      box.hidden = false;
      box.focus();
      return;
    }
    box.hidden = true;
    var t = renderSummaries();
    var express = shipping() === 12;
    document.getElementById('confirm-email').textContent = document.getElementById('email').value.trim();
    document.getElementById('confirm-total').textContent = FA.money(t.total);
    document.getElementById('confirm-ship').innerHTML =
      '<div><dt>Ship to</dt><dd style="font-family:var(--font-serif)">' + FA.esc(document.getElementById('name').value.trim()) + ', ' + FA.esc(document.getElementById('city').value.trim()) + ', ' + FA.esc(document.getElementById('state').value) + '</dd></div>' +
      '<div><dt>Method</dt><dd>' + (express ? 'Express, 2 days' : 'Standard, 5–7 days') + '</dd></div>' +
      '<div><dt>Items</dt><dd>' + FA.cart.count() + '</dd></div>' +
      '<div><dt>Card</dt><dd>•••• ' + document.getElementById('card').value.replace(/\s/g, '').slice(-4) + '</dd></div>';
    FA.cart.clear();
    showView('confirm');
    document.title = 'Order filed · The Family Archive';
    window.scrollTo(0, 0);
    document.getElementById('confirm-title').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    form = document.getElementById('checkout-form');
    function boot() {
      if (!FA.cart.items().length) { showView('empty'); return; }
      showView('checkout');
      renderSummaries();
    }
    boot();

    form.addEventListener('submit', submit);
    form.addEventListener('change', function (e) { if (e.target.name === 'ship') renderSummaries(); });
    Object.keys(RULES).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('blur', function () { if (submitted || el.value) check(id); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) check(id); });
    });
    var card = document.getElementById('card');
    card.addEventListener('input', function () {
      var d = card.value.replace(/\D/g, '').slice(0, 16);
      card.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    var exp = document.getElementById('exp');
    exp.addEventListener('input', function (e) {
      var d = exp.value.replace(/\D/g, '').slice(0, 4);
      exp.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    });
    ['zip', 'cvc'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { el.value = el.value.replace(id === 'zip' ? /[^\d-]/g : /\D/g, ''); });
    });

    // error summary links focus the field
    document.getElementById('error-summary').addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      var f = document.getElementById(a.getAttribute('href').slice(1));
      f.focus(); f.scrollIntoView({ block: 'center' });
    });

    // mobile summary toggle
    var toggle = document.querySelector('.summary-toggle'), panel = document.getElementById('summary-mobile');
    function setToggle(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      toggle.querySelector('.toggle-text').textContent = open ? 'Hide order summary' : 'Show order summary';
    }
    toggle.addEventListener('click', function () { setToggle(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setToggle(false); toggle.focus(); } });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-load-sample]')) { FA.cart.loadSample(); boot(); FA.announce('Sample order loaded.'); }
    });
    document.addEventListener('fa:cart', function () {
      if (!document.getElementById('checkout-view').hidden) {
        if (!FA.cart.items().length) showView('empty'); else renderSummaries();
      }
    });
  });
})();
