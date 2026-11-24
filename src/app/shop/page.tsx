"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";

type IndexItem = {
  handle: string;
  title: string;
  image: string;
  minPrice: number;
  orientations: string[];
  category: string;
  tags: string[];
};

const PAGE_SIZE = 24;
const ORIENTATIONS = ["all", "square", "horizontal", "vertical"] as const;

function ShopInner() {
  const params = useSearchParams();
  const catParam = params.get("cat") || "All";
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState("");
  const [orient, setOrient] = useState<string>("all");
  const [cat, setCat] = useState<string>(catParam);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);

  const loadIndex = () => {
    setLoadError(false);
    fetch("/data/index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: IndexItem[]) => setItems(d))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setCat(catParam), [catParam]);
  useEffect(() => setPage(1), [q, orient, cat, sort]);

  const cats = useMemo(() => {
    const s = new Set(items.map((i) => i.category));
    return ["All", ...Array.from(s).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (cat !== "All") list = list.filter((i) => i.category === cat);
    if (orient !== "all") list = list.filter((i) => i.orientations.includes(orient));
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(needle) ||
          i.tags.some((t) => t.toLowerCase().includes(needle))
      );
    }
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.minPrice - b.minPrice);
    else if (sort === "price-desc") sorted.sort((a, b) => b.minPrice - a.minPrice);
    else if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [items, q, orient, cat, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container">
      <div className="section" style={{ paddingBottom: 0 }}>
        <h2>Shop all canvas art</h2>
        <p className="sub">
          {items.length ? `${filtered.length.toLocaleString()} of ${items.length.toLocaleString()} designs` : "Loading designs…"}
        </p>
      </div>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search fox, Ganesha, sunset, ocean…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search products"
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          {cats.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>
      <div className="toolbar" style={{ marginTop: 0 }}>
        {ORIENTATIONS.map((o) => (
          <button key={o} className={`chip${orient === o ? " active" : ""}`} onClick={() => setOrient(o)}>
            {o === "all" ? "All orientations" : o[0].toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid" style={{ paddingBottom: 20 }}>
        {pageItems.map((p) => (
          <ProductCard key={p.handle} p={{ handle: p.handle, title: p.title, image: p.image, minPrice: p.minPrice }} />
        ))}
      </div>
      {loadError && items.length === 0 && (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <p>Couldn&apos;t load the designs — please check your connection and try again.</p>
          <button className="btn btn-outline" onClick={loadIndex}>Retry</button>
        </div>
      )}
      {filtered.length === 0 && items.length > 0 && (
        <p style={{ padding: "20px 0" }}>No designs match that search. Try another word or clear the filters.</p>
      )}
      {pages > 1 && (
        <div className="toolbar" style={{ justifyContent: "center", paddingBottom: 40 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span style={{ fontSize: 14 }}>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopInner />
    </Suspense>
  );
}
