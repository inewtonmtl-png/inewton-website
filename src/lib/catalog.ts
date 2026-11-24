import products from "@/data/products.json";
import home from "@/data/home.json";

export type Variant = {
  size: string;
  orientation: "square" | "horizontal" | "vertical";
  price: number;
  compareAt: number | null;
  sku: string;
  barcode: string;
};

export type Product = {
  handle: string;
  title: string;
  fullTitle: string;
  description: string;
  tags: string[];
  type: string;
  images: { url: string; w: number; h: number }[];
  variants: Variant[];
  minPrice: number;
  orientations: string[];
  isBundle: boolean;
  category: string;
};

const all = products as Product[];

export function getAllProducts(): Product[] {
  return all;
}

export function getProduct(handle: string): Product | undefined {
  return all.find((p) => p.handle === handle);
}

/** Server-side price lookup: find the product + variant for a SKU. */
export function getVariantBySku(sku: string): { product: Product; variant: Variant } | undefined {
  for (const p of all) {
    const variant = p.variants.find((v) => v.sku === sku);
    if (variant) return { product: p, variant };
  }
  return undefined;
}

export function getHomeData() {
  return home as {
    bestSellers: string[];
    categories: { name: string; count: number; image: string; handle: string }[];
    bundles: {
      key: string;
      name: string;
      image: string;
      options: { handle: string; label: string; price: number; compareAt: number | null }[];
    }[];
    hero: { handle: string; image: string };
  };
}

export function formatCAD(n: number): string {
  return `$${n.toFixed(2)} CAD`;
}

export function shortPrice(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
