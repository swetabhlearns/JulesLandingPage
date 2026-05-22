import test from "node:test";
import assert from "node:assert/strict";
import { MemoryBlogStore } from "../src/blog-store.js";
import { runIndexingMonitor } from "../src/index-monitor.js";
import { BLOG_STATUS } from "../src/types.js";

test("index monitor flags published posts missing from sitemap", async () => {
  const store = new MemoryBlogStore([
    {
      slug: "heavy-payload-drones-in-india",
      title: "Heavy Payload Drones in India",
      description: "A practical guide.",
      category: "Insights",
      status: BLOG_STATUS.PUBLISHED,
      publishedAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
      bodyMarkdown: "# Heavy Payload Drones in India\n",
    },
  ]);

  const report = await runIndexingMonitor({
    env: {
      SITE_URL: "https://bkttactical.com",
      INDEX_MONITOR_MIN_AGE_HOURS: 1,
    },
    store,
    fetchImpl: async (url) => {
      if (String(url).endsWith("/sitemap.xml")) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bkttactical.com/insights/some-other-post/</loc>
    <lastmod>2026-05-13T00:00:00Z</lastmod>
  </url>
</urlset>`,
          { status: 200, headers: { "Content-Type": "application/xml" } },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    now: new Date("2026-05-15T00:00:00Z"),
  });

  assert.equal(report.status, "attention");
  assert.equal(report.alerts[0].issue, "Missing from sitemap");
});

test("index monitor passes when the post is in the sitemap", async () => {
  const store = new MemoryBlogStore([
    {
      slug: "heavy-payload-drones-in-india",
      title: "Heavy Payload Drones in India",
      description: "A practical guide.",
      category: "Insights",
      status: BLOG_STATUS.PUBLISHED,
      publishedAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
      bodyMarkdown: "# Heavy Payload Drones in India\n",
    },
  ]);

  const report = await runIndexingMonitor({
    env: {
      SITE_URL: "https://bkttactical.com",
      INDEX_MONITOR_MIN_AGE_HOURS: 1,
    },
    store,
    fetchImpl: async (url) => {
      if (String(url).endsWith("/sitemap.xml")) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bkttactical.com/insights/heavy-payload-drones-in-india/</loc>
    <lastmod>2026-05-13T00:00:00Z</lastmod>
  </url>
</urlset>`,
          { status: 200, headers: { "Content-Type": "application/xml" } },
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    now: new Date("2026-05-15T00:00:00Z"),
  });

  assert.equal(report.status, "ok");
  assert.equal(report.alerts.length, 0);
});
