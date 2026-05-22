import type { APIRoute } from "astro";
import { getPublishedBlogPosts } from "../../lib/blog";
import { staticOgEntries } from "../../lib/og";

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

function renderSvg(entry: { eyebrow: string; title: string; description: string }) {
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

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();
  return [
    ...staticOgEntries.map((entry) => ({
      params: { slug: entry.slug },
      props: { entry },
    })),
    ...posts.map((post) => ({
      params: { slug: `blog-${post.slug}` },
      props: {
        entry: {
          eyebrow: post.category || "Blog",
          title: post.title,
          description: post.description,
        },
      },
    })),
  ];
}

export const GET: APIRoute = ({ props }) => {
  return new Response(renderSvg(props.entry), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

