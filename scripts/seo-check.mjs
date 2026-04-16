import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const baseLayout = read("src/layouts/BaseLayout.astro");
assert(baseLayout.includes('"@graph"'), "Base layout should emit JSON-LD @graph.");
assert(baseLayout.includes('application/ld+json'), "Base layout should emit JSON-LD.");

const schema = read("src/lib/schema.ts");
assert(schema.includes("BreadcrumbList"), "Schema helper should include breadcrumb schema.");
assert(schema.includes("ContactPoint"), "Schema helper should include contact point schema.");

const llms = read("public/llms.txt");
assert(llms.includes("What We Do"), "llms.txt should include the what we do section.");
assert(llms.includes("What We Do Not Do"), "llms.txt should include the disambiguation section.");

const robots = read("public/robots.txt");
assert(robots.includes("GPTBot"), "robots.txt should explicitly allow GPTBot.");
assert(robots.includes("Sitemap: https://bkttactical.com/sitemap.xml"), "robots.txt should point to the sitemap.");

console.log("SEO checks passed.");
