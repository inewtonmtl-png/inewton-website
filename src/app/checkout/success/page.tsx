import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <div className="container section" style={{ textAlign: "center" }}>
      <h2>Thank you! 🎉</h2>
      <p className="sub">
        Your order is confirmed. A receipt is on its way to your email.
        Your canvas will be printed, stretched and shipped — free over $75, otherwise $9.99.
      </p>
      <Link href="/shop" className="btn btn-gold">Keep shopping</Link>
    </div>
  );
}
