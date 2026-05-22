import { buildSearchQueries, scoreKeywordOpportunity } from "./keyword-ranker.js";
import { makeCacheKey, readCachedJSON, writeCachedJSON } from "./research-cache.js";

function truncate(value, maxLength = 280) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function dedupeByUrl(records) {
  const seen = new Set();
  const output = [];

  for (const record of records) {
    const url = String(record?.url ?? "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    output.push(record);
  }

  return output;
}

function pickRecords(payload) {
  return (
    payload?.results ??
    payload?.contents ??
    payload?.items ??
    payload?.data ??
    payload?.pages ??
    []
  );
}

function normalizeSearchRecord(record) {
  return {
    title: String(record?.title ?? "").trim(),
    url: String(record?.url ?? "").trim(),
    publishedDate: String(record?.publishedDate ?? record?.published_at ?? "").trim(),
    text: String(record?.text ?? record?.snippet ?? record?.summary ?? "").trim(),
  };
}

function normalizeContentBrief(record, fallbackUrl) {
  return {
    title: String(record?.title ?? record?.metadata?.title ?? "").trim(),
    url: String(record?.url ?? fallbackUrl ?? "").trim(),
    publishedDate: String(record?.publishedDate ?? record?.published_at ?? record?.metadata?.publishedDate ?? "").trim(),
    summary: truncate(
      [
        record?.text,
        record?.content,
        record?.summary,
        record?.snippet,
        record?.highlights?.[0],
      ]
        .flat()
        .filter(Boolean)
        .join(" "),
      420,
    ),
  };
}

export async function cachedSearch(exa, cache, profile, query, options = {}) {
  const cacheKey = makeCacheKey("exa-search", profile.market ?? "", query, JSON.stringify(options));
  const cached = await readCachedJSON(cache, cacheKey);
  if (cached) {
    return cached;
  }

  const response = await exa.search({
    query,
    userLocation: "IN",
    category: "news",
    numResults: 8,
    ...options,
  });

  const normalized = {
    query,
    results: dedupeByUrl(pickRecords(response).map(normalizeSearchRecord)),
  };

  await writeCachedJSON(cache, cacheKey, normalized, 6 * 60 * 60);
  return normalized;
}

export async function buildSourceBriefs({ exa, cache, opportunity, maxSources = 3 }) {
  const urls = dedupeByUrl(
    (opportunity?.results ?? [])
      .map((result) => ({ url: result.url, title: result.title, publishedDate: result.publishedDate, text: result.text }))
      .concat((opportunity?.sourceUrls ?? []).map((url) => ({ url }))),
  )
    .map((record) => record.url)
    .filter(Boolean)
    .slice(0, maxSources);

  const briefs = [];

  for (const url of urls) {
    const cacheKey = makeCacheKey("exa-contents", url);
    const cached = await readCachedJSON(cache, cacheKey);
    if (cached) {
      briefs.push(cached);
      continue;
    }

    let response;
    try {
      response = await exa.contents({
        urls: [url],
        text: true,
      });
    } catch {
      response = null;
    }

    const records = pickRecords(response);
    const firstRecord = records[0] ?? response ?? {};
    const brief = normalizeContentBrief(
      {
        ...firstRecord,
        url,
        title: firstRecord?.title ?? opportunity?.title ?? "",
        publishedDate: firstRecord?.publishedDate ?? firstRecord?.published_at ?? "",
        summary: firstRecord?.text ?? firstRecord?.content ?? firstRecord?.summary ?? firstRecord?.snippet ?? "",
      },
      url,
    );

    await writeCachedJSON(cache, cacheKey, brief, 24 * 60 * 60);
    briefs.push(brief);
  }

  return briefs;
}

export async function searchOpportunities({
  profile,
  exa,
  cache,
  minScore = 68,
  maxQueries = 6,
  stopScore = 82,
  shouldSkipOpportunity = null,
}) {
  const queries = [...new Set(buildSearchQueries(profile))].slice(0, maxQueries);
  const opportunities = [];
  let bestScore = 0;
  let rankableFreshCount = 0;

  for (const query of queries) {
    const result = await cachedSearch(exa, cache, profile, query);

    const scored = scoreKeywordOpportunity({
      query,
      results: result.results ?? [],
      profile,
    });
    const duplicateReason = shouldSkipOpportunity?.(scored) ?? null;
    if (duplicateReason) {
      scored.excluded = true;
      scored.exclusionReason = duplicateReason;
      scored.reasons = [...scored.reasons, `Excluded: ${duplicateReason}`];
    }
    opportunities.push(scored);

    if (duplicateReason) {
      continue;
    }

    bestScore = Math.max(bestScore, scored.score);
    if (scored.score >= minScore) {
      rankableFreshCount += 1;
    }

    if (scored.score >= stopScore || (rankableFreshCount >= 2 && bestScore >= minScore + 8)) {
      break;
    }
  }

  return opportunities;
}
