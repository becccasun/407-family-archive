# The Family Archive

Responsive e-commerce prototype for **The Family Archive** (archival kits, scanning, storage, digitizing, family-history books). SI 407 midterm, Rebecca Sun. Visual direction: *Archival & Monochromatic*.

**Live:** https://becccasun.github.io/407-family-archive/

Plain HTML, CSS and vanilla JS, no build step. The cart is kept in `localStorage`.

| Page | What it does |
|---|---|
| `index.html` | Home: hero, featured kits, how it works, services, offers |
| `catalogue.html` | Folder-tab categories, filters (category / type / price / stock), sort, search. Filter state lives in the URL query. Bottom sheet on mobile |
| `product.html?id=FA-K01` | Product detail for any catalog number. Size option cards, qty stepper, accordion |
| `cart.html` | Qty edit / remove, promo code (`ARCHIVE10`), totals |
| `checkout.html` | One-page checkout (contact, shipping, payment) with inline validation, then confirmation |
| `404.html` | "No. 404: Misfiled." |

Tip: on an empty cart, use **Load the sample order** to get the Figma cart (Starter Kit Medium + Shoebox Scan = $248.04).

Photos: Unsplash (Unsplash License), shown in grayscale via CSS. Photographers and source links are in [`assets/img/credits.json`](assets/img/credits.json).
