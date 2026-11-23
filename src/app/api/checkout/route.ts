import { NextResponse } from "next/server";
import Stripe from "stripe";

type CartItemIn = {
  handle: string;
  title: string;
  image: string;
  size: string;
  sku: string;
  price: number;
  qty: number;
};

const FREE_SHIPPING_AT = 75;
const SHIPPING_FLAT_CENTS = 999;

/** Create (or reuse) a Stripe Price for a cart item, keyed by SKU. */
async function priceForItem(stripe: Stripe, item: CartItemIn): Promise<string> {
  const found = await stripe.products.search({ query: `metadata['sku']:'${item.sku}'` });
  if (found.data.length > 0) {
    const prices = await stripe.prices.list({ product: found.data[0].id, limit: 5 });
    const match = prices.data.find((p) => p.unit_amount === Math.round(item.price * 100));
    if (match) return match.id;
    const created = await stripe.prices.create({
      product: found.data[0].id,
      currency: "cad",
      unit_amount: Math.round(item.price * 100),
    });
    return created.id;
  }
  const product = await stripe.products.create({
    name: `${item.title} — ${item.size}`,
    metadata: { sku: item.sku, handle: item.handle, size: item.size },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: Math.round(item.price * 100),
  });
  return price.id;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Checkout is not connected yet in this preview: STRIPE_SECRET_KEY is not set on the deployment. Connect Stripe in the Vercel dashboard (or set the test key) and try again — no payment was taken.",
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
  const items = (body.items ?? []).filter((i) => i.qty > 0 && i.price > 0);
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of items) {
      const priceId = await priceForItem(stripe, item);
      lineItems.push({ price: priceId, quantity: item.qty });
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    if (subtotal < FREE_SHIPPING_AT) {
      const shipPrice = await priceForItem(stripe, {
        handle: "shipping",
        title: "Standard shipping",
        image: "",
        size: "flat",
        sku: "SHIPPING-STANDARD",
        price: SHIPPING_FLAT_CENTS / 100,
        qty: 1,
      });
      lineItems.push({ price: shipPrice, quantity: 1 });
    }

    const origin = req.headers.get("origin") ?? "https://inewton.ca";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      currency: "cad",
      allow_promotion_codes: true,
      shipping_address_collection: { allowed_countries: ["CA", "US"] },
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
