const HIGH_AUTHORITY_DOMAINS = new Set([
  "gov.in",
  "india.gov.in",
  "gov",
  "edu",
  "wikipedia.org",
  "youtube.com",
  "linkedin.com",
  "forbes.com",
  "britannica.com",
  "amazon.in",
  "flipkart.com",
]);

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function includesAny(text, values) {
  const normalized = normalize(text);
  return values.some((value) => normalized.includes(normalize(value)));
}

function flattenLaneSeeds(profile) {
  return Array.isArray(profile?.contentMix)
    ? profile.contentMix.flatMap((lane) => lane.seeds ?? [])
    : [];
}

function findContentLane(query, profile) {
  const q = normalize(query);
  const lanes = Array.isArray(profile?.contentMix) ? profile.contentMix : [];
  return lanes.find((lane) => (lane.seeds ?? []).some((seed) => q.includes(normalize(seed)))) ?? null;
}

function estimateIntent(query) {
  const q = normalize(query);
  if (/(what|why|how|guide|overview|explained|basics|rules|license|safety|trends|market|best practices|checklist)/.test(q)) {
    return "informational";
  }
  if (/(price|pricing|cost|vendor|provider|platform|solution|service)/.test(q)) {
    return "commercial";
  }
  return "mixed";
}

function scoreCompetition(results) {
  if (!results.length) {
    return 18;
  }

  let penalty = 0;
  let freshnessBonus = 0;
  const domains = new Set();

  for (const result of results) {
    const domain = domainFromUrl(result.url ?? "");
    if (domain) {
      domains.add(domain);
      if ([...HIGH_AUTHORITY_DOMAINS].some((needle) => domain.includes(needle))) {
        penalty += 8;
      }
      if (domain.endsWith(".gov.in") || domain.endsWith(".gov")) {
        penalty += 10;
      }
    }

    if (result.publishedDate) {
      const ageDays = Math.max(0, (Date.now() - new Date(result.publishedDate).getTime()) / 86400000);
      if (ageDays <= 90) freshnessBonus += 2;
      else if (ageDays <= 365) freshnessBonus += 1;
    }
  }

  if (domains.size <= 3) {
    penalty += 4;
  } else if (domains.size >= 6) {
    freshnessBonus += 4;
  }

  const resultCountScore = Math.max(0, 18 - Math.min(results.length, 10));
  const raw = 30 + resultCountScore + freshnessBonus - penalty;
  return Math.max(0, Math.min(40, raw));
}

function scoreBusinessFit(query, profile) {
  const seedTerms = [
    profile.brandName,
    profile.market,
    ...profile.primaryOfferings,
    ...profile.topicSeeding,
    ...flattenLaneSeeds(profile),
  ];
  const generalDroneTerms = [
    "drone",
    "drones",
    "uav",
    "drone rules",
    "drone pilot",
    "drone license",
    "drone battery",
    "drone mapping",
    "agriculture drones",
  ];
  const trendTerms = ["trend", "trends", "market", "industry", "ecosystem", "dgca", "delivery"];
  const commercialTerms = ["payload", "logistics", "emergency", "tactical", "rtk", "manufacturing", "solution"];
  let score = 0;

  if (includesAny(query, [profile.market])) score += 8;
  if (includesAny(query, ["india"])) score += 8;
  if (includesAny(query, generalDroneTerms)) score += 8;
  if (includesAny(query, trendTerms)) score += 4;
  if (includesAny(query, commercialTerms)) score += 4;
  if (includesAny(query, seedTerms)) score += 8;

  return Math.min(32, score);
}

function scoreIntent(query, results) {
  const intent = estimateIntent(query);
  const leadTitles = results.slice(0, 5).map((result) => `${result.title ?? ""} ${result.text ?? result.snippet ?? ""}`.trim());
  const hasHowToGap = leadTitles.some((text) => /how to|guide|checklist|step by step|explained|basics|for india/i.test(text));
  const hasCommercialGap = leadTitles.some((text) => /pricing|vendor|solution|platform|provider/i.test(text));
  const hasFreshnessSignal = leadTitles.some((text) => /202[5-9]|latest|new|update|trend|market|policy|rules/i.test(text));

  let score = 8;
  if (intent === "informational" && hasHowToGap) score += 8;
  if (intent === "commercial" && hasCommercialGap) score += 8;
  if (intent === "informational" && hasFreshnessSignal) score += 4;
  if (leadTitles.some((text) => /compare|versus|vs\./i.test(text))) score += 4;

  return Math.min(20, score);
}

export function buildSearchQueries(profile) {
  const laneSeeds = flattenLaneSeeds(profile);
  const seeds = laneSeeds.length ? laneSeeds : (profile.topicSeeding ?? []);
  const market = profile.market ?? "India";
  return seeds.flatMap((seed) => {
    const seedWithMarket = includesAny(seed, [market]) ? seed : `${seed} ${market}`;
    const lane = findContentLane(seed, profile);

    if (lane?.lane === "product_solution") {
      return [
        seedWithMarket,
        `${seed} guide ${market}`,
        `${seed} cost ${market}`,
      ];
    }

    if (lane?.lane === "trend_industry") {
      return [
        seedWithMarket,
        `${seed} trends ${market}`,
        `${seed} explained ${market}`,
      ];
    }

    return [
      seedWithMarket,
      `${seed} guide ${market}`,
      `${seed} explained ${market}`,
    ];
  });
}

export function scoreKeywordOpportunity({ query, results = [], profile }) {
  if (!results.length) {
    return {
      query,
      intent: estimateIntent(query),
      score: 0,
      sourceUrls: [],
      competitionScore: 0,
      businessFitScore: 0,
      intentScore: 0,
      reasons: ["No live search results were available"],
      results,
    };
  }

  const competitionScore = scoreCompetition(results);
  const intentScore = scoreIntent(query, results);
  const businessFitScore = scoreBusinessFit(query, profile);
  const contentLane = findContentLane(query, profile);
  const laneScore = contentLane ? Math.min(8, Math.max(0, Number(contentLane.share ?? 0) / 10)) : 0;
  const qualityScore = competitionScore;
  const score = Math.max(0, Math.min(100, qualityScore + intentScore + businessFitScore + laneScore));
  const intent = estimateIntent(query);
  const sourceUrls = results.map((result) => result.url).filter(Boolean);

  return {
    query,
    intent,
    contentLane: contentLane?.lane ?? "unclassified",
    score,
    sourceUrls,
    competitionScore,
    businessFitScore,
    intentScore,
    laneScore,
    reasons: [
      `Intent: ${intent}`,
      `Content lane: ${contentLane?.lane ?? "unclassified"}`,
      `Competition score: ${competitionScore}`,
      `Business fit score: ${businessFitScore}`,
      `Intent alignment score: ${intentScore}`,
      `Lane priority score: ${laneScore}`,
    ],
    results,
  };
}

export function selectBestOpportunity(opportunities, threshold = 68) {
  const ranked = [...opportunities].sort((a, b) => b.score - a.score);
  const best = ranked[0] ?? null;
  if (!best || best.score < threshold) {
    return null;
  }
  return best;
}
