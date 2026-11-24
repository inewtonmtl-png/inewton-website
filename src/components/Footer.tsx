import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>iNewton</h3>
            <p style={{ margin: "0 0 10px" }}>
              Canvas wall art, printed in true-to-life detail and hand-stretched over solid wood
              frames. Gallery-wrapped, ready to hang.
            </p>
            <p style={{ margin: 0 }}>
              Based in Montreal, Canada. Shipping only — no local pickup.
              Free shipping over $75, otherwise $9.99.
            </p>
          </div>
          <div>
            <h3>Shop</h3>
            <p style={{ margin: "0 0 6px" }}><Link href="/shop">All canvas art</Link></p>
            <p style={{ margin: "0 0 6px" }}><Link href="/shop?cat=Diwali">Diwali collection</Link></p>
            <p style={{ margin: "0 0 6px" }}><Link href="/shop?cat=Christmas">Christmas</Link></p>
            <p style={{ margin: 0 }}><Link href="/shop?cat=Religious%20%26%20Spiritual">Religious &amp; spiritual</Link></p>
          </div>
          <div>
            <h3>Help</h3>
            <p style={{ margin: "0 0 6px" }}><Link href="/shipping">Shipping</Link></p>
            <p style={{ margin: "0 0 6px" }}><Link href="/returns">Returns &amp; replacements</Link></p>
            <p style={{ margin: "0 0 6px" }}><Link href="/privacy">Privacy policy</Link></p>
            <p style={{ margin: "0 0 6px" }}><Link href="/terms">Terms of service</Link></p>
            <p style={{ margin: 0 }}><Link href="/contact">Contact us</Link></p>
          </div>
          <div>
            <h3>Follow us</h3>
            <p style={{ margin: "0 0 6px" }}>
              <a href="https://www.tiktok.com/@inewton.ca" target="_blank" rel="noreferrer">TikTok — @inewton.ca</a>
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <a href="https://www.instagram.com/inewton.ca/" target="_blank" rel="noreferrer">Instagram — @inewton.ca</a>
            </p>
            <p style={{ margin: 0 }}>
              <a href="https://www.facebook.com/profile.php?id=61555559154211" target="_blank" rel="noreferrer">Facebook — INewton</a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 iNewton · inewton.ca · Prices in CAD. Use code ART10 for 10% off.
          Free shipping over $75 · Secure checkout with Stripe.
        </div>
      </div>
    </footer>
  );
}
