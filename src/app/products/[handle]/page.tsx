import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProduct } from "@/lib/catalog";
import ProductDetails from "@/components/ProductDetails";

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) return { title: "Not found | iNewton" };
  const description =
    product.description.length > 160
      ? `${product.description.slice(0, 157)}…`
      : product.description;
  const image = product.images[0]?.url;
  return {
    title: `${product.title} | iNewton`,
    description,
    openGraph: {
      title: `${product.title} | iNewton`,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: product.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | iNewton`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  return <ProductDetails product={product} />;
}
