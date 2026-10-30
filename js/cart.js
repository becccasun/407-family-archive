/* Cart page: line items, summary, and "Saved for later". */
(function () {
  var FA = window.FA;
  var root, savedRoot;

  function stepBtn(dir, nm, disabled) {
    return '<button type="button" data-qty="' + dir + '" aria-label="' + (dir < 0 ? 'Decrease' : 'Increase') + ' quantity of ' + nm + '"' + (disabled ? ' disabled' : '') + '>' + FA.icon(dir < 0 ? 'minus' : 'plus') + '</button>';
  }

  function render() {
    var items = FA.cart.items();
    if (!items.length) {
      root.innerHTML = '<div class="empty">' +
        '<h2 class="h3">Your cart is empty.</h2>' +
        '<p class="muted">Nothing here yet. Most people start with a kit.</p>' +
        '<div class="btn-row" style="justify-content:center"><a class="btn btn--primary" href="catalogue.html">Browse the catalogue</a></div></div>';
      return;
    }
    var lines = items.map(function (l) {
      var p = FA.getProduct(l.id), size = FA.cart.sizeLabel(l), unit = FA.cart.price(l), href = FA.productUrl(p);
      var nm = FA.esc(p.name) + (size ? ', ' + size : '');
      return '<li class="line" data-key="' + l.key + '">' +
        '<a class="line__img" href="' + href + '" tabindex="-1" aria-hidden="true">' + FA.img(p.images[0], { decorative: true }) + '</a>' +
        '<div class="line__info">' +
          '<h3 class="line__name"><a href="' + href + '">' + FA.esc(p.name) + '</a></h3>' +
          '<p class="line__opt">' + (size ? 'Size: ' + size + ' · ' : '') + FA.money(unit) + ' each</p></div>' +
        '<div class="line__controls">' +
          '<div class="stepper stepper--sm" role="group" aria-label="Quantity for ' + nm + '">' + stepBtn(-1, nm, l.qty <= 1) +
            '<input type="number" min="1" max="99" value="' + l.qty + '" aria-label="Quantity of ' + nm + '" data-qty-input>' + stepBtn(1, nm, l.qty >= 99) + '</div>' +
          '<div class="line__links"><button class="btn btn--tertiary" type="button" data-later aria-label="Save ' + nm + ' for later">Save for later</button>' +
          '<button class="btn btn--tertiary" type="button" data-remove aria-label="Remove ' + nm + '">Remove</button></div>' +
          '<span class="line__total">' + FA.money(unit * l.qty) + '</span>' +
        '</div></li>';
    }).join('');
    var n = FA.cart.count();
    root.innerHTML = '<div class="cart-layout"><section aria-labelledby="items-title"><h2 id="items-title" class="sr-only">Items</h2>' +
      '<p class="toolbar__count" style="margin-bottom:12px">' + n + ' item' + (n === 1 ? '' : 's') + ' in your cart</p>' +
      '<ul class="lines">' + lines + '</ul>' +
      '<p style="margin-top:20px"><a class="btn btn--tertiary" href="catalogue.html">Keep browsing</a></p></section>' +
      '<aside class="summary" id="cart-summary" aria-labelledby="sum-title"></aside></div>';
    FA.renderSummary(document.getElementById('cart-summary'), {
      prefix: 'sum', freeLabel: 'Free (prepaid box)',
      cta: '<a class="btn btn--primary btn--block" href="checkout.html">Checkout' + FA.icon('arrow-right') + '</a><p class="hint">Shipping is free both ways on every order. Tax is estimated at 6% (Michigan).</p>'
    });
  }

  function renderSaved() {
    var saved = FA.saved.items();
    var html = '<h2 id="saved-title" class="saved__title" tabindex="-1">Saved for later (' + saved.length + ')</h2>';
    if (!saved.length) {
      html += '<p class="muted saved__empty">Nothing saved yet. Tap Save on anything you want to come back to.</p>';
    } else {
      html += '<ul class="lines saved__list">' + saved.map(function (s) {
        var p = FA.getProduct(s.id), size = FA.sizeOf(p, s.size), href = FA.productUrl(p);
        var nm = FA.esc(p.name) + (size ? ', ' + size.label : '');
        var price = size ? size.price : p.price;
        var opt = [];
        if (size) opt.push('Size: ' + size.label);
        else if (p.sizes) opt.push('From ' + FA.moneyShort(p.price));
        if (!p.sizes || size) opt.push(FA.money(price));
        if (s.qty > 1) opt.push('Qty ' + s.qty);
        if (p.soldOut) opt.push('Sold out for now');
        var move = p.soldOut
          ? '<button class="btn btn--disabled btn--sm" type="button" disabled>Sold out</button>'
          : '<button class="btn btn--secondary btn--sm" type="button" data-move' + (p.sizes && !size ? ' aria-haspopup="dialog"' : '') + ' aria-label="Move ' + nm + ' to cart">Move to cart</button>';
        return '<li class="line line--saved" data-saved-key="' + s.key + '">' +
          '<a class="line__img" href="' + href + '" tabindex="-1" aria-hidden="true">' + FA.img(p.images[0], { decorative: true }) + '</a>' +
          '<div class="line__info"><h3 class="line__name"><a href="' + href + '">' + FA.esc(p.name) + '</a></h3>' +
            '<p class="line__opt">' + opt.join(' · ') + '</p></div>' +
          '<div class="line__controls">' + move +
            '<button class="btn btn--tertiary" type="button" data-unsave aria-label="Remove ' + nm + ' from saved">Remove</button></div>' +
        '</li>';
      }).join('') + '</ul>';
    }
    savedRoot.innerHTML = html;
  }

  function focusHeading(sel) { var h = document.querySelector(sel); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }

  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('cart-root');
    savedRoot = document.getElementById('saved');
    render(); renderSaved();
    if (location.hash === '#saved') window.setTimeout(function () { savedRoot.scrollIntoView(); }, 0);

    root.addEventListener('click', function (e) {
      var line = e.target.closest('.line');
      if (!line) return;
      var key = line.getAttribute('data-key');
      var cur = FA.cart.items().filter(function (l) { return l.key === key; })[0];
      if (!cur) return;
      var p = FA.getProduct(cur.id);
      if (e.target.closest('[data-qty]')) {
        var btn = e.target.closest('[data-qty]');
        FA.cart.setQty(key, cur.qty + (+btn.getAttribute('data-qty')));
        var again = root.querySelector('[data-key="' + key + '"] [data-qty="' + btn.getAttribute('data-qty') + '"]');
        if (again && !again.disabled) again.focus(); else { var i = root.querySelector('[data-key="' + key + '"] [data-qty-input]'); if (i) i.focus(); }
        FA.announce('Quantity updated.');
      } else if (e.target.closest('[data-remove]')) {
        FA.cart.remove(key);
        FA.announce(p.name + ' removed from cart.');
        focusHeading('main h1');
      } else if (e.target.closest('[data-later]')) {
        FA.cart.remove(key);
        FA.saved.add(cur.id, cur.size, cur.qty);
        FA.announce(p.name + ' moved to Saved for later.');
        focusHeading('#saved-title');
      }
    });
    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-qty-input]')) return;
      var key = e.target.closest('.line').getAttribute('data-key');
      FA.cart.setQty(key, parseInt(e.target.value, 10) || 1);
    });

    savedRoot.addEventListener('click', function (e) {
      var row = e.target.closest('[data-saved-key]');
      if (!row) return;
      var key = row.getAttribute('data-saved-key');
      var s = FA.saved.items().filter(function (x) { return x.key === key; })[0];
      if (!s) return;
      var p = FA.getProduct(s.id);
      if (e.target.closest('[data-unsave]')) {
        FA.saved.remove(key);
        FA.announce(p.name + ' removed from saved.');
        focusHeading('#saved-title');
      } else if (e.target.closest('[data-move]')) {
        if (p.sizes && !s.size) {
          // pick a size first; the quick view adds it, then we take it off the saved list
          FA.quickView(p.id, e.target.closest('[data-move]'), { onAdded: function () { FA.saved.remove(key); focusHeading('main h1'); } });
          return;
        }
        FA.saved.remove(key);
        FA.addToCart(p, s.qty, s.size);
        focusHeading('main h1');
      }
    });

    document.addEventListener('fa:cart', render);
    document.addEventListener('fa:saved', renderSaved);
  });
})();
