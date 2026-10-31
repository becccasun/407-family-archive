/* Product detail, driven by ?item=starter-archival-kit */
(function () {
  var FA = window.FA;

  function render(p) {
    var root = document.getElementById('pdp-root');
    var crumbs = document.getElementById('crumbs');
    crumbs.insertAdjacentHTML('beforeend',
      '<li><a href="catalogue.html?cat=' + FA.slug(p.category) + '">' + FA.esc(p.category) + '</a></li>' +
      '<li><span aria-current="page">' + FA.esc(p.name) + '</span></li>');
    document.title = p.name + ' · The Family Archive';

    var thumbs = p.images.map(function (k, i) {
      return '<li><button class="thumb" type="button" data-img="' + k + '" data-i="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="Show image ' + (i + 1) + ' of ' + p.images.length + '">' + FA.img(k, { decorative: true }) + '</button></li>';
    }).join('');

    var startPrice = p.sizes ? p.sizes[1].price : p.price;
    var sizes = p.sizes ? FA.sizeOptions(p, 'size', p.sizes[1].id) : '';

    var specs = p.specs.length ? '<dl class="spec-list">' + p.specs.map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + FA.esc(s[1]) + '</dd>'; }).join('') + '</dl>' : '';

    var acc = [
      ['inside', p.type === 'Service' ? 'What’s included' : 'What’s inside', '<ul>' + p.includes.map(function (x) { return '<li>' + FA.esc(x) + '</li>'; }).join('') + '</ul>', true],
      ['materials', p.type === 'Service' ? 'How it works' : 'Materials',
        p.type === 'Service'
          ? '<p>We send you a prepaid, insured box. Pack your items, drop the box at any UPS, and we&rsquo;ll email you tracking. Your originals come back sorted and labeled.</p>'
          : '<p>Everything that touches a photo is acid-free and photo-safe, so it won&rsquo;t yellow, stick to, or damage your photos over time.</p>', false],
      ['shipping', 'Shipping & returns', '<p>' + FA.SHIPPING_COPY + '</p>', false]
    ].map(function (a) {
      return '<div class="accordion__item"><h3 style="font-size:inherit"><button class="accordion__trigger" type="button" id="acc-' + a[0] + '-btn" aria-expanded="' + a[3] + '" aria-controls="acc-' + a[0] + '">' +
        FA.esc(a[1]) + FA.icon('chevron-down', 'icon icon--sm sign') + '</button></h3>' +
        '<div class="accordion__panel" id="acc-' + a[0] + '" role="region" aria-labelledby="acc-' + a[0] + '-btn"' + (a[3] ? '' : ' hidden') + '>' + a[2] + '</div></div>';
    }).join('');

    var buy = p.soldOut
      ? '<div class="buy-row buy-row--soldout"><button class="btn btn--disabled" type="button" disabled>Sold out</button>' + FA.saveButton(p) + '</div>' +
        '<p class="muted">In the meantime, the <a href="' + FA.productUrl(FA.getProduct('photo-sleeve-pack')) + '">Photo Sleeve Pack</a> is in stock.</p>'
      : '<div class="field"><label for="qty">Quantity</label>' + FA.stepper('qty') + '</div>' +
        '<div class="buy-row"><button class="btn btn--primary" type="submit" id="add-btn"><span>Add to cart · <span data-line-price>' + FA.moneyShort(startPrice) + '</span></span></button>' +
        FA.saveButton(p) + '</div>';

    root.innerHTML =
      '<div class="pdp">' +
        '<div class="gallery">' +
          '<div class="figure"><div class="figure__frame">' + FA.img(p.images[0], { eager: true }).replace('<img ', '<img id="main-img" ') +
            (p.soldOut ? '<span class="stamp" aria-hidden="true">Sold out</span>' : '') + '</div></div>' +
          (p.images.length > 1 ? '<ul class="thumbs" aria-label="Product images">' + thumbs + '</ul>' : '') +
        '</div>' +
        '<form class="pdp__info" id="buy-form" novalidate>' +
          '<div class="pdp__head"><h1>' + FA.esc(p.name) + '</h1>' +
          '<p class="pdp__price"><span data-unit-price>' + FA.moneyShort(startPrice) + '</span>' + (p.unit ? '<small>' + p.unit + '</small>' : '') + '</p>' +
          '<div class="pdp__meta"><span class="tag">' + FA.esc(p.category) + '</span>' +
            (p.isNew ? '<span class="tag tag--solid">New</span>' : '') + '</div></div>' +
          '<p class="lede">' + FA.esc(p.blurb) + '</p>' +
          sizes + buy + specs +
          '<div class="accordion" id="details">' + acc + '</div>' +
        '</form>' +
      '</div>' +
      '<section class="section section--rule" aria-labelledby="pairs-title" style="padding-top:clamp(32px,4vw,64px)">' +
        '<div class="section-head"><h2 id="pairs-title">Pairs well with</h2></div>' +
        '<div class="card-grid card-grid--3">' + p.pairs.map(function (id) { return FA.card(FA.getProduct(id)); }).join('') + '</div>' +
      '</section>' +
      (p.soldOut ? '' : '<div class="mobile-buy" id="mobile-buy" aria-hidden="true"><span class="pdp__price" data-line-price>' + FA.moneyShort(startPrice) + '</span><button class="btn btn--primary" type="button" tabindex="-1" id="mobile-add">Add to cart</button></div>');

    FA.initAccordions(root);
    bind(p);
  }

  function bind(p) {
    var form = document.getElementById('buy-form');
    // gallery
    document.querySelectorAll('.thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        var k = t.getAttribute('data-img'), im = FA.IMAGES[k];
        var main = document.getElementById('main-img');
        main.src = FA.url(im.url); main.alt = im.alt; main.width = im.w; main.height = im.h;
        document.querySelectorAll('.thumb').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
      });
    });
    if (p.soldOut) return;

    var qty = document.getElementById('qty');
    function unit() {
      if (!p.sizes) return p.price;
      var v = form.querySelector('input[name="size"]:checked').value;
      return p.sizes.filter(function (s) { return s.id === v; })[0].price;
    }
    function q() { var n = parseInt(qty.value, 10); return isNaN(n) ? 1 : Math.max(1, Math.min(99, n)); }
    function update() {
      document.querySelectorAll('[data-unit-price]').forEach(function (el) { el.textContent = FA.moneyShort(unit()); });
      document.querySelectorAll('[data-line-price]').forEach(function (el) { el.textContent = FA.moneyShort(unit() * q()); });
      form.querySelector('[data-step="-1"]').disabled = q() <= 1;
      form.querySelector('[data-step="1"]').disabled = q() >= 99;
    }
    form.addEventListener('change', function (e) { if (e.target === qty) qty.value = q(); update(); });
    qty.addEventListener('input', update);
    form.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () { qty.value = q() + (+b.getAttribute('data-step')); qty.value = q(); update(); if (b.disabled) qty.focus(); });
    });
    function add() {
      var size = p.sizes ? form.querySelector('input[name="size"]:checked').value : null;
      FA.addToCart(p, q(), size);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); add(); });
    var mobileAdd = document.getElementById('mobile-add');
    mobileAdd.addEventListener('click', add);

    // mobile sticky bar shows once the main Add button scrolls out of view
    var bar = document.getElementById('mobile-buy'), addBtn = document.getElementById('add-btn');
    function syncBar() {
      var hidden = addBtn.getBoundingClientRect().bottom < 0;
      bar.classList.toggle('is-visible', hidden);
      bar.setAttribute('aria-hidden', String(!hidden));
      mobileAdd.tabIndex = hidden ? 0 : -1;
    }
    window.addEventListener('scroll', syncBar, { passive: true });
    window.addEventListener('resize', syncBar);
    syncBar();
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(location.search);
    var id = params.get('item') || 'starter-archival-kit';
    var p = FA.getProduct(id);
    if (!p) {
      document.title = 'Not found · The Family Archive';
      document.getElementById('pdp-root').innerHTML =
        '<div class="page-head"><h1>We couldn’t find that item.</h1>' +
        '<p class="lede" style="margin:16px 0 24px">It may have moved or sold out for good. Try the catalogue instead.</p>' +
        '<div class="btn-row"><a class="btn btn--primary" href="catalogue.html">Browse the catalogue</a><a class="btn btn--secondary" href="index.html">Back to home</a></div></div>';
      return;
    }
    render(p);
    if (location.hash === '#details') {
      var b = document.getElementById('acc-shipping-btn'); if (b) { b.click(); b.scrollIntoView(); }
    }
  });
})();
