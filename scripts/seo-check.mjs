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
assertIncludes(baseLayout, "ogImageForPath", "Base layout should derive unique Open Graph image URLs by route.");
assertIncludes(baseLayout, "ogType = \"website\"", "Base layout should support dynamic Open Graph type metadata.");
assertIncludes(baseLayout, "article:published_time", "Base layout should support article published time metadata.");
assertIncludes(baseLayout, "article:modified_time", "Base layout should support article modified time metadata.");
assertIncludes(baseLayout, "twitter:card", "Base layout should emit Twitter card metadata.");
assertIncludes(baseLayout, "PUBLIC_GOOGLE_SITE_VERIFICATION", "Base layout should support Google Search Console verification.");
assertIncludes(baseLayout, "googletagmanager.com/gtag/js", "Base layout should load GA4.");
assertIncludes(baseLayout, "G-H7BQYR81SD", "Base layout should include the BKT GA4 measurement ID.");

const schema = read("src/lib/schema.ts");
for (const schemaType of ["BreadcrumbList", "ContactPoint", "Product", "Article", "ItemList"]) {
  assertIncludes(schema, schemaType, `Schema helper should include ${schemaType} schema.`);
}
assertIncludes(schema, "FAQPage", "Product schema should include FAQPage schema.");
assertIncludes(schema, "datePublished", "Article schema should include datePublished when available.");
assertIncludes(schema, "dateModified", "Article schema should include dateModified when available.");
assert(!schema.includes("+1-800-555-0199"), "Schema must not publish fake phone data.");

const companyProfile = read("src/lib/company-profile.ts");
assertIncludes(companyProfile, "cin?", "Company profile should model CIN without publishing placeholders.");
assertIncludes(companyProfile, "gst?", "Company profile should model GST without publishing placeholders.");
assertIncludes(companyProfile, "registeredAddress?", "Company profile should model registered address without publishing placeholders.");
assertIncludes(companyProfile, "U26300JH2025PTC024324", "Company profile should publish the verified CIN.");
assertIncludes(companyProfile, "Atul Tripathi", "Company profile should publish verified director names.");
assertIncludes(companyProfile, "Birendra Kumar Tripathi", "Company profile should publish verified director names.");

const ogRoute = read("src/pages/og/[slug].svg.ts");
assertIncludes(ogRoute, 'width="1200"', "Generated OG images should be 1200px wide.");
assertIncludes(ogRoute, 'height="630"', "Generated OG images should be 630px tall.");

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
assertIncludes(nav, "data-desktop-nav", "Desktop nav should expose a responsive state hook.");
assertIncludes(nav, "data-mobile-nav", "Mobile nav should expose a responsive state hook.");
assertIncludes(nav, 'aria-hidden="true"', "Responsive nav should hide inactive duplicate nav from crawlers and assistive tech.");
assertIncludes(nav, "syncResponsiveNavState", "Responsive nav aria-hidden state should be synchronized at runtime.");

const blogClient = read("src/lib/blog.ts");
assertIncludes(blogClient, "getPublishedBlogPosts", "Blog client should fetch published posts through HTTP.");
assertIncludes(blogClient, "BLOG_API_URL", "Blog client should use a configurable API base URL.");

const insightsIndex = read("src/pages/insights/index.astro");
assertIncludes(insightsIndex, "getPublishedBlogPosts", "Insights index should load blog posts from the blog client.");

const insightsSlug = read("src/pages/insights/[slug].astro");
assertIncludes(insightsSlug, "getPublishedBlogPosts", "Insights detail page should build static paths from the blog client.");
assertIncludes(insightsSlug, "articleSchema(article)", "Insights detail page should pass the loaded article object into schema generation.");
assertIncludes(insightsSlug, 'ogType="article"', "Insights detail pages should use article Open Graph type.");
assertIncludes(insightsSlug, "publishedTime={article.publishedAt}", "Insights detail pages should emit article published time.");
assertIncludes(insightsSlug, "modifiedTime={article.updatedAt}", "Insights detail pages should emit article modified time.");
assertIncludes(insightsSlug, "Published {publishedDate}", "Insights detail pages should show visible publish dates.");

const productSlug = read("src/pages/products/[slug].astro");
assertIncludes(productSlug, 'ogType="product"', "Product detail pages should use product Open Graph type.");
assertIncludes(productSlug, "Technical specification", "Product detail pages should include a technical specification section.");
assertIncludes(productSlug, "Trishul variant comparison", "Product detail pages should include a variant comparison table.");
assertIncludes(productSlug, "Datasheet available on request", "Product detail pages should link to datasheet request CTA.");
assertIncludes(productSlug, "Product FAQs", "Product detail pages should include product FAQs.");
assertIncludes(productSlug, "productFaqItems", "Product detail pages should use shared FAQ content.");

for (const file of [
  "automation/package.json",
  "automation/wrangler.toml",
  "automation/prompts/business-profile.md",
  "automation/src/worker.js",
  "automation/src/pipeline.js",
  "automation/src/blog-store.js",
]) {
  read(file);
}

const footer = read("src/components/SiteFooter.astro");
for (const path of ["/products/", "/solutions/", "/compliance/", "/insights/", "/careers/", "/contact/"]) {
  assertIncludes(footer, `href="${path}"`, `Footer missing ${path}.`);
}

const contact = read("src/pages/contact.astro");
assertIncludes(contact, "forms.zohopublic.in", "Contact form should keep Zoho Forms submission.");
assertIncludes(contact, 'target="zoho-contact-submit-frame"', "Contact form should keep hidden iframe submission.");

console.log("SEO checks passed.");
