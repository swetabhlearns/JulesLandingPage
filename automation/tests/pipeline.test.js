import test from "node:test";
import assert from "node:assert/strict";
import { MemoryBlogStore } from "../src/blog-store.js";
import { runBlogPipeline } from "../src/pipeline.js";

test("pipeline skips when no rankable topic is available", async () => {
  const exa = {
    async search() {
      return { results: [] };
    },
  };
  const groq = {
    async generateJson() {
      return {};
    },
  };

  const report = await runBlogPipeline({
    env: { BLOG_MIN_WORDS: "80", BLOG_MIN_SECTIONS: "2" },
    store: new MemoryBlogStore(),
    researchClient: exa,
    writerClient: groq,
    minScore: 99,
  });

  assert.equal(report.status, "skipped");
});

test("pipeline publishes a validated blog post", async () => {
  const exa = {
    async search({ query }) {
      return {
        results: [
          {
            title: `${query} India guide`,
            url: "https://example.in/article",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "India focused guide",
          },
        ],
      };
    },
    async contents({ urls }) {
      return {
        results: [
          {
            url: urls[0],
            title: "Heavy Payload Drones India guide",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "Practical source material for India-focused heavy payload drone evaluation.",
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
            body:
              "Practical payload planning for India starts with the mission profile: what needs to move, how far, how often, and in what weather or terrain conditions. A platform that looks strong on paper can still underperform if reserve margin, handling, or turnaround time do not match the use case.",
          },
          {
            heading: "Competition and intent",
            body:
              "Rankable topics are usually highly specific and tightly aligned to buyer intent. In this example, the keyword focus is narrow enough to win attention while still tying directly to procurement, logistics, and operational evaluation criteria.",
          },
          {
            heading: "What buyers should compare",
            body:
              "A serious comparison should consider endurance under payload, platform stability, maintenance access, navigation reliability, field support, and whether the drone is actually appropriate for Indian operating conditions. These details help the article win search intent and help the reader make a better decision.",
          },
        ],
        faq: [
          { question: "What should buyers check?", answer: "Payload, endurance, and mission fit." },
        ],
        sourceUrls: ["https://example.in/article"],
      };
    },
  };

  const store = new MemoryBlogStore();
  const report = await runBlogPipeline({
    env: { BLOG_MIN_WORDS: "60", BLOG_MIN_SECTIONS: "2" },
    store,
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
  });

  assert.equal(report.status, "published");
  const published = await store.listPublished();
  assert.equal(published.length, 1);
  assert.match(published[0].bodyMarkdown, /href="\/(products|solutions|contact|about|compliance)\//);
});

test("pipeline skips an already-published topic before calling the writer", async () => {
  let writerCalls = 0;
  const exa = {
    async search({ query }) {
      return {
        results: [
          {
            title: `${query} India guide`,
            url: "https://example.in/article",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "A practical guide for India",
          },
        ],
      };
    },
  };
  const groq = {
    async generateJson() {
      writerCalls += 1;
      return {};
    },
  };
  const store = new MemoryBlogStore([
    {
      slug: "heavy-payload-drones-india",
      title: "Heavy Payload Drones in India",
      description: "Existing post",
      category: "Drones",
      primaryKeyword: "heavy payload drones india",
      supportingKeywords: ["drone logistics india"],
      sections: [{ heading: "Existing", body: "Existing post body" }],
      sourceUrls: ["https://example.in/existing"],
      bodyMarkdown: "# Existing",
      publishedAt: "2026-05-15T11:01:03.177Z",
      updatedAt: "2026-05-15T11:01:03.177Z",
    },
  ]);

  const report = await runBlogPipeline({
    env: { BLOG_MIN_WORDS: "50", BLOG_MIN_SECTIONS: "2" },
    store,
    profile: {
      brandName: "BKT Tactical Solutions",
      market: "India",
      audience: ["technical evaluators"],
      primaryOfferings: ["heavy payload UAV platforms"],
      contentGoals: ["grow organic traffic"],
      internalLinkTargets: ["/products/"],
      exclusions: [],
      tone: "specific",
      seoFocus: "India-specific rankable keywords",
      topicSeeding: ["heavy payload drones india"],
    },
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
  });

  assert.equal(report.status, "skipped");
  assert.equal(report.reason, "No non-duplicate topic found");
  assert.equal(writerCalls, 0);
  assert.equal(report.opportunities[0].excluded, true);
  assert.match(report.opportunities[0].exclusionReason, /Already covered/);
});

test("pipeline keeps searching after a duplicate and publishes a fresh topic", async () => {
  let writerCalls = 0;
  let writerPrompt = "";
  const exa = {
    async search({ query }) {
      return {
        results: [
          {
            title: `${query} India guide`,
            url: `https://example.in/${query.replaceAll(" ", "-")}`,
            publishedDate: "2026-05-01T00:00:00Z",
            text: "A practical guide for India",
          },
        ],
      };
    },
    async contents({ urls }) {
      return {
        results: [
          {
            url: urls[0],
            title: "Drone Rules India guide",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "Practical source material for India-focused drone education.",
          },
        ],
      };
    },
  };
  const groq = {
    async generateJson({ user }) {
      writerCalls += 1;
      writerPrompt = user;
      return {
        title: "Drone Rules India Explained",
        slug: "drone-rules-india-explained",
        description: "A practical guide to drone rules in India.",
        category: "Drone Education",
        primaryKeyword: "drone rules india explained",
        supportingKeywords: ["dgca drone rules", "drone license india"],
        metaTitle: "Drone Rules India Explained",
        metaDescription: "A practical guide to drone rules in India.",
        intro:
          "Drone rules in India matter because safe operation depends on understanding registration, zones, permissions, and responsible flight habits before a pilot takes off.",
        sections: [
          {
            heading: "What drone users should understand first",
            body:
              "A useful starting point is knowing that drone operations depend on weight class, location, purpose, and airspace restrictions. New users should check current guidance before planning flights.",
          },
          {
            heading: "How to think about safe operation",
            body:
              "Safe operation is not only about the aircraft. It also includes weather, people nearby, battery condition, privacy, and whether the flight area is appropriate for the mission.",
          },
        ],
        faq: [{ question: "Do drone rules change?", answer: "Yes. Operators should check current India-specific guidance before flying." }],
        sourceUrls: ["https://example.in/drone-rules-india-explained"],
      };
    },
  };
  const store = new MemoryBlogStore([
    {
      slug: "heavy-payload-drones-india",
      title: "Heavy Payload Drones in India",
      description: "Existing post",
      category: "Drones",
      primaryKeyword: "heavy payload drones india",
      supportingKeywords: ["drone logistics india"],
      sections: [{ heading: "Existing", body: "Existing post body" }],
      sourceUrls: ["https://example.in/existing"],
      bodyMarkdown: "# Existing",
      publishedAt: "2026-05-15T11:01:03.177Z",
      updatedAt: "2026-05-15T11:01:03.177Z",
    },
  ]);

  const report = await runBlogPipeline({
    env: { BLOG_MIN_WORDS: "20", BLOG_MIN_SECTIONS: "2" },
    store,
    profile: {
      brandName: "BKT Tactical Solutions",
      market: "India",
      audience: ["drone-curious readers"],
      primaryOfferings: ["heavy payload UAV platforms"],
      contentGoals: ["grow organic traffic"],
      internalLinkTargets: ["/compliance/", "/products/"],
      exclusions: [],
      tone: "specific",
      seoFocus: "India-specific rankable keywords",
      contentMix: [
        { lane: "product_solution", share: 10, seeds: ["heavy payload drones india"] },
        { lane: "general_education", share: 70, seeds: ["drone rules india explained"] },
      ],
      topicSeeding: [],
    },
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
    logger: { info() {}, warn() {}, error() {} },
  });

  assert.equal(report.status, "published");
  assert.equal(writerCalls, 1);
  assert.match(writerPrompt, /drone rules india explained/i);
  assert.equal(report.opportunities[0].excluded, true);
  assert.equal(report.opportunity.query, "drone rules india explained");
});

test("pipeline passes configured Exa search and source limits into research", async () => {
  let searchCalls = 0;
  let contentsCalls = 0;
  const sourceResults = Array.from({ length: 10 }, (_, index) => ({
    title: `Drone logistics India source ${index + 1}`,
    url: `https://example.in/source-${index + 1}`,
    publishedDate: "2026-05-01T00:00:00Z",
    text: "India drone logistics guide with practical examples and current operating context.",
  }));
  const exa = {
    async search() {
      searchCalls += 1;
      return { results: sourceResults };
    },
    async contents({ urls }) {
      contentsCalls += 1;
      return {
        results: [
          {
            url: urls[0],
            title: "Drone logistics India source",
            publishedDate: "2026-05-01T00:00:00Z",
            text: "Detailed source material for India-focused UAV logistics planning.",
          },
        ],
      };
    },
  };
  const groq = {
    async generateJson() {
      return {
        title: "Drone Logistics India: Planning Reliable UAV Missions",
        slug: "drone-logistics-india-planning-reliable-uav-missions",
        description: "A practical guide to drone logistics planning in India.",
        category: "Drone Logistics",
        primaryKeyword: "drone logistics india",
        supportingKeywords: ["uav logistics planning", "drone delivery india"],
        metaTitle: "Drone Logistics India | BKT Tactical",
        metaDescription: "A practical guide to drone logistics planning in India.",
        intro: "Drone logistics in India works best when teams connect the payload, route, weather, landing area, and operating permissions before selecting a UAV platform.",
        sections: [
          { heading: "Mission framing", body: "India-focused drone logistics planning starts with the payload, route, handoff point, and operational constraints." },
          { heading: "Payload planning", body: "Payload planning should consider weight, volume, packaging, balance, and turnaround time." },
        ],
        faq: [{ question: "What matters most?", answer: "Payload, route, weather, compliance, and repeatable workflow." }],
        sourceUrls: ["https://example.in/source-1"],
      };
    },
  };

  const report = await runBlogPipeline({
    env: { EXA_MAX_QUERIES: "30", EXA_SOURCE_LIMIT: "8", BLOG_MIN_WORDS: "60", BLOG_MIN_SECTIONS: "2" },
    store: new MemoryBlogStore(),
    profile: {
      brandName: "BKT Tactical Solutions",
      market: "India",
      audience: ["logistics operators"],
      primaryOfferings: ["heavy payload UAV platforms"],
      contentGoals: ["grow organic traffic"],
      internalLinkTargets: ["/solutions/"],
      exclusions: [],
      tone: "specific",
      seoFocus: "India-specific rankable keywords",
      topicSeeding: ["drone logistics india"],
    },
    researchClient: exa,
    writerClient: groq,
    minScore: 30,
  });

  assert.equal(report.status, "published");
  assert.equal(searchCalls, 2);
  assert.equal(contentsCalls, 8);
});

test("pipeline caps topic discovery at configured Exa max queries", async () => {
  let searchCalls = 0;
  const exa = {
    async search() {
      searchCalls += 1;
      return { results: [] };
    },
  };
  const groq = {
    async generateJson() {
      return {};
    },
  };

  const report = await runBlogPipeline({
    env: { EXA_MAX_QUERIES: "30" },
    store: new MemoryBlogStore(),
    profile: {
      brandName: "BKT Tactical Solutions",
      market: "India",
      audience: ["drone-curious readers"],
      primaryOfferings: ["heavy payload UAV platforms"],
      contentGoals: ["grow organic traffic"],
      internalLinkTargets: ["/products/"],
      exclusions: [],
      tone: "specific",
      seoFocus: "India-specific rankable keywords",
      topicSeeding: Array.from({ length: 14 }, (_, index) => `drone topic ${index + 1} india`),
    },
    researchClient: exa,
    writerClient: groq,
    minScore: 99,
  });

  assert.equal(report.status, "skipped");
  assert.equal(searchCalls, 30);
});
