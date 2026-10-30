/* Order summary block shared by cart + checkout. */
(function () {
  var FA = window.FA;

  FA.renderSummary = function (el, opts) {
    var pre = opts.prefix || 'sum';
    var t = FA.cart.totals(opts.shipping || 0);
    var items = FA.cart.items();
    var list = '';
    if (opts.items) {
      list = '<ul class="summary-items">' + items.map(function (l) {
        var p = FA.getProduct(l.id), size = FA.cart.sizeLabel(l);
        return '<li><span class="line__img">' + FA.img(p.images[0], { decorative: true }) + '<span class="qty-badge" aria-hidden="true">' + l.qty + '</span></span>' +
          '<span class="nm">' + FA.esc(p.name) + '<span>' + p.id + (size ? ' · ' + size : '') + ' · Qty ' + l.qty + '</span></span>' +
          '<span class="pr">' + FA.money(FA.cart.price(l) * l.qty) + '</span></li>';
      }).join('') + '</ul><hr>';
    }
    var promo = t.promo
      ? '<p class="promo-ok"><span>Code <strong class="mono">' + t.promo + '</strong> applied</span><button class="btn btn--tertiary" type="button" data-remove-promo>Remove</button></p>'
      : '<form class="promo" data-promo novalidate><label class="label" for="' + pre + '-promo">Promo code</label>' +
        '<div class="promo-row" style="margin-top:6px"><input class="input" id="' + pre + '-promo" name="promo" autocomplete="off" placeholder="e.g. ARCHIVE10" aria-describedby="' + pre + '-promo-error">' +
        '<button class="btn btn--secondary" type="submit">Apply</button></div><p class="field-error" id="' + pre + '-promo-error" aria-live="polite"></p></form>';

    el.innerHTML =
      (opts.heading === false ? '' : '<h2 id="' + (opts.headingId || pre + '-title') + '">Order summary</h2>') +
      list + promo +
      '<dl class="totals">' +
        '<div><dt>Subtotal</dt><dd>' + FA.money(t.subtotal) + '</dd></div>' +
        (t.discount ? '<div><dt>Discount (' + t.promo + ')</dt><dd>−' + FA.money(t.discount) + '</dd></div>' : '') +
        '<div><dt>' + (opts.shippingLabel || 'Shipping') + '</dt><dd>' + (t.shipping ? FA.money(t.shipping) : (opts.freeLabel || 'Free')) + '</dd></div>' +
        '<div><dt>' + (opts.taxLabel || 'Est. tax (6%)') + '</dt><dd>' + FA.money(t.tax) + '</dd></div>' +
        '<div class="grand"><dt>Total</dt><dd>' + FA.money(t.total) + '</dd></div>' +
      '</dl>' + (opts.cta || '');

    var f = el.querySelector('[data-promo]');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input'), err = f.querySelector('.field-error');
      if (!input.value.trim()) { err.textContent = 'Enter a code first.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      if (!FA.cart.applyPromo(input.value)) { err.textContent = 'That code isn’t on file. Check the spelling and try again.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      FA.announce('Promo code applied.');
    });
    var r = el.querySelector('[data-remove-promo]');
    if (r) r.addEventListener('click', function () { FA.cart.removePromo(); FA.announce('Promo code removed.'); });
    return t;
  };
})();
