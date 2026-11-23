import Image from "next/image";
import Link from "next/link";
import { shortPrice } from "@/lib/catalog";

export type CardProduct = {
  handle: string;
  title: string;
  image: string;
  minPrice: number;
  compareAt?: number | null;
};

export default function ProductCard({ p }: { p: CardProduct }) {
  return (
    <Link href={`/products/${p.handle}`} className="card">
      <Image
        src={p.image}
        alt={p.title}
        width={800}
        height={600}
        loading="lazy"
        style={{ width: "100%", height: "auto", aspectRatio: "4 / 3", objectFit: "cover" }}
      />
      <div className="card-body">
        <h3>{p.title}</h3>
        <div>
          <span className="from">From </span>
          <span className="price">{shortPrice(p.minPrice)}</span>
          {p.compareAt ? <span className="compare">{shortPrice(p.compareAt)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
