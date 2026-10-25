# ETAX — Tax, VAT & Financial Consulting (Bangladesh)

A redesign of the **Consultax** financial-consulting template preserved in this
repo (`templates.thememodern.com/consultax/`), rebuilt as a fast, responsive
**Vanilla JS single-page app** and rebranded for **ETAX**, a Bangladeshi
tax/VAT/audit consultancy.

## Stack

| Original (Consultax) | Redesign |
|---|---|
| jQuery + Bootstrap + Slick + Revolution Slider | **Vanilla JS** (no framework, no build step) |
| Font Awesome 4 (local) | **Font Awesome 6 Pro** via CDN (`surajit-singha-sisir.github.io/FontAwesome-6-Pro`) |
| Slick carousels | **Swiper 11** via CDN (hero, testimonials, partners, galleries) |
| — | **AOS** scroll animations via CDN |
| 17 static HTML files | One `index.html` shell; pages rendered by a History-API router (clean URLs — no `#`) from `assets/js/data.js` |
| Jekyll GitHub Pages workflow | Static deploy workflow that publishes only the new site |

## Pages (clean URLs)

| Route | Page |
|---|---|
| `/` | Home — hero slider, features, mission, services, counters, case-study filter, tax calculator, testimonials, call-back, news, partners |
| `/about` | About — story, mission/values/motto, 25-year stats, leadership |
| `/services` · `/service/:slug` | Services grid + detail (deliverables, performance bars, FAQ) |
| `/projects` · `/project/:slug` | Case studies with category filter + detail (Swiper gallery, results, prev/next) |
| `/blog` · `/post/:slug` | News with live search & category filter + article page with working comments (localStorage) |
| `/team` | Team grid with profile modals + testimonials |
| `/contact` | Offices (Dhaka, Chattogram, Sylhet), contact form, map, FAQ |

## Functionality

- Sticky header, mobile drawer with services accordion, full-screen live search
- “Get a Quote” modal + call-back/contact/newsletter forms with validation
  (leads saved to `localStorage` — wire `saveLead()` in `assets/js/app.js`
  to your own API/CRM to receive them by email)
- Personal income-tax calculator (slab estimator, BD taxpayer categories)
- Animated counters & skill bars, FAQ accordions, video popup, back-to-top
- Fully responsive (1100px / 860px / 580px breakpoints), keyboard-accessible

## Run locally

```bash
python3 server.py
# open http://localhost:8000  — try http://localhost:8000/about too
```

`server.py` is a tiny SPA-fallback server: unknown paths are served
`index.html` so clean URLs like `/about` survive a refresh locally.
On GitHub Pages the same job is done by `404.html` + the redirect-restore
script in `index.html` (old `#/…` bookmarks are auto-upgraded to clean URLs).

## Edit content

All text, services, projects, posts, team and testimonials live in
**`assets/js/data.js`** — edit there and every page updates. Images are in
`assets/images/` (copied from the original template).

## Deployment

Pushing to `main` runs `.github/workflows/static.yml`, which assembles
`index.html`, `404.html`, `.nojekyll` and `assets/` into `_site` and deploys
to GitHub Pages. The legacy HTTrack mirror remains in the repo for reference
but is not published.
