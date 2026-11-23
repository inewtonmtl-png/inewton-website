# iNewton — own website (preview)

Next.js 16 storefront replacing Shopify. Prices in CAD.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Data

`scripts/prep-data.py` rebuilds the site data from `../catalog-export.json`:
- `src/data/products.json` — 1,095 slim products (server-side only)
- `public/data/index.json` — lightweight shop index, fetched once by the Shop page
- `src/data/home.json` — best sellers, categories, bundles

## Checkout (Stripe, test mode)

`src/app/api/checkout/route.ts` creates Stripe products/prices per cart SKU
at checkout time, then a Stripe Checkout Session (CAD, CA/US shipping,
promotion codes enabled for ART10).

It needs `STRIPE_SECRET_KEY` set on the deployment (Vercel dashboard →
project → Settings → Environment Variables, or the Vercel Stripe
integration). Without it the cart shows a clear “not connected yet” message
and takes no payment. The connected Stripe account is in **test mode**.

## Deploy

Preview deployment on Vercel. Do NOT add the inewton.ca custom domain and
do NOT change DNS until the preview is approved. Shopify stays live.
