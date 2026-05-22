import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const siteUrl = "https://bkttactical.com";
const defaultBlogApiUrl = "https://bkt-blog-automation.nick900684.workers.dev";

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function getEnvValue(key) {
  return process.env[key];
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function extractStaticPaths() {
  const seoData = read("src/lib/seo-data.ts");
  const pattern = /path:\s*"([^"]+)"(?:,\s*lastmod:\s*"([^"]+)")?/g;
  const paths = [];
  let match;
  while ((match = pattern.exec(seoData))) {
    paths.push({
      path: match[1],
      lastmod: match[2] ?? "2026-05-13",
    });
  }
  return paths;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap source (${response.status})`);
  }
  return response.json();
}

async function loadBlogPosts() {
  const baseUrl = (getEnvValue("BLOG_API_URL") ?? defaultBlogApiUrl).replace(/\/$/, "");
  try {
    const payload = await fetchJson(`${baseUrl}/api/blogs`);
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

function renderUrlEntry(path, lastmod) {
  return [
    "  <url>",
    `    <loc>${escapeXml(new URL(path, siteUrl).href)}</loc>`,
    `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const staticPaths = extractStaticPaths();
  const blogPosts = await loadBlogPosts();
  const blogEntries = blogPosts.map((post) => ({
    path: post.path || `/insights/${post.slug}/`,
    lastmod: post.updatedAt || post.publishedAt || new Date().toISOString(),
  }));

  const entries = [...staticPaths, ...blogEntries];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => renderUrlEntry(entry.path, entry.lastmod)),
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(join(root, "public/sitemap.xml"), xml);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
