/* Cart page */
(function () {
  var FA = window.FA;
  var root;

  function render(focusKey) {
    var items = FA.cart.items();
    if (!items.length) {
      root.innerHTML = '<div class="empty" style="margin-bottom:var(--section-y)">' +
        '<h2 class="h3">Your drawer is empty.</h2>' +
        '<p class="muted">Nothing filed yet. Start with a kit, or browse everything.</p>' +
        '<div class="btn-row" style="justify-content:center"><a class="btn btn--primary" href="catalogue.html">Browse the catalogue</a>' +
        '<button class="btn btn--secondary" type="button" data-load-sample>Load the sample order</button></div></div>';
      return;
    }
    var lines = items.map(function (l) {
      var p = FA.getProduct(l.id), size = FA.cart.sizeLabel(l), unit = FA.cart.price(l);
      var nm = FA.esc(p.name) + (size ? ', ' + size : '');
      return '<li class="line" data-key="' + l.key + '">' +
        '<a class="line__img" href="product.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">' + FA.img(p.images[0], { decorative: true }) + '</a>' +
        '<div class="line__info">' +
          '<h3 class="line__name"><a href="product.html?id=' + p.id + '">' + FA.esc(p.name) + '</a></h3>' +
          '<p class="line__opt">' + (size ? 'Size: ' + size + ' · ' : '') + p.type + ' · ' + FA.money(unit) + ' each · <span class="catno">' + p.id + '</span></p></div>' +
        '<div class="line__controls">' +
          '<div class="stepper stepper--sm" role="group" aria-label="Quantity for ' + nm + '">' +
            '<button type="button" data-qty="-1" aria-label="Decrease quantity of ' + nm + '"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button>' +
            '<input type="number" min="1" max="99" value="' + l.qty + '" aria-label="Quantity of ' + nm + '" data-qty-input>' +
            '<button type="button" data-qty="1" aria-label="Increase quantity of ' + nm + '"' + (l.qty >= 99 ? ' disabled' : '') + '>+</button></div>' +
          '<button class="btn btn--tertiary" type="button" data-remove aria-label="Remove ' + nm + '">Remove</button>' +
          '<span class="line__total">' + FA.money(unit * l.qty) + '</span>' +
        '</div></li>';
    }).join('');
    root.innerHTML = '<div class="cart-layout"><section aria-labelledby="items-title"><h2 id="items-title" class="sr-only">Items</h2>' +
      '<p class="toolbar__count" style="margin-bottom:12px">' + FA.cart.count() + ' item' + (FA.cart.count() === 1 ? '' : 's') + ' in your drawer</p>' +
      '<ul class="lines">' + lines + '</ul>' +
      '<p style="margin-top:20px"><a class="btn btn--tertiary" href="catalogue.html">← Keep browsing</a></p></section>' +
      '<aside class="summary" id="cart-summary" aria-labelledby="sum-title"></aside></div>';
    FA.renderSummary(document.getElementById('cart-summary'), {
      prefix: 'sum', freeLabel: 'Free (prepaid box)',
      cta: '<a class="btn btn--primary btn--block" href="checkout.html">Checkout</a><p class="hint">Shipping is free both ways on every order. Tax is estimated at 6% (Michigan).</p>'
    });
    if (focusKey) {
      var el = root.querySelector('[data-key="' + focusKey + '"] [data-qty-input]');
      if (el) el.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('cart-root');
    render();
    root.addEventListener('click', function (e) {
      var line = e.target.closest('.line');
      if (e.target.closest('[data-qty]') && line) {
        var key = line.getAttribute('data-key');
        var cur = FA.cart.items().filter(function (l) { return l.key === key; })[0];
        var btn = e.target.closest('[data-qty]');
        FA.cart.setQty(key, cur.qty + (+btn.getAttribute('data-qty')));
        var sel = '[data-key="' + key + '"] [data-qty="' + btn.getAttribute('data-qty') + '"]';
        var again = root.querySelector(sel);
        if (again && !again.disabled) again.focus(); else { var i = root.querySelector('[data-key="' + key + '"] [data-qty-input]'); if (i) i.focus(); }
        FA.announce('Quantity updated.');
      } else if (e.target.closest('[data-remove]') && line) {
        var p = FA.getProduct(line.getAttribute('data-key').split(':')[0]);
        FA.cart.remove(line.getAttribute('data-key'));
        FA.announce(p.name + ' removed from cart.');
        var h = document.querySelector('main h1'); h.setAttribute('tabindex', '-1'); h.focus();
      }
    });
    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-qty-input]')) return;
      var key = e.target.closest('.line').getAttribute('data-key');
      FA.cart.setQty(key, parseInt(e.target.value, 10) || 1);
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-load-sample]')) { FA.cart.loadSample(); FA.announce('Sample order loaded.'); }
    });
    document.addEventListener('fa:cart', function () { render(); });
  });
})();
