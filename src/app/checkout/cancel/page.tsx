import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div className="container section" style={{ textAlign: "center" }}>
      <h2>Checkout cancelled</h2>
      <p className="sub">No payment was taken. Your cart is still saved — come back whenever you’re ready.</p>
      <Link href="/cart" className="btn btn-gold">Back to cart</Link>{" "}
      <Link href="/shop" className="btn btn-outline">Continue shopping</Link>
    </div>
  );
}
