import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchQueries, scoreKeywordOpportunity, selectBestOpportunity } from "../src/keyword-ranker.js";
import { businessProfile } from "../src/business-profile.js";

const profile = {
  brandName: "BKT Tactical Solutions",
  market: "India",
  primaryOfferings: ["heavy payload UAV platforms", "drone logistics workflows"],
  topicSeeding: ["heavy payload drones india"],
};

test("scores India-focused UAV queries higher than generic ones", () => {
  const focused = scoreKeywordOpportunity({
    query: "heavy payload drones india",
    results: [
      {
        title: "Heavy Payload Drones India Guide",
        url: "https://example.in/guide",
        publishedDate: "2026-05-01T00:00:00Z",
        text: "A practical guide for India",
      },
    ],
    profile,
  });

  const generic = scoreKeywordOpportunity({
    query: "drones",
    results: [
      {
        title: "Drones",
        url: "https://wikipedia.org/wiki/Drone",
        publishedDate: "2020-01-01T00:00:00Z",
        text: "Generic page",
      },
    ],
    profile,
  });

  assert.ok(focused.score > generic.score);
});

test("selectBestOpportunity returns null below threshold", () => {
  const best = selectBestOpportunity([{ score: 50 }, { score: 62 }], 68);
  assert.equal(best, null);
});

test("query generation prioritizes mixed-stream education before product topics", () => {
  const queries = buildSearchQueries(businessProfile);

  assert.ok(queries.some((query) => /how drones work india/i.test(query)));
  assert.ok(queries.some((query) => /drone industry trends india/i.test(query)));
  assert.ok(queries.some((query) => /heavy payload drones india/i.test(query)));
  assert.ok(
    queries.findIndex((query) => /how drones work india/i.test(query)) <
      queries.findIndex((query) => /heavy payload drones india/i.test(query)),
  );
});

test("scores public-interest India drone topics as rankable informational opportunities", () => {
  const publicInterest = scoreKeywordOpportunity({
    query: "drone rules india explained",
    results: [
      {
        title: "Drone rules in India explained for 2026",
        url: "https://example.in/drone-rules",
        publishedDate: "2026-05-01T00:00:00Z",
        text: "A practical guide to DGCA drone rules and safe operation in India.",
      },
      {
        title: "Drone policy update India",
        url: "https://news.example.in/drone-policy",
        publishedDate: "2026-04-15T00:00:00Z",
        text: "Latest policy context for drone users.",
      },
    ],
    profile: businessProfile,
  });

  assert.equal(publicInterest.intent, "informational");
  assert.equal(publicInterest.contentLane, "general_education");
  assert.ok(publicInterest.score >= 68);
});
