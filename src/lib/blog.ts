import { insights as fallbackInsights } from "./seo-data";

const DEFAULT_BLOG_API_URL = "https://bkt-blog-automation.nick900684.workers.dev";

export type BlogSection = {
  heading: string;
  body: string;
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  path: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  sourceUrls: string[];
  sections: BlogSection[];
  faq: BlogFaqItem[];
  intro: string;
  bodyMarkdown: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  status?: string;
};

type FallbackInsight = (typeof fallbackInsights)[number];

function getEnvValue(key: string) {
  const metaValue = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key];
  if (metaValue) return metaValue;
  if (typeof process !== "undefined") {
    return process.env[key];
  }
  return undefined;
}

function getBlogApiBaseUrl() {
  return getEnvValue("BLOG_API_URL") ?? DEFAULT_BLOG_API_URL;
}

function normalizePath(path: string, slug: string) {
  return path || `/insights/${slug}/`;
}

function fromFallbackInsight(insight: FallbackInsight): BlogPost {
  return {
    slug: insight.slug,
    title: insight.title,
    description: insight.description,
    category: insight.category,
    path: insight.path,
    primaryKeyword: insight.slug.replace(/-/g, " "),
    supportingKeywords: [],
    sourceUrls: [],
    sections: insight.sections,
    faq: [],
    intro: insight.intro,
    bodyMarkdown: [
      `# ${insight.title}`,
      "",
      insight.intro,
      ...insight.sections.flatMap((section) => [
        "",
        `## ${section.heading}`,
        "",
        section.body,
      ]),
    ].join("\n"),
    metaTitle: insight.title,
    metaDescription: insight.description,
    publishedAt: insight.publishedAt,
    updatedAt: insight.updatedAt,
    status: "published",
  };
}

function mapApiPost(post: Partial<BlogPost> & { slug: string; title: string; description: string; category: string }) {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    path: normalizePath(post.path ?? "", post.slug),
    primaryKeyword: post.primaryKeyword ?? post.slug.replace(/-/g, " "),
    supportingKeywords: post.supportingKeywords ?? [],
    sourceUrls: post.sourceUrls ?? [],
    sections: post.sections ?? [],
    faq: post.faq ?? [],
    intro: post.intro ?? "",
    bodyMarkdown: post.bodyMarkdown ?? "",
    metaTitle: post.metaTitle ?? post.title,
    metaDescription: post.metaDescription ?? post.description,
    publishedAt: post.publishedAt ?? new Date().toISOString(),
    updatedAt: post.updatedAt ?? new Date().toISOString(),
    status: post.status ?? "published",
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Blog API request failed (${response.status})`);
  }

  return response.json();
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const baseUrl = getBlogApiBaseUrl();
    const payload = await fetchJson(`${baseUrl.replace(/\/$/, "")}/api/blogs`);
    return Array.isArray(payload?.items) ? payload.items.map(mapApiPost) : fallbackInsights.map(fromFallbackInsight);
  } catch {
    return fallbackInsights.map(fromFallbackInsight);
  }
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = getBlogApiBaseUrl();
    const payload = await fetchJson(`${baseUrl.replace(/\/$/, "")}/api/blogs/${encodeURIComponent(slug)}`);
    if (!payload?.item) return null;
    return mapApiPost(payload.item);
  } catch {
    const fallback = fallbackInsights.find((item) => item.slug === slug);
    return fallback ? fromFallbackInsight(fallback) : null;
  }
}
