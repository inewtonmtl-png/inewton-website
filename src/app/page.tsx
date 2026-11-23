import Image from "next/image";
import Link from "next/link";
import { getAllProducts, getHomeData, getProduct, shortPrice } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const home = getHomeData();
  const best = home.bestSellers.map((h) => getProduct(h)).filter((p): p is NonNullable<typeof p> => !!p);
  const total = getAllProducts().length;

  return (
    <div className="container">
      <section className="hero">
        <div>
          <span className="badge-art10">ART10 — 10% OFF</span>
          <h1 style={{ marginTop: 14 }}>Canvas wall art that makes a room feel like home.</h1>
          <p>
            Gallery-wrapped canvas prints on solid wood frames — ready to hang, made to last.
            {` ${total.toLocaleString()} designs, from $35 CAD, with free shipping over $75.`}
          </p>
          <Link href="/shop" className="btn btn-gold">Shop all art</Link>{" "}
          <Link href="/shop?cat=Diwali" className="btn btn-outline">Diwali collection</Link>
        </div>
        <div>
          <Image
            src={home.hero.image}
            alt="Red fox portrait canvas in a living room"
            width={1320}
            height={880}
            priority
            style={{ borderRadius: 6 }}
          />
        </div>
      </section>

      <section className="section">
        <h2>Best sellers</h2>
        <p className="sub">A varied pick from across the collection — wildlife, festive, spiritual and more.</p>
        <div className="grid">
          {best.map((p) => (
            <ProductCard
              key={p.handle}
              p={{ handle: p.handle, title: p.title, image: p.images[0].url, minPrice: p.minPrice }}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Shop by category</h2>
        <p className="sub">Find the right piece for every wall.</p>
        <div className="cat-grid">
          {home.categories.map((c) => (
            <Link key={c.name} href={`/shop?cat=${encodeURIComponent(c.name)}`} className="cat-card">
              <Image src={c.image} alt={c.name} width={800} height={600} loading="lazy" />
              <div className="label">
                <b>{c.name}</b>
                <span>{c.count} designs</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Duo &amp; Trio sets</h2>
        <p className="sub">
          Two or three separate gallery-wrapped canvases, sold together at a set price.
          12×20 Duo $59 · Trio $85 · 16×32 Duo $85 · Trio $125.
        </p>
        <div className="bundle-strip">
          {home.bundles.map((b) => {
            const cheapest = Math.min(...b.options.map((o) => o.price));
            return (
              <Link key={b.key} href={`/products/${b.options[0].handle}`} className="bundle">
                <Image src={b.image} alt={b.name} width={600} height={600} loading="lazy" />
                <div className="b-body">
                  <b>{b.name}</b>
                  <div>
                    <span className="from">From </span>
                    <span className="price">{shortPrice(cheapest)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>Why iNewton</h2>
        <p className="sub">
          Printed in true-to-life detail on fade-resistant canvas, hand-stretched over solid pine,
          and shipped ready to hang — no extra hardware needed. Free shipping over $75 in Canada
          and the US, otherwise $9.99. Shipping only, no local pickup. Montreal, Canada.
        </p>
      </section>
    </div>
  );
}
