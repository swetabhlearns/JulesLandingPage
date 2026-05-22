import { products } from "./seo-data";

type OgEntry = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const staticOgEntries: OgEntry[] = [
  {
    slug: "home",
    eyebrow: "BKT Tactical Solutions",
    title: "Heavy payload UAV platforms built in India",
    description: "Trishul Series drones for logistics, tactical deployment, and field operations.",
  },
  {
    slug: "about",
    eyebrow: "About",
    title: "Indian drone and tactical solutions company",
    description: "Heavy payload UAV development, indigenous capability, and responsible field execution.",
  },
  {
    slug: "products",
    eyebrow: "Trishul Series",
    title: "Heavy payload UAV platforms",
    description: "10kg, 16kg, and 30kg payload configurations for Indian missions.",
  },
  {
    slug: "solutions",
    eyebrow: "Solutions",
    title: "Drone logistics and tactical UAV solutions",
    description: "Mission planning for logistics, surveillance, emergency response, and field deployment.",
  },
  {
    slug: "blogs",
    eyebrow: "Blogs",
    title: "Drone blogs and UAV guides",
    description: "India-focused guides on payload planning, RTK navigation, rules, and drone operations.",
  },
  {
    slug: "compliance",
    eyebrow: "Compliance",
    title: "Responsible UAV development",
    description: "Verified disclosure, Make in India capability, and DGCA-aware planning.",
  },
  {
    slug: "careers",
    eyebrow: "Careers",
    title: "Build Indian UAV capability",
    description: "Engineering, manufacturing, operations, and field support roles.",
  },
  {
    slug: "contact",
    eyebrow: "Contact",
    title: "Discuss a UAV requirement",
    description: "Share payload, route, use case, and deployment requirements with BKT Tactical.",
  },
  ...products.map((product) => ({
    slug: `product-${product.slug}`,
    eyebrow: "Trishul Series",
    title: product.name,
    description: `${product.payload} payload, ${product.endurance} endurance, ${product.configuration}.`,
  })),
];

export function ogSlugForPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return "home";
  if (normalized === "/insights") return "blogs";
  if (normalized.startsWith("/insights/")) {
    return `blog-${normalized.split("/").filter(Boolean).at(-1)}`;
  }
  if (normalized === "/products") return "products";
  if (normalized.startsWith("/products/")) {
    return `product-${normalized.split("/").filter(Boolean).at(-1)}`;
  }
  return normalized.split("/").filter(Boolean)[0] ?? "home";
}

export function ogImageForPath(pathname: string) {
  return `/og/${ogSlugForPath(pathname)}.svg/`;
}
