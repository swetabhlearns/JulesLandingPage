import { products } from "./seo-data";

type OgEntry = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value: string, maxLineLength: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export function renderOgSvg(entry: { eyebrow: string; title: string; description: string }) {
  const titleLines = wrapText(entry.title, 34, 3);
  const descriptionLines = wrapText(entry.description, 70, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1A36B0"/>
  <circle cx="960" cy="96" r="250" fill="#BAC3FF" fill-opacity="0.22"/>
  <circle cx="1020" cy="500" r="320" fill="#00115A" fill-opacity="0.26"/>
  <path d="M0 510C170 450 315 432 482 482C652 533 792 544 1200 430V630H0V510Z" fill="#00115A" fill-opacity="0.28"/>
  <rect x="80" y="76" width="1040" height="478" rx="18" stroke="white" stroke-opacity="0.18"/>
  <text x="108" y="132" fill="#FFFFFF" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="7">${escapeXml(entry.eyebrow.toUpperCase())}</text>
  ${titleLines
    .map(
      (line, index) =>
        `<text x="108" y="${230 + index * 72}" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("\n  ")}
  ${descriptionLines
    .map(
      (line, index) =>
        `<text x="108" y="${480 + index * 34}" fill="#FFFFFF" fill-opacity="0.78" font-family="Arial, Helvetica, sans-serif" font-size="28">${escapeXml(line)}</text>`,
    )
    .join("\n  ")}
  <text x="108" y="552" fill="#FFFFFF" fill-opacity="0.9" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">BKT Tactical Solutions</text>
  <text x="900" y="552" fill="#FFFFFF" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="22">bkttactical.com</text>
</svg>`;
}

export const staticOgEntries: OgEntry[] = [
  {
    slug: "home",
    eyebrow: "BKT Tactical Solutions",
    title: "Drone and tactical technology built in India",
    description: "UAV platforms, FPV training, Speaker Drone communication, and field deployment support.",
  },
  {
    slug: "about",
    eyebrow: "About",
    title: "Indian drone and tactical solutions company",
    description: "UAV platforms, FPV integration, training, field execution, and Make in India capability.",
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
    title: "Drone, tactical, and training solutions",
    description: "Logistics, FPV support, Speaker Drone communication, agriculture, mining, and deployment.",
  },
  {
    slug: "blogs",
    eyebrow: "Blogs",
    title: "Drone blogs and UAV guides",
    description: "India-focused guides on UAV platforms, FPV operations, RTK navigation, and field use cases.",
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
    title: "Build Indian drone technology",
    description: "UAV engineering, embedded systems, AI/ML, sales, FPV integration, and field roles.",
  },
  {
    slug: "contact",
    eyebrow: "Contact",
    title: "Discuss a UAV requirement",
    description: "Share platform, training, communication, payload, route, and deployment requirements.",
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
  return `/og/${ogSlugForPath(pathname)}.png`;
}
