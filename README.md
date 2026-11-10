# BizzX Apparel Storefront MVP

A responsive, apparel-focused print-on-demand storefront built with Vite, React, and TypeScript. It includes a sample home page and catalog, product details, a browser-only artwork mockup studio, and a cart persisted in local storage.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Deploy to GitHub Pages from a branch

1. Run `npm run build` to generate the site in `docs`.
2. Commit and push the generated `docs` folder to the `main` branch.
3. In the repository settings, open **Pages**. Under **Build and deployment**, select **Deploy from a branch**, then choose `main` and `/docs`.
4. Open `https://omjbhaleraowork.github.io/bizzx-ca-mvp/` after Pages finishes publishing.

The app uses hash-based routes, so refresh URLs such as `/#/shop` rather than `/shop`.

## MVP boundaries

- The catalog, imagery, and USD prices in `src/data.ts` are sample content and must be replaced with client-approved products and pricing.
- Product imagery is loaded from Unsplash.
- Artwork accepts PNG/JPG files up to 2 MB for the browser mockup. The uploaded file is not sent to a server, persisted with the cart, or suitable as a production proof; only its filename and selected placement are attached to a cart line.
- Checkout is intentionally unavailable. There is no backend, payment processing, customer account, order persistence, or admin area.
- Replace contact details and confirm shipping, returns, product specifications, and business claims before launch.
