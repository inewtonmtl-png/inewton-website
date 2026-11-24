"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { shortPrice, type Product } from "@/lib/catalog";

const GROUP_LABEL: Record<string, string> = {
  square: "Square",
  horizontal: "Horizontal",
  vertical: "Vertical",
};

export default function ProductDetails({ product }: { product: Product }) {
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const groups = useMemo(() => {
    const order = ["square", "horizontal", "vertical"] as const;
    return order
      .map((o) => ({ orientation: o, variants: product.variants.filter((v) => v.orientation === o) }))
      .filter((g) => g.variants.length > 0);
  }, [product]);

  const allVariants = product.variants;
  const [selectedSku, setSelectedSku] = useState<string>(() => {
    const cheapest = [...allVariants].sort((a, b) => a.price - b.price)[0];
    return cheapest?.sku ?? "";
  });
  const selected = allVariants.find((v) => v.sku === selectedSku) ?? allVariants[0];
  const images = product.images ?? [];
  const mainImage = images[Math.min(imgIdx, Math.max(0, images.length - 1))];

  if (!selected) {
    return (
      <div className="product-page container">
        <div>
          <h1 style={{ fontSize: 34, lineHeight: 1.2 }}>{product.title}</h1>
          <p style={{ color: "#6f6a61" }}>This design is currently unavailable.</p>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    add(
      {
        handle: product.handle,
        title: product.title,
        image: product.images[0]?.url ?? "/favicon.svg",
        size: `${selected.size} in`,
        sku: selected.sku,
        price: selected.price,
        compareAt: selected.compareAt,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="product-page container">
      <div>
        <div className="gallery-main">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={product.title}
              width={1200}
              height={900}
              priority
              style={{ width: "100%", height: "auto" }}
            />
          ) : (
            <div
              style={{
                aspectRatio: "4 / 3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111111",
                color: "#C9A86A",
                fontFamily: "Georgia, serif",
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              iN
            </div>
          )}
        </div>
        {images.length > 0 && (
        <div className="thumbs">
          {images.map((im, i) => (
            <button key={im.url} className={i === imgIdx ? "active" : ""} onClick={() => setImgIdx(i)} aria-label={`View image ${i + 1}`}>
              <Image src={im.url} alt="" width={152} height={112} loading="lazy" />
            </button>
          ))}
        </div>
        )}
      </div>
      <div>
        <p style={{ margin: "0 0 6px", color: "#6f6a61", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {product.category} · Canvas wall art
        </p>
        <h1 style={{ fontSize: 34, lineHeight: 1.2, margin: "0 0 10px" }}>{product.title}</h1>
        <p style={{ margin: "0 0 4px" }}>
          <span className="price" style={{ fontSize: 24 }}>{shortPrice(selected.price)}</span>
          {selected.compareAt ? <span className="compare" style={{ fontSize: 16 }}>{shortPrice(selected.compareAt)}</span> : null}
          <span className="from"> CAD</span>
        </p>
        <p style={{ margin: "0 0 4px", fontSize: 14 }}>
          <span className="badge-art10">ART10</span> — 10% off at checkout with code ART10
        </p>
        <p style={{ color: "#6f6a61" }}>{product.description}</p>

        {groups.map((g) => (
          <div key={g.orientation}>
            <div className="size-group">{GROUP_LABEL[g.orientation]} sizes</div>
            <div className="size-row">
              {g.variants.map((v) => (
                <button
                  key={v.sku}
                  className={`size-btn${v.sku === selectedSku ? " active" : ""}`}
                  onClick={() => setSelectedSku(v.sku)}
                >
                  <b>{v.size} in</b>
                  <span>{shortPrice(v.price)}{v.compareAt ? ` (was ${shortPrice(v.compareAt)})` : ""}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 14 }}>
            Qty{" "}
            <select value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "#fff" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="btn btn-gold" onClick={handleAdd}>
            {added ? "Added to cart ✓" : "Add to cart"}
          </button>
          {added && (
            <Link href="/cart" className="btn btn-outline">View cart →</Link>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#6f6a61", marginTop: 12 }}>
          SKU: {selected.sku} · Size: {selected.size} in
        </p>

        <div className="note">
          <b>Shipping:</b> free over $75, otherwise $9.99. Shipping only, no local pickup.
          Based in Montreal, Canada. Canvas print on a wood gallery-wrapped frame, ready to hang.
        </div>
      </div>
    </div>
  );
}
