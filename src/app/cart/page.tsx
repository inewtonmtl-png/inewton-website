"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { shortPrice } from "@/lib/catalog";

const FREE_SHIPPING_AT = 75;
const SHIPPING_FLAT = 9.99;

export default function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = subtotal <= 0 ? 0 : subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FLAT;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100);
  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed. Please try again.");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container section">
        <h2>Your cart is empty</h2>
        <p className="sub">Browse the collection and add a canvas you love.</p>
        <Link href="/shop" className="btn btn-gold">Shop all art</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h2>Your cart</h2>
      <div className="note" style={{ margin: "0 0 20px" }}>
        {remaining > 0 ? (
          <>Add <b>{shortPrice(remaining)}</b> more for free shipping.</>
        ) : (
          <>🎉 You’ve unlocked <b>free shipping</b>!</>
        )}
        <div className="ship-bar"><div style={{ width: `${progress}%` }} /></div>
      </div>
      <table className="cart-table">
        <thead>
          <tr><th>Artwork</th><th>Size</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.sku}>
              <td>
                <Link href={`/products/${i.handle}`} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Image src={i.image} alt={i.title} width={84} height={64} />
                  <span>{i.title}</span>
                </Link>
              </td>
              <td>{i.size}</td>
              <td>{shortPrice(i.price)}</td>
              <td>
                <button className="qty-btn" onClick={() => setQty(i.sku, i.qty - 1)} aria-label="Decrease quantity">−</button>
                <span style={{ margin: "0 10px" }}>{i.qty}</span>
                <button className="qty-btn" onClick={() => setQty(i.sku, i.qty + 1)} aria-label="Increase quantity">+</button>
              </td>
              <td>{shortPrice(i.price * i.qty)}</td>
              <td><button className="qty-btn" onClick={() => remove(i.sku)} aria-label="Remove item">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: "right", marginTop: 20 }}>
        <p style={{ margin: "4px 0" }}>Subtotal: <b>{shortPrice(subtotal)}</b></p>
        <p style={{ margin: "4px 0" }}>Shipping: <b>{shipping === 0 ? "FREE" : shortPrice(shipping)}</b></p>
        <p style={{ margin: "4px 0", fontSize: 20 }}>Total: <b>{shortPrice(subtotal + shipping)}</b> CAD</p>
        <p style={{ fontSize: 13, color: "#6f6a61" }}>Use code ART10 at checkout for 10% off. Test mode — no real payment is taken in this preview.</p>
        {error && <p style={{ color: "#a33", fontSize: 14 }}>{error}</p>}
        <button className="btn btn-gold" onClick={checkout} disabled={busy} style={{ marginTop: 8 }}>
          {busy ? "Redirecting to Stripe…" : "Checkout with Stripe →"}
        </button>
      </div>
    </div>
  );
}
