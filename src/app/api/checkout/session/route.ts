import { NextResponse } from "next/server";
import Stripe from "stripe";

/** Verify a Stripe Checkout Session (used by the success page). */
export async function GET(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Checkout is not connected yet — please try again later." },
      { status: 503 }
    );
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }
  const stripe = new Stripe(secret);
  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return NextResponse.json({
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}
