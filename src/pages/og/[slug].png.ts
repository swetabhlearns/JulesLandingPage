import type { APIRoute } from "astro";
import sharp from "sharp";
import { getPublishedBlogPosts } from "../../lib/blog";
import { renderOgSvg, staticOgEntries } from "../../lib/og";

export async function getStaticPaths() {
  const posts = await getPublishedBlogPosts();
  return [
    ...staticOgEntries.map((entry) => ({
      params: { slug: entry.slug },
      props: { entry },
    })),
    ...posts.map((post) => ({
      params: { slug: `blog-${post.slug}` },
      props: {
        entry: {
          eyebrow: post.category || "Blog",
          title: post.title,
          description: post.description,
        },
      },
    })),
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await sharp(Buffer.from(renderOgSvg(props.entry))).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
