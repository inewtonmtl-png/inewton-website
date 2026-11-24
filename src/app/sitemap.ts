import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";

const BASE = "https://inewton.ca";
const POLICY_PAGES = ["shipping", "returns", "privacy", "terms", "contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/cart`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...POLICY_PAGES.map((slug) => ({
      url: `${BASE}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...getAllProducts().map((p) => ({
      url: `${BASE}/products/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
