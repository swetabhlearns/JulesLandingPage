import { businessProfile } from "./business-profile.js";
import { createExaClient } from "./exa-client.js";
import { createGroqClient } from "./groq-client.js";
import { selectBestOpportunity } from "./keyword-ranker.js";
import { buildDraftPrompt, buildWriterSystemPrompt, normalizeDraft, validateDraft } from "./post-builder.js";
import { selectInternalLinks } from "./internal-linking.js";
import { D1BlogStore } from "./blog-store.js";
import { runIndexingMonitor } from "./index-monitor.js";
import { buildSourceBriefs, searchOpportunities as searchOpportunitiesWithCache } from "./research-brief.js";
import { BLOG_STATUS } from "./types.js";

function createLogger(env) {
  return env?.LOGGER ?? console;
}

function buildSectionsFromDraft(draft) {
  return Array.isArray(draft.sections) ? draft.sections : [];
}

function normalizeTopic(value) {
  const words = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const deduped = words.filter((word, index) => word !== words[index - 1]);
  return deduped.join(" ");
}

function isSameTopic(left, right) {
  const a = normalizeTopic(left);
  const b = normalizeTopic(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function createPublishedTopicMatcher(posts) {
  const publishedTopics = posts.flatMap((post) => [
    post.slug,
    post.title,
    post.primaryKeyword,
    ...(post.supportingKeywords ?? []),
  ]);

  return function duplicateReason(opportunity) {
    const candidateTopics = [
      opportunity?.query,
      opportunity?.primaryKeyword,
      opportunity?.title,
    ];

    for (const candidate of candidateTopics) {
      const matched = publishedTopics.find((topic) => isSameTopic(candidate, topic));
      if (matched) {
        return `Already covered by published topic: ${matched}`;
      }
    }

    return null;
  };
}

export async function runBlogPipeline({
  env,
  store,
  profile = businessProfile,
  minScore = 68,
  logger = createLogger(env),
  researchClient = null,
  writerClient = null,
} = {}) {
  const exa = researchClient ?? createExaClient(env);
  const groq = writerClient ?? createGroqClient(env);
  const blogStore = store ?? new D1BlogStore(env.BLOG_DB);
  const researchCache = env?.BLOG_CACHE ?? null;
  const publishedPosts = await blogStore.listPublished({
    limit: Number(env?.PUBLISHED_TOPIC_LOOKBACK ?? 100),
  });
  const duplicateReasonFor = createPublishedTopicMatcher(publishedPosts);

  const opportunities = await searchOpportunitiesWithCache({
    profile,
    exa,
    cache: researchCache,
    minScore,
    maxQueries: Number(env?.EXA_MAX_QUERIES ?? 6),
    stopScore: Number(env?.EXA_STOP_SCORE ?? 82),
    shouldSkipOpportunity: duplicateReasonFor,
  });
  const freshOpportunities = opportunities.filter((opportunity) => !opportunity.excluded);
  const best = selectBestOpportunity(freshOpportunities, minScore);

  if (!best) {
    const report = {
      status: "skipped",
      reason: freshOpportunities.length ? "No rankable fresh topic found" : "No non-duplicate topic found",
      opportunities,
    };
    await blogStore.saveRun({
      runType: "scheduled",
      status: "skipped",
      summary: report.reason,
      payload: report,
    });
    logger?.info?.("Blog pipeline skipped: no rankable topic found");
    return report;
  }

  const sourceBriefs = await buildSourceBriefs({
    exa,
    cache: researchCache,
    opportunity: best,
    maxSources: Number(env?.EXA_SOURCE_LIMIT ?? 3),
  });

  const prompt = buildDraftPrompt({
    profile,
    opportunity: best,
    sourceBriefs,
  });

  const rawDraft = await groq.generateJson({
    system: buildWriterSystemPrompt(),
    user: prompt,
  });

  const normalized = normalizeDraft(
    {
      ...rawDraft,
      sections: buildSectionsFromDraft(rawDraft),
      faq: Array.isArray(rawDraft.faq) ? rawDraft.faq : [],
      sourceUrls: Array.isArray(rawDraft.sourceUrls) ? rawDraft.sourceUrls : best.sourceUrls,
    },
    best,
    profile,
  );

  const requiredInternalLinks = selectInternalLinks(profile, best).map((link) => link.path);

  const existingSlug = await blogStore.slugExists(normalized.slug);
  const validation = validateDraft(normalized, {
    existingSlugs: new Set(existingSlug ? [normalized.slug] : []),
    requiredInternalLinks,
    minWords: Number(env?.BLOG_MIN_WORDS ?? 1500),
    minSections: Number(env?.BLOG_MIN_SECTIONS ?? 6),
    requireFaq: String(env?.BLOG_REQUIRE_FAQ ?? "true") !== "false",
  });

  if (!validation.valid) {
    const report = {
      status: "rejected",
      reason: "Generated draft failed validation",
      issues: validation.issues,
      opportunity: best,
      draft: normalized,
    };
    await blogStore.saveRun({
      runType: "scheduled",
      status: BLOG_STATUS.REJECTED,
      selectedKeyword: best.query,
      rankabilityScore: best.score,
      summary: report.reason,
      payload: report,
    });
    return report;
  }

  const published = await blogStore.upsertPublished(normalized);
  const indexingMonitor = await runIndexingMonitor({
    env,
    store: blogStore,
    logger,
  });
  await blogStore.saveRun({
    runType: "scheduled",
    status: BLOG_STATUS.PUBLISHED,
    selectedKeyword: best.query,
    rankabilityScore: best.score,
    summary: `Published ${published.slug}`,
    payload: {
      opportunity: best,
      post: published,
      profile: profile.brandName,
      sourceBriefs,
      indexingMonitor,
    },
  });

  return {
    status: "published",
    opportunity: best,
    post: published,
    opportunities,
    sourceBriefs,
    indexingMonitor,
  };
}
