import { createDefaultBlogPost } from "./types.js";
import { injectInternalLinks } from "./internal-linking.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

export function buildDraftPrompt({ profile, opportunity, sourceBriefs = [] }) {
  const compactProfile =
    typeof profile === "string"
      ? profile
      : JSON.stringify(
          {
            brandName: profile.brandName,
            market: profile.market,
            audience: profile.audience,
            primaryOfferings: profile.primaryOfferings,
            contentGoals: profile.contentGoals,
            contentMix: profile.contentMix,
            internalLinkTargets: profile.internalLinkTargets,
            exclusions: profile.exclusions,
            tone: profile.tone,
            seoFocus: profile.seoFocus,
            topicSeeding: profile.topicSeeding,
          },
          null,
          2,
        );

  return `${compactProfile}

Selected topic:
${JSON.stringify(
  {
    query: opportunity.query,
    intent: opportunity.intent,
    contentLane: opportunity.contentLane,
    score: opportunity.score,
    reasons: opportunity.reasons,
    sourceUrls: opportunity.sourceUrls,
  },
  null,
  2,
)}

Create one SEO blog post for BKT Tactical Solutions.

Writing style:
- aim for expert-readable prose
- sound like a knowledgeable operator, not a template
- use natural transitions and concrete verbs
- avoid generic marketing openings and filler phrases
- keep the language human, specific, and India-relevant
- do not force keywords into every sentence
- follow the selected content lane: general education should teach first, trend explainers should connect current signals to Indian context, and product/solution posts may use a measured conversion angle
- write a deep, genuinely useful guide rather than a short overview
- target at least 1,500 words when fully rendered
- include at least 6 substantial sections
- include concrete comparisons, India-specific operating context, practical examples, risks, and reader takeaways
- include FAQ items that answer real follow-up questions

Reference sources:
${JSON.stringify(
  sourceBriefs.map((source) => ({
    title: source.title,
    url: source.url,
    publishedDate: source.publishedDate,
    summary: source.summary,
  })),
  null,
  2,
)}

Return JSON only with this shape:
{
  "title": "string",
  "slug": "string",
  "description": "string",
  "category": "string",
  "primaryKeyword": "string",
  "supportingKeywords": ["string"],
  "metaTitle": "string",
  "metaDescription": "string",
  "intro": "string",
  "sections": [{"heading": "string", "body": "string"}],
  "faq": [{"question": "string", "answer": "string"}],
  "sourceUrls": ["string"]
}

Rules:
- India-focused
- no images
- no unsupported compliance claims
- specific, rankable, and useful
- minimum 1,500 words
- minimum 6 content sections
- include FAQ entries unless the topic truly makes FAQ inappropriate
- use technical depth, examples, and practical decision support instead of filler
- preserve the 70/20/10 strategy: most posts should be general education, some should explain trends, and only occasional posts should be product or solution-led
- if the selected lane is general_education or trend_industry, do not force a sales angle; internal links should feel contextual
- include practical H2/H3-style section headings
- do not add HTML links; the system will inject contextual internal links after generation
`;
}

export function buildWriterSystemPrompt() {
  return [
    "You write SEO blog posts as structured JSON only.",
    "Write like a knowledgeable operator: human, specific, expert-readable, and India-focused.",
    "Create deep, useful guides with at least 1,500 words when rendered.",
    "Use at least 6 substantial sections plus FAQ entries when useful.",
    "Include technical comparisons, India-specific operating context, practical examples, risks, and reader takeaways.",
    "Use natural transitions, stronger verbs, and concrete operational detail.",
    "Avoid generic marketing intros, filler, repetition, and template-like prose.",
    "For general education and trend topics, teach the reader without forcing a sales pitch.",
    "Keep the article grounded in the provided source briefs and topic constraints.",
  ].join(" ");
}

export function parseJsonDraft(text) {
  const cleaned = String(text).trim();
  const fenced = cleaned.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? cleaned;
  return JSON.parse(candidate);
}

