import { notFound } from "next/navigation";
import { getAllProducts, getProduct } from "@/lib/catalog";
import ProductDetails from "@/components/ProductDetails";

export async function generateStaticParams() {
  // Pre-render a small slice for fast first paint; the rest render on demand.
  return getAllProducts().slice(0, 20).map((p) => ({ handle: p.handle }));
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  return <ProductDetails product={product} />;
}
