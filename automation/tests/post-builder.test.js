import test from "node:test";
import assert from "node:assert/strict";
import { buildDraftPrompt, buildWriterSystemPrompt, validateDraft } from "../src/post-builder.js";

test("writer prompt stays compact and humanized", () => {
  const prompt = buildDraftPrompt({
    profile: {
      brandName: "BKT Tactical Solutions",
      market: "India",
      audience: ["procurement teams"],
      primaryOfferings: ["heavy payload UAV platforms"],
      contentGoals: ["grow qualified organic traffic"],
      contentMix: [{ lane: "general_education", share: 70, seeds: ["drone rules india explained"] }],
      internalLinkTargets: ["/products/"],
      exclusions: ["unsupported compliance claims"],
      tone: "specific, practical",
      seoFocus: "rankable India-specific topics",
      topicSeeding: ["heavy payload drones india"],
    },
    opportunity: {
      query: "heavy payload drones india",
      intent: "informational",
      contentLane: "general_education",
      score: 86,
      reasons: ["Intent: informational"],
      sourceUrls: ["https://example.in/article"],
    },
    sourceBriefs: [
      {
        title: "Heavy payload drones India guide",
        url: "https://example.in/article",
        publishedDate: "2026-05-01T00:00:00Z",
        summary: "Practical source material for India-focused evaluation.",
      },
    ],
  });

  assert.match(prompt, /expert-readable/i);
  assert.match(prompt, /natural transitions/i);
  assert.match(prompt, /general education should teach first/i);
  assert.match(prompt, /70\/20\/10 strategy/i);
  assert.match(prompt, /Reference sources:/i);
  assert.match(prompt, /Heavy payload drones India guide/i);
  assert.match(prompt, /minimum 1,500 words/i);
  assert.match(prompt, /minimum 6 content sections/i);
});

test("writer system prompt emphasizes human readable SEO prose", () => {
  const prompt = buildWriterSystemPrompt();
  assert.match(prompt, /expert-readable/i);
  assert.match(prompt, /human, specific/i);
  assert.match(prompt, /natural transitions/i);
  assert.match(prompt, /without forcing a sales pitch/i);
  assert.match(prompt, /1,500 words/i);
});

test("draft validation rejects thin posts by default", () => {
  const result = validateDraft({
    slug: "thin-drone-post",
    title: "Thin Drone Post India",
    description: "A short post about drones in India.",
    category: "Drone Education",
    primaryKeyword: "drones india",
    sourceUrls: ["https://example.in/source"],
    sections: [
      { heading: "One", body: "Short India body." },
      { heading: "Two", body: "Short India body." },
    ],
    faq: [],
    bodyMarkdown: "# Thin Drone Post India\n\nShort body about drones in India.",
  });

  assert.equal(result.valid, false);
  assert(result.issues.some((issue) => /1500 words/.test(issue)));
  assert(result.issues.some((issue) => /6 content sections/.test(issue)));
  assert(result.issues.some((issue) => /FAQ/.test(issue)));
});
