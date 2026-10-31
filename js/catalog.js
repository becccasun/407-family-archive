/* The Family Archive: shared catalog data (used by every page). */
(function () {
  var IMG = 'assets/img/';
  var IMAGES = {
    hero:      { src: 'hero-family-prints.jpg', w: 1200, h: 960,  alt: 'Old black-and-white family snapshots spread on a white sheet next to a small wooden frame' },
    shoebox:   { src: 'shoebox-old-photos.jpg', w: 1200, h: 800,  alt: 'Old portrait photographs stacked upright in a small wooden box' },
    basket:    { src: 'prints-wicker-basket.jpg', w: 1200, h: 800, alt: 'A basket of old black-and-white photographs, a wedding portrait on top' },
    scattered: { src: 'scattered-bw-prints.jpg', w: 1200, h: 1800, alt: 'Loose black-and-white photo prints scattered on a table' },
    album:     { src: 'photo-album-open.jpg', w: 1200, h: 800, alt: 'Hands holding open an old photo album filled with black-and-white photos' },
    negatives: { src: 'negative-film-coil.jpg', w: 1200, h: 800, alt: 'A coil of 35mm negative film strips in a metal tin' },
    reels:     { src: 'film-reels.jpg', w: 1200, h: 900, alt: 'Small home-movie film reels and loose film on a white table' },
    vhs:       { src: 'vhs-tape.jpg', w: 1200, h: 800, alt: 'A VHS tape with a blank label' },
    letters:   { src: 'handwritten-letters.jpg', w: 1200, h: 800, alt: 'Old handwritten letters in faded cursive ink' },
    envelopes: { src: 'opened-envelopes.jpg', w: 1200, h: 800, alt: 'A pile of old airmail envelopes and letters' },
    catalog:   { src: 'card-catalog-drawers.jpg', w: 1200, h: 800, alt: 'A wall of wooden card-catalog drawers with metal label holders' },
    cabinet:   { src: 'file-cabinet.jpg', w: 1200, h: 798, alt: 'A metal filing cabinet with one drawer pulled open, full of index cards' },
    drawer:    { src: 'empty-drawer.jpg', w: 1200, h: 800, alt: 'A single open white drawer, nearly empty' },
    hands:     { src: 'hands-vintage-photos.jpg', w: 1200, h: 797, alt: 'A hand holding up two vintage group photographs' },
    book:      { src: 'hardcover-books.jpg', w: 1200, h: 1800, alt: 'An open book resting on a short stack of books' },
    ledger:    { src: 'handwritten-ledger.jpg', w: 1200, h: 901, alt: 'An old open ledger full of handwritten notes' }
  };
  Object.keys(IMAGES).forEach(function (k) { IMAGES[k].url = IMG + IMAGES[k].src; });

  var SHIPPING_COPY = 'Kits and storage ship in 2–3 business days. Services come with an insured, prepaid box both ways. Unopened kits and storage can be returned within 30 days.';

  var PRODUCTS = [
    { id: 'starter-archival-kit', slug: 'starter-archival-kit', name: 'Starter Archival Kit', category: 'Kits', type: 'Product', price: 50, featured: true,
      images: ['shoebox', 'scattered', 'envelopes'],
      blurb: 'Everything you need to sort a shoebox of photos and papers before they go anywhere. Photo-safe materials, sized to how much you’ve got.',
      sizes: [
        { id: 'S', label: 'Small', detail: 'Up to 250 items', price: 50 },
        { id: 'M', label: 'Medium', detail: 'Up to 600 items', price: 85 },
        { id: 'L', label: 'Large', detail: 'Up to 1,200 items', price: 140 }
      ],
      includes: ['100 acid-free sleeves', '2 archival boxes', 'Pencil + labels', 'Inventory sheet', 'Prepaid insured return box (if adding scanning)'],
      specs: [],
      pairs: ['shoebox-scan', 'family-album-box', 'photo-sleeve-pack'] },
    { id: 'heirloom-gift-kit', slug: 'heirloom-gift-kit', name: 'Heirloom Gift Kit', category: 'Kits', type: 'Product', price: 85,
      images: ['hands', 'album'],
      blurb: 'The starter kit in a cloth-covered box, with a card that explains how it all works. For the relative who has all the photos.',
      includes: ['Everything in the Starter Kit (Medium)', 'Cloth-covered keepsake box', 'Gift card with instructions', 'Gift wrapping'],
      specs: [],
      pairs: ['starter-archival-kit', 'family-history-book', 'shoebox-scan'] },
    { id: 'photo-sleeve-pack', slug: 'photo-sleeve-pack', name: 'Photo Sleeve Pack (100)', category: 'Storage', type: 'Product', price: 18,
      images: ['scattered', 'shoebox'],
      blurb: '100 acid-free sleeves for 4×6 and 5×7 prints. Slide them in, write on the label strip, done.',
      includes: ['100 polypropylene sleeves', 'Writable label strip on each'],
      specs: [['Fits', '4×6 and 5×7 prints']],
      pairs: ['starter-archival-kit', 'family-album-box', 'document-archive-box'] },
    { id: 'family-album-box', slug: 'family-album-box', name: 'Family Album Box', category: 'Storage', type: 'Product', price: 120,
      images: ['album', 'hands'],
      blurb: 'A clamshell box with 10 interleaved album pages. Holds about 400 prints flat. No glue, no sticky pages.',
      includes: ['Clamshell box', '10 album pages', 'Interleaving tissue'],
      specs: [['Holds', 'About 400 prints']],
      pairs: ['photo-sleeve-pack', 'starter-archival-kit', 'family-history-book'] },
    { id: 'negative-binder', slug: 'negative-binder', name: 'Negative Binder', category: 'Storage', type: 'Product', price: 35, soldOut: true,
      images: ['negatives', 'catalog'],
      blurb: 'A ring binder with 25 archival negative pages, 7 strips each. Back in stock soon.',
      includes: ['D-ring binder', '25 negative pages (7 strips each)'],
      specs: [['Holds', 'About 175 strips']],
      pairs: ['slides-and-negatives-scan', 'photo-sleeve-pack', 'document-archive-box'] },
    { id: 'document-archive-box', slug: 'document-archive-box', name: 'Document Archive Box', category: 'Storage', type: 'Product', price: 42, isNew: true,
      images: ['cabinet', 'letters'],
      blurb: 'A letter-size archive box with 25 acid-free folders. For the papers that matter: deeds, letters, report cards.',
      includes: ['Letter-size archive box', '25 acid-free folders', 'Label set'],
      specs: [['Size', 'Letter, 15×12×5 in']],
      pairs: ['letters-and-documents', 'photo-sleeve-pack', 'starter-archival-kit'] },
    { id: 'shoebox-scan', slug: 'shoebox-scan', name: 'Shoebox Scan (up to 500 prints)', category: 'Scanning', type: 'Service', price: 149, featured: true,
      images: ['basket', 'scattered'],
      blurb: 'Send up to 500 prints in our prepaid box. We scan at 600 dpi, clean up dust and color, and send everything back.',
      includes: ['Prepaid, insured box both ways', '600 dpi scans (JPEG + TIFF)', 'Dust and color clean-up', 'Online gallery + USB drive'],
      specs: [['Turnaround', 'About 3 weeks']],
      pairs: ['starter-archival-kit', 'family-history-book', 'slides-and-negatives-scan'] },
    { id: 'slides-and-negatives-scan', slug: 'slides-and-negatives-scan', name: 'Slides & Negatives Scan (up to 250)', category: 'Scanning', type: 'Service', price: 129,
      images: ['negatives', 'catalog'],
      blurb: 'Up to 250 slides or negative frames, scanned at 2400 dpi. Each one gets cleaned before it goes on the scanner.',
      includes: ['Prepaid, insured box both ways', '2400 dpi scans', 'Hand cleaning'],
      specs: [['Turnaround', 'About 3 weeks'], ['Formats', '35mm slides, 35mm + 120 negatives']],
      pairs: ['negative-binder', 'shoebox-scan', 'family-history-book'] },
    { id: 'home-movie-transfer', slug: 'home-movie-transfer', name: 'Home Movie Transfer (per tape)', category: 'Digitizing', type: 'Service', price: 35, unit: 'per tape',
      images: ['vhs', 'reels'],
      blurb: 'VHS, 8mm, or Super 8 to digital files. Priced per tape, up to 2 hours each. Your tapes come back with the files.',
      includes: ['MP4 files, one per tape', 'Basic color correction', 'Tapes returned'],
      specs: [['Formats', 'VHS, 8mm, Super 8'], ['Length', 'Up to 2 hours per tape'], ['Turnaround', 'About 3 weeks']],
      pairs: ['shoebox-scan', 'letters-and-documents', 'family-history-book'] },
    { id: 'letters-and-documents', slug: 'letters-and-documents', name: 'Letters & Documents (up to 200 pages)', category: 'Digitizing', type: 'Service', price: 89,
      images: ['letters', 'envelopes'],
      blurb: 'Up to 200 pages of letters, diaries, or documents, scanned flat and saved as searchable PDFs.',
      includes: ['Flatbed scans, 400 dpi', 'Searchable PDF + JPEG', 'Originals returned in archival folders'],
      specs: [['Turnaround', 'About 3 weeks'], ['Max size', '11×17 in']],
      pairs: ['document-archive-box', 'recipe-archive-book', 'shoebox-scan'] },
    { id: 'family-history-book', slug: 'family-history-book', name: 'Family History Book (40 pages)', category: 'Family Books', type: 'Service', price: 95,
      images: ['book', 'album'],
      blurb: 'A 40-page hardcover designed by our team from your scans, with captions you write.',
      includes: ['Layout designed for you', 'Two rounds of edits', 'Hardcover, 10×10 in'],
      specs: [['Binding', 'Hardcover, lay-flat'], ['Turnaround', 'About 4 weeks after scans']],
      pairs: ['shoebox-scan', 'recipe-archive-book', 'heirloom-gift-kit'] },
    { id: 'recipe-archive-book', slug: 'recipe-archive-book', name: 'Recipe Archive Book', category: 'Family Books', type: 'Service', price: 65,
      images: ['ledger', 'letters'],
      blurb: 'Handwritten recipe cards, scanned and bound into a cookbook. Stains and notes in the margins included.',
      includes: ['Up to 60 recipe cards scanned', 'Typed transcription alongside each', 'Softcover, 8×10 in'],
      specs: [['Pages', 'Up to 64'], ['Turnaround', 'About 4 weeks']],
      pairs: ['family-history-book', 'letters-and-documents', 'starter-archival-kit'] }
  ];
  PRODUCTS.forEach(function (p, i) { p.order = i; });

  var CATEGORIES = ['Kits', 'Scanning', 'Storage', 'Digitizing', 'Family Books'];

  /* Items are keyed by readable slugs (used in URLs and storage). */
  function getProduct(key) {
    var sl = String(key || '').trim().toLowerCase();
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === sl) return PRODUCTS[i];
    return null;
  }
  function productUrl(p, hash) { return 'product.html?item=' + p.slug + (hash || ''); }
  function money(n) { return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function moneyShort(n) { return Number(n) % 1 === 0 ? '$' + Number(n).toLocaleString('en-US') : money(n); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  window.FA = window.FA || {};
  window.FA.IMAGES = IMAGES;
  window.FA.PRODUCTS = PRODUCTS;
  window.FA.CATEGORIES = CATEGORIES;
  window.FA.SHIPPING_COPY = SHIPPING_COPY;
  window.FA.getProduct = getProduct;
  window.FA.productUrl = productUrl;
  window.FA.money = money;
  window.FA.moneyShort = moneyShort;
  window.FA.slug = slug;
})();
