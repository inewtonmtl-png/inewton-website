"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header>
      <div className="announce">
        <b>ART10</b> — 10% off your first order &nbsp;·&nbsp; Free shipping over $75
      </div>
      <div className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            i<span>Newton</span>
          </Link>
          <nav className="nav">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop All</Link>
            <Link href="/shop?cat=Diwali">Diwali</Link>
            <Link href="/shop?cat=Christmas">Christmas</Link>
            <Link href="/shop?cat=Religious%20%26%20Spiritual">Religious</Link>
            <Link href="/shop?cat=Animals%20%26%20Wildlife">Animals</Link>
          </nav>
          <div className="header-right">
            <Link href="/cart" className="cart-link">
              Cart{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
