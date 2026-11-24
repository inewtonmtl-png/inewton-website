import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getVariantBySku } from "@/lib/catalog";

type CartItemIn = {
  sku: string;
  qty: number;
};

const FREE_SHIPPING_AT = 75;
const SHIPPING_FLAT_CENTS = 999;
const SHIPPING_SKU = "SHIPPING-STANDARD";

type PricedItem = {
  sku: string;
  title: string;
  size: string;
  priceCents: number;
};

/** Create (or reuse) a Stripe Price for an item, keyed by SKU. */
async function priceForItem(stripe: Stripe, item: PricedItem): Promise<string> {
  const found = await stripe.products.search({ query: `metadata['sku']:'${item.sku}'` });
  if (found.data.length > 0) {
    const prices = await stripe.prices.list({ product: found.data[0].id, limit: 5 });
    const match = prices.data.find((p) => p.unit_amount === item.priceCents);
    if (match) return match.id;
    const created = await stripe.prices.create({
      product: found.data[0].id,
      currency: "cad",
      unit_amount: item.priceCents,
    });
    return created.id;
  }
  const product = await stripe.products.create({
    name: `${item.title} — ${item.size}`,
    metadata: { sku: item.sku, size: item.size },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: item.priceCents,
  });
  return price.id;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Checkout is not connected yet — please try again later. No payment was taken.",
      },
      { status: 503 }
    );
  }
  let body: { items?: CartItemIn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const rawItems = (body.items ?? []).filter(
    (i) => i && typeof i.sku === "string" && Number.isInteger(i.qty) && i.qty > 0
  );
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // B1: never trust client-supplied prices — every price comes from the catalog.
  const priced: { item: PricedItem; qty: number }[] = [];
  for (const raw of rawItems) {
    const found = getVariantBySku(raw.sku);
    if (!found) {
      return NextResponse.json({ error: `Unknown product: ${raw.sku}.` }, { status: 400 });
    }
    priced.push({
      item: {
        sku: found.variant.sku,
        title: found.product.title,
        size: `${found.variant.size} in`,
        priceCents: Math.round(found.variant.price * 100),
      },
      qty: raw.qty,
    });
  }

  const stripe = new Stripe(secret);
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const { item, qty } of priced) {
      const priceId = await priceForItem(stripe, item);
      lineItems.push({ price: priceId, quantity: qty });
    }
    const subtotal = priced.reduce((s, { item, qty }) => s + (item.priceCents / 100) * qty, 0);
    if (subtotal < FREE_SHIPPING_AT) {
      const shipPrice = await priceForItem(stripe, {
        sku: SHIPPING_SKU,
        title: "Standard shipping",
        size: "flat",
        priceCents: SHIPPING_FLAT_CENTS,
      });
      lineItems.push({ price: shipPrice, quantity: 1 });
    }

    // B11: Origin header first, then env, then the Vercel URL — never
    // hardcode inewton.ca until the domain is actually pointed.
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://inewton-website.vercel.app";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      currency: "cad",
      allow_promotion_codes: true,
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
      metadata: { skus: priced.map(({ item }) => item.sku).join(",") },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });
    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Stripe checkout failed. Please try again — no payment was taken." },
      { status: 500 }
    );
  }
}
