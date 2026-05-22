export const BLOG_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  REJECTED: "rejected",
};

export function createDefaultBlogPost(input) {
  const now = input.updatedAt ?? input.publishedAt ?? new Date().toISOString();
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    category: input.category,
    path: input.path ?? `/insights/${input.slug}/`,
    status: input.status ?? BLOG_STATUS.PUBLISHED,
    primaryKeyword: input.primaryKeyword,
    supportingKeywords: input.supportingKeywords ?? [],
    sourceUrls: input.sourceUrls ?? [],
    sections: input.sections ?? [],
    faq: input.faq ?? [],
    intro: input.intro ?? "",
    bodyMarkdown: input.bodyMarkdown ?? "",
    metaTitle: input.metaTitle ?? input.title,
    metaDescription: input.metaDescription ?? input.description,
    publishedAt: input.publishedAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}
