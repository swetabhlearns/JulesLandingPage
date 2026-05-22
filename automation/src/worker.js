import { runBlogPipeline } from "./pipeline.js";
import { D1BlogStore } from "./blog-store.js";
import { BLOG_STATUS } from "./types.js";
import { runIndexingMonitor } from "./index-monitor.js";

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function notFound(message = "Not found") {
  return json({ error: message }, { status: 404 });
}

function requireInternalToken(request, env) {
  const expected = env?.INTERNAL_RUN_TOKEN;
  if (!expected) return true;
  const provided = request.headers.get("x-internal-run-token");
  return provided === expected;
}

async function handleList(request, env) {
  const store = new D1BlogStore(env.BLOG_DB);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const posts = await store.listPublished({ limit: Number.isFinite(limit) ? limit : 20 });
  return json({ items: posts });
}

async function handleLatest(env) {
  const store = new D1BlogStore(env.BLOG_DB);
  const post = await store.latestPublished();
  if (!post) return notFound("No published posts yet");
  return json({ item: post });
}

async function handleSlug(slug, env) {
  const store = new D1BlogStore(env.BLOG_DB);
  const post = await store.findBySlug(slug);
  if (!post || post.status !== BLOG_STATUS.PUBLISHED) {
    return notFound("Post not found");
  }
  return json({ item: post });
}

async function handleIndexMonitor(request, env) {
  if (!requireInternalToken(request, env)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = new D1BlogStore(env.BLOG_DB);
  const report = await runIndexingMonitor({
    env,
    store,
  });
  return json(report);
}

async function runScheduledIndexMonitor(env) {
  const store = new D1BlogStore(env.BLOG_DB);
  const report = await runIndexingMonitor({
    env,
    store,
  });
  await store.saveRun({
    runType: "index-monitor",
    status: report.status,
    summary: report.reason ?? `Index monitor completed with status ${report.status}`,
    payload: report,
  });
  return report;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/api/blogs") {
      return handleList(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/blogs/latest") {
      return handleLatest(env);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/blogs/")) {
      const slug = decodeURIComponent(url.pathname.replace("/api/blogs/", ""));
      return handleSlug(slug, env);
    }

    if (request.method === "POST" && url.pathname === "/internal/run") {
      if (!requireInternalToken(request, env)) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }
      const report = await runBlogPipeline({ env });
      return json(report);
    }

    if (request.method === "POST" && url.pathname === "/internal/index-monitor") {
      return handleIndexMonitor(request, env);
    }

    return notFound();
  },

  async scheduled(event, env, ctx) {
    const cron = String(event?.cron ?? "");
    const jobs = [];

    if (cron === "0 4 * * 1,4") {
      jobs.push(
        runBlogPipeline({ env }).catch((error) => {
          console.error("Scheduled blog pipeline failed:", error);
        }),
      );
    }

    if (cron === "0 3 * * *") {
      jobs.push(
        runScheduledIndexMonitor(env).catch((error) => {
          console.error("Scheduled index monitor failed:", error);
        }),
      );
    }

    if (!jobs.length) {
      jobs.push(
        runBlogPipeline({ env }).catch((error) => {
          console.error("Scheduled blog pipeline failed:", error);
        }),
      );
    }

    for (const job of jobs) {
      ctx.waitUntil(job);
    }
  },
};
