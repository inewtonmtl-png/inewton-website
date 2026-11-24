"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart";

type Status = "loading" | "paid" | "not-found";

function SuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { clear } = useCart();
  const [status, setStatus] = useState<Status>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("not-found");
      return;
    }
    fetch(`/api/checkout/session?id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((d) => {
        if (d.payment_status === "paid") {
          setAmount(typeof d.amount_total === "number" ? d.amount_total / 100 : null);
          setStatus("paid");
        } else {
          setStatus("not-found");
        }
      })
      .catch(() => setStatus("not-found"));
  }, [sessionId]);

  useEffect(() => {
    if (status === "paid" && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [status, clear]);

  return (
    <div className="container section" style={{ textAlign: "center" }}>
      {status === "loading" && (
        <>
          <h2>Checking your order…</h2>
          <p className="sub">Confirming your payment with Stripe.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <h2>Thank you! 🎉</h2>
          <p className="sub">
            Your order is confirmed
            {amount !== null ? ` — ${amount.toFixed(2)} CAD charged` : ""}. A receipt is on
            its way to your email. Your canvas will be printed, stretched and shipped —
            free over $75, otherwise $9.99.
          </p>
          <Link href="/shop" className="btn btn-gold">Keep shopping</Link>
        </>
      )}
      {status === "not-found" && (
        <>
          <h2>No confirmed order found</h2>
          <p className="sub">
            We couldn&apos;t find a confirmed payment for this order. If you just paid, please
            wait a moment and refresh — or check your email for a receipt. If you were
            charged and still see this message, email us at inewton.mtl@gmail.com.
          </p>
          <Link href="/shop" className="btn btn-gold">Keep shopping</Link>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
