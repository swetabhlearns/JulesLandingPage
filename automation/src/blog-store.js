import { BLOG_STATUS, createDefaultBlogPost } from "./types.js";

function json(value) {
  return JSON.stringify(value ?? []);
}

function parse(value, fallback = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export class MemoryBlogStore {
  constructor(initialPosts = []) {
    this.posts = initialPosts.map((post) => createDefaultBlogPost(post));
    this.runs = [];
  }

  async listPublished({ limit = 20 } = {}) {
    return this.posts
      .filter((post) => post.status === BLOG_STATUS.PUBLISHED)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  async latestPublished() {
    return (await this.listPublished({ limit: 1 }))[0] ?? null;
  }

  async findBySlug(slug) {
    return this.posts.find((post) => post.slug === slug) ?? null;
  }

  async slugExists(slug) {
    return this.posts.some((post) => post.slug === slug);
  }

  async upsertPublished(post) {
    const normalized = createDefaultBlogPost({
      ...post,
      status: BLOG_STATUS.PUBLISHED,
    });
    const index = this.posts.findIndex((item) => item.slug === normalized.slug);
    if (index >= 0) this.posts[index] = normalized;
    else this.posts.unshift(normalized);
    return normalized;
  }

  async saveRun(run) {
    this.runs.unshift({ ...run, createdAt: run.createdAt ?? new Date().toISOString() });
    return this.runs[0];
  }
}

export class D1BlogStore {
  constructor(database) {
    this.database = database;
  }

  async listPublished({ limit = 20 } = {}) {
    const result = await this.database
      .prepare(
        `SELECT * FROM blog_posts
         WHERE status = ?
         ORDER BY published_at DESC
         LIMIT ?`,
      )
      .bind(BLOG_STATUS.PUBLISHED, limit)
      .all();

    return (result.results ?? []).map(this.mapRow);
  }

  async latestPublished() {
    const post = await this.database
      .prepare(
        `SELECT * FROM blog_posts
         WHERE status = ?
         ORDER BY published_at DESC
         LIMIT 1`,
      )
      .bind(BLOG_STATUS.PUBLISHED)
      .first();
    return post ? this.mapRow(post) : null;
  }

  async findBySlug(slug) {
    const row = await this.database
      .prepare(`SELECT * FROM blog_posts WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    return row ? this.mapRow(row) : null;
  }

  async slugExists(slug) {
    const row = await this.database
      .prepare(`SELECT 1 AS found FROM blog_posts WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
    return Boolean(row);
  }

  async upsertPublished(post) {
    const normalized = createDefaultBlogPost({
      ...post,
      status: BLOG_STATUS.PUBLISHED,
    });
    await this.database
      .prepare(
        `INSERT INTO blog_posts (
          slug, title, description, category, path, status,
          primary_keyword, supporting_keywords, source_urls, sections, faq,
          intro, body_markdown, meta_title, meta_description, published_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          path = excluded.path,
          status = excluded.status,
          primary_keyword = excluded.primary_keyword,
          supporting_keywords = excluded.supporting_keywords,
          source_urls = excluded.source_urls,
          sections = excluded.sections,
          faq = excluded.faq,
          intro = excluded.intro,
          body_markdown = excluded.body_markdown,
          meta_title = excluded.meta_title,
          meta_description = excluded.meta_description,
          published_at = excluded.published_at,
          updated_at = excluded.updated_at`,
      )
      .bind(
        normalized.slug,
        normalized.title,
        normalized.description,
        normalized.category,
        normalized.path,
        normalized.status,
        normalized.primaryKeyword,
        json(normalized.supportingKeywords),
        json(normalized.sourceUrls),
        json(normalized.sections),
        json(normalized.faq),
        normalized.intro,
        normalized.bodyMarkdown,
        normalized.metaTitle,
        normalized.metaDescription,
        normalized.publishedAt,
        normalized.updatedAt,
      )
      .run();
    return normalized;
  }

  async saveRun(run) {
    const createdAt = run.createdAt ?? new Date().toISOString();
    await this.database
      .prepare(
        `INSERT INTO blog_runs (
          run_type, status, selected_keyword, rankability_score, summary, payload_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        run.runType,
        run.status,
        run.selectedKeyword ?? null,
        run.rankabilityScore ?? null,
        run.summary ?? "",
        JSON.stringify(run.payload ?? {}),
        createdAt,
      )
      .run();
    return { ...run, createdAt };
  }

  mapRow(row) {
    return createDefaultBlogPost({
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      path: row.path,
      status: row.status,
      primaryKeyword: row.primary_keyword,
      supportingKeywords: parse(row.supporting_keywords),
      sourceUrls: parse(row.source_urls),
      sections: parse(row.sections),
      faq: parse(row.faq),
      intro: row.intro,
      bodyMarkdown: row.body_markdown,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    });
  }
}