export function markdownFromDraft(draft) {
  const parts = [
    `# ${draft.title}`,
    "",
    draft.intro ?? "",
  ].filter(Boolean);

  for (const section of draft.sections ?? []) {
    parts.push("", `## ${section.heading}`, "", section.body ?? "");
  }

  if (Array.isArray(draft.faq) && draft.faq.length) {
    parts.push("", "## FAQ");
    for (const item of draft.faq) {
      parts.push("", `### ${item.question}`, "", item.answer ?? "");
    }
  }

  return parts.join("\n").trim() + "\n";
}

function wordCount(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function normalizeDraft(draft, opportunity, profile, now = new Date().toISOString()) {
  const title = String(draft.title ?? "").trim();
  const slug = slugify(draft.slug ?? title);
  const description = String(draft.description ?? "").trim();
  const category = String(draft.category ?? opportunity.intent ?? "Insights").trim();
  const primaryKeyword = String(draft.primaryKeyword ?? opportunity.query).trim();
  const supportingKeywords = dedupe(Array.isArray(draft.supportingKeywords) ? draft.supportingKeywords.map(String) : []);
  const sourceUrls = dedupe(Array.isArray(draft.sourceUrls) ? draft.sourceUrls.map(String) : opportunity.sourceUrls);
  const linkedContent = injectInternalLinks(
    {
      intro: String(draft.intro ?? "").trim(),
      sections: Array.isArray(draft.sections)
        ? draft.sections
            .map((section) => ({
              heading: String(section.heading ?? "").trim(),
              body: String(section.body ?? "").trim(),
            }))
            .filter((section) => section.heading && section.body)
        : [],
      faq: Array.isArray(draft.faq)
        ? draft.faq
            .map((item) => ({
              question: String(item.question ?? "").trim(),
              answer: String(item.answer ?? "").trim(),
            }))
            .filter((item) => item.question && item.answer)
        : [],
    },
    profile,
    opportunity,
  );
  const intro = linkedContent.intro;
  const sections = linkedContent.sections;
  const faq = linkedContent.faq;
  const bodyMarkdown = markdownFromDraft({ title, intro, sections, faq });

  return createDefaultBlogPost({
    slug,
    title,
    description,
    category,
    primaryKeyword,
    supportingKeywords,
    sourceUrls,
    intro,
    sections,
    faq,
    bodyMarkdown,
    metaTitle: String(draft.metaTitle ?? title).trim(),
    metaDescription: String(draft.metaDescription ?? description).trim(),
    publishedAt: now,
    updatedAt: now,
  });
}

export function validateDraft(
  post,
  {
    existingSlugs = new Set(),
    requiredInternalLinks = [],
    minWords = 1500,
    minSections = 6,
    requireFaq = true,
  } = {},
) {
  const issues = [];
  const requiredLinkPaths = requiredInternalLinks
    .map((link) => (typeof link === "string" ? link : link?.path))
    .filter(Boolean);

  if (!post.slug) issues.push("Missing slug");
  if (!post.title) issues.push("Missing title");
  if (!post.description) issues.push("Missing description");
  if (!post.primaryKeyword) issues.push("Missing primary keyword");
  if (!Array.isArray(post.sections) || post.sections.length < minSections) {
    issues.push(`Need at least ${minSections} content sections`);
  }
  if (requireFaq && (!Array.isArray(post.faq) || post.faq.length < 1)) {
    issues.push("Need FAQ entries");
  }
  if (wordCount(post.bodyMarkdown) < minWords) {
    issues.push(`Post body is too short; need at least ${minWords} words`);
  }
  if (existingSlugs.has(post.slug)) issues.push("Slug already exists");
  if (!post.sourceUrls.length) issues.push("Missing source URLs");
  if (requiredLinkPaths.length) {
    const hasRequiredLink = requiredLinkPaths.some((path) => post.bodyMarkdown.includes(`href="${path}"`));
    if (!hasRequiredLink) issues.push("Missing required internal link");
  }
  if (!/india/i.test(`${post.title} ${post.description} ${post.bodyMarkdown}`)) {
    issues.push("Missing India-specific framing");
  }

  const forbidden = ["certified by dgca", "approved by dgca", "guaranteed ranking", "100% rank"];
  for (const phrase of forbidden) {
    if (post.bodyMarkdown.toLowerCase().includes(phrase)) {
      issues.push(`Contains forbidden phrase: ${phrase}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
