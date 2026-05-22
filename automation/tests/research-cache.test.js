import test from "node:test";
import assert from "node:assert/strict";
import { MemoryBlogStore } from "../src/blog-store.js";
import { runBlogPipeline } from "../src/pipeline.js";

function createFakeCache() {
  const store = new Map();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

test("pipeline reuses cached Exa research across repeated runs", async () => {
  let searchCalls = 0;
  let contentsCalls = 0;
  const cache = createFakeCache();

  const exa = {
    async search({ query }) {
      searchCalls += 1;
      return {
        results: [
          {
            title: `${query} India guide`,
            url: "https://example.in/article",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "India focused guide for operators and buyers.",
          },
        ],
      };
    },
    async contents({ urls }) {
      contentsCalls += 1;
      return {
        results: [
          {
            url: urls[0],
            title: "Heavy Payload Drones India guide",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "Grounded source material for India-focused evaluation.",
          },
        ],
      };
    },
  };

  const groq = {
    async generateJson() {
      return {
        title: "Heavy Payload Drones India: What To Evaluate",
        slug: "heavy-payload-drones-india-what-to-evaluate",
        description: "How to evaluate heavy payload drones in India.",
        category: "Heavy Payload UAVs",
        primaryKeyword: "heavy payload drones india",
        supportingKeywords: ["payload planning", "uav logistics india"],
        metaTitle: "Heavy Payload Drones India | BKT Tactical",
        metaDescription: "How to evaluate heavy payload drones in India.",
        intro:
          "Heavy payload drones in India need practical evaluation, because real procurement decisions depend on payload margins, route planning, serviceability, and mission fit rather than a single spec line. Buyers should compare the platform against the actual operating environment, the support model, and the delivery use case before making a purchase decision.",
        sections: [
          {
            heading: "Payload and mission fit",
            body: "Practical payload planning for India starts with the mission profile: what needs to move, how far, how often, and in what weather or terrain conditions. A platform that looks strong on paper can still underperform if reserve margin, handling, or turnaround time do not match the use case.",
          },
          {
            heading: "Competition and intent",
            body: "Rankable topics are usually highly specific and tightly aligned to buyer intent. In this example, the keyword focus is narrow enough to win attention while still tying directly to procurement, logistics, and operational evaluation criteria.",
          },
          {
            heading: "What buyers should compare",
            body: "A serious comparison should consider endurance under payload, platform stability, maintenance access, navigation reliability, field support, and whether the drone is actually appropriate for Indian operating conditions. These details help the article win search intent and help the reader make a better decision.",
          },
        ],
        faq: [{ question: "What should buyers check?", answer: "Payload, endurance, and mission fit." }],
        sourceUrls: ["https://example.in/article"],
      };
    },
  };

  const env = { BLOG_CACHE: cache, BLOG_MIN_WORDS: "80", BLOG_MIN_SECTIONS: "2" };

  const first = await runBlogPipeline({
    env,
    store: new MemoryBlogStore(),
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
  });

  assert.equal(first.status, "published");
  const countsAfterFirst = { searchCalls, contentsCalls };

  const second = await runBlogPipeline({
    env,
    store: new MemoryBlogStore(),
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
  });

  assert.equal(second.status, "published");
  assert.equal(searchCalls, countsAfterFirst.searchCalls);
  assert.equal(contentsCalls, countsAfterFirst.contentsCalls);
});
