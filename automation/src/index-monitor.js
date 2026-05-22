function getSiteUrl(env, fallback = "https://bkttactical.com") {
  return env?.SITE_URL ?? fallback;
}

function getMinAgeHours(env, fallback = 24) {
  const value = Number(env?.INDEX_MONITOR_MIN_AGE_HOURS ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getSearchConsoleSiteUrl(env, siteUrl) {
  return env?.SEARCH_CONSOLE_SITE_URL ?? `sc-domain:${new URL(siteUrl).hostname}`;
}

function normalizeUrl(siteUrl, path) {
  return new URL(path, siteUrl).href;
}

function parseSitemapEntries(xml) {
  const entries = [];
  const urlPattern = /<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<\/url>/gs;
  let match;
  while ((match = urlPattern.exec(xml))) {
    entries.push({
      loc: match[1].trim(),
      lastmod: match[2].trim(),
    });
  }
  return entries;
}

async function fetchText(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${text}`);
  }
  return text;
}

async function inspectInSearchConsole({ fetchImpl, accessToken, siteUrl, inspectionUrl }) {
  if (!accessToken) {
    return { status: "skipped", reason: "SEARCH_CONSOLE_ACCESS_TOKEN is not configured" };
  }

  try {
    const response = await fetchImpl("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        status: "error",
        error: `Search Console inspection failed (${response.status}): ${text}`,
      };
    }

    const raw = text ? JSON.parse(text) : {};
    const indexStatusResult = raw?.inspectionResult?.indexStatusResult ?? raw?.indexStatusResult ?? null;
    return {
      status: "ok",
      verdict: indexStatusResult?.verdict ?? null,
      indexingState: indexStatusResult?.indexingState ?? null,
      coverageState: indexStatusResult?.coverageState ?? null,
      raw,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runIndexingMonitor({
  env,
  store,
  fetchImpl = fetch,
  now = new Date(),
  logger = console,
} = {}) {
  const siteUrl = getSiteUrl(env);
  const minAgeHours = getMinAgeHours(env);
  const searchConsoleSiteUrl = getSearchConsoleSiteUrl(env, siteUrl);
  const accessToken = env?.SEARCH_CONSOLE_ACCESS_TOKEN ?? "";
  const cutoff = now.getTime() - minAgeHours * 60 * 60 * 1000;
  const posts = await store.listPublished({ limit: 1000 });
  const candidates = posts.filter((post) => new Date(post.publishedAt).getTime() <= cutoff);

  if (!candidates.length) {
    return {
      status: "idle",
      reason: `No published posts older than ${minAgeHours}h to monitor`,
      checked: 0,
      alerts: [],
      results: [],
    };
  }

  let sitemapXml;
  try {
    sitemapXml = await fetchText(fetchImpl, normalizeUrl(siteUrl, "/sitemap.xml"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.warn?.("Index monitor could not fetch sitemap:", message);
    return {
      status: "error",
      reason: message,
      checked: candidates.length,
      alerts: candidates.map((post) => ({
        slug: post.slug,
        url: normalizeUrl(siteUrl, post.path ?? `/insights/${post.slug}/`),
        issue: "Sitemap unavailable",
      })),
      results: [],
    };
  }

  const sitemapEntries = parseSitemapEntries(sitemapXml);
  const sitemapIndex = new Map(sitemapEntries.map((entry) => [entry.loc, entry]));
  const results = [];

  for (const post of candidates) {
    const url = normalizeUrl(siteUrl, post.path ?? `/insights/${post.slug}/`);
    const sitemapEntry = sitemapIndex.get(url) ?? null;
    const searchConsole = await inspectInSearchConsole({
      fetchImpl,
      accessToken,
      siteUrl: searchConsoleSiteUrl,
      inspectionUrl: url,
    });

    results.push({
      slug: post.slug,
      url,
      publishedAt: post.publishedAt,
      inSitemap: Boolean(sitemapEntry),
      sitemapLastmod: sitemapEntry?.lastmod ?? null,
      searchConsole,
    });
  }

  const alerts = results
    .filter((result) => !result.inSitemap || (result.searchConsole.status === "ok" && result.searchConsole.indexingState === "NOT_INDEXED"))
    .map((result) => ({
      slug: result.slug,
      url: result.url,
      issue: !result.inSitemap ? "Missing from sitemap" : "Reported as not indexed by Search Console",
    }));

  return {
    status: alerts.length ? "attention" : "ok",
    checked: candidates.length,
    alerts,
    results,
  };
}
