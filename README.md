# The Family Archive

Responsive e-commerce prototype for **The Family Archive** (archival kits, scanning, storage, digitizing, family-history books). SI 407 midterm, Rebecca Sun. Visual direction: *Archival & Monochromatic*.

**Live:** https://becccasun.github.io/407-family-archive/

Plain HTML, CSS and vanilla JS, no build step. The cart and saved items are kept in `localStorage`. Logo and icons come from the Figma file (page "02 Components"): `assets/logo-full.svg`, `assets/logo-mark.svg`, `assets/icons/*.svg`, inlined in each page as an SVG sprite.

| Page | What it does |
|---|---|
| `index.html` | Home: hero, featured kits, how it works, services, offers. Every product card has Add to cart, Save, and a quick view |
| `catalogue.html` | Folder-tab categories, filters (category / type / price / stock), sort, search. Filter state lives in the URL query. Bottom sheet on mobile |
| `product.html?item=starter-archival-kit` | Product detail by readable slug. Size option cards, qty stepper, Save, accordion |
| `cart.html` | Qty edit, remove, save for later, promo code (`ARCHIVE10`), totals, and a Saved for later list (`cart.html#saved`) |
| `checkout.html` | One-page checkout (contact, shipping, payment) with inline validation, then confirmation |
| `404.html` | Page not found, with search |

Photos: Unsplash (Unsplash License), shown in grayscale via CSS. Photographers and source links are in [`assets/img/credits.json`](assets/img/credits.json).
