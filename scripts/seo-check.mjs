import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const canonicalHost = "https://bkttactical.com";
const expectedPaths = [
  "/",
  "/about/",
  "/products/",
  "/products/trishul-10kg/",
  "/products/trishul-16kg/",
  "/products/trishul-30kg/",
  "/solutions/",
  "/compliance/",
  "/insights/",
  "/insights/heavy-payload-drones-india/",
  "/insights/rtk-navigation-for-uav-missions/",
  "/insights/make-in-india-drone-manufacturing/",
  "/insights/emergency-response-uav-logistics/",
  "/careers/",
  "/contact/",
];

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(haystack, needle, message) {
  assert(haystack.includes(needle), message);
}

const baseLayout = read("src/layouts/BaseLayout.astro");
assertIncludes(baseLayout, '"@graph"', "Base layout should emit JSON-LD @graph.");
assertIncludes(baseLayout, "application/ld+json", "Base layout should emit JSON-LD.");
assertIncludes(baseLayout, "og:image", "Base layout should emit Open Graph image metadata.");
assertIncludes(baseLayout, "twitter:card", "Base layout should emit Twitter card metadata.");

const schema = read("src/lib/schema.ts");
for (const schemaType of ["BreadcrumbList", "ContactPoint", "Product", "Article", "ItemList"]) {
  assertIncludes(schema, schemaType, `Schema helper should include ${schemaType} schema.`);
}
assert(!schema.includes("+1-800-555-0199"), "Schema must not publish fake phone data.");

const sitemap = read("public/sitemap.xml");
for (const path of expectedPaths) {
  assertIncludes(sitemap, `<loc>${canonicalHost}${path}</loc>`, `Sitemap missing ${path}.`);
}
assert(!sitemap.includes("www.bkttactical.com"), "Sitemap should not include www URLs.");
assertIncludes(sitemap, "<lastmod>2026-05-13</lastmod>", "Sitemap should include lastmod dates.");

const robots = read("public/robots.txt");
assertIncludes(robots, "User-agent: *", "robots.txt should include global crawler rule.");
assertIncludes(robots, "Allow: /", "robots.txt should allow crawling.");
assertIncludes(robots, `Sitemap: ${canonicalHost}/sitemap.xml`, "robots.txt should point to the sitemap.");
assert(!robots.includes("Disallow: /"), "robots.txt must not block the site.");

const pageFiles = [
  "src/pages/index.astro",
  "src/pages/about.astro",
  "src/pages/products/index.astro",
  "src/pages/products/[slug].astro",
  "src/pages/solutions.astro",
  "src/pages/compliance.astro",
  "src/pages/insights/index.astro",
  "src/pages/insights/[slug].astro",
  "src/pages/careers.astro",
  "src/pages/contact.astro",
];

for (const file of pageFiles) {
  const contents = read(file);
  assertIncludes(contents, "<BaseLayout", `${file} should use BaseLayout.`);
  assertIncludes(contents, "title=", `${file} should define a title.`);
  assertIncludes(contents, "description=", `${file} should define a meta description.`);
  assertIncludes(contents, "<h1", `${file} should include one H1.`);
}

const nav = read("src/components/SiteNav.astro");
for (const path of ["/products/", "/solutions/", "/about/", "/insights/", "/contact/"]) {
  assertIncludes(nav, `href="${path}"`, `Navigation missing ${path}.`);
}

const footer = read("src/components/SiteFooter.astro");
for (const path of ["/products/", "/solutions/", "/compliance/", "/insights/", "/careers/", "/contact/"]) {
  assertIncludes(footer, `href="${path}"`, `Footer missing ${path}.`);
}

const contact = read("src/pages/contact.astro");
assertIncludes(contact, "forms.zohopublic.in", "Contact form should keep Zoho Forms submission.");
assertIncludes(contact, 'target="zoho-contact-submit-frame"', "Contact form should keep hidden iframe submission.");

console.log("SEO checks passed.");
