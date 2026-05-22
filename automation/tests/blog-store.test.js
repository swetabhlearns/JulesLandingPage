import test from "node:test";
import assert from "node:assert/strict";
import { MemoryBlogStore } from "../src/blog-store.js";

test("MemoryBlogStore lists and fetches published posts", async () => {
  const store = new MemoryBlogStore([
    {
      slug: "rankable-topics-india",
      title: "Rankable Topics in India",
      description: "A guide to finding keywords",
      category: "SEO",
      primaryKeyword: "rankable topics india",
      sourceUrls: ["https://example.com"],
      bodyMarkdown: "# Rankable Topics\n\n## One\n\nBody\n\n## Two\n\nBody",
      sections: [
        { heading: "One", body: "Body" },
        { heading: "Two", body: "Body" },
      ],
    },
  ]);

  const list = await store.listPublished();
  assert.equal(list.length, 1);
  assert.equal(list[0].slug, "rankable-topics-india");

  const found = await store.findBySlug("rankable-topics-india");
  assert.equal(found?.title, "Rankable Topics in India");
});
