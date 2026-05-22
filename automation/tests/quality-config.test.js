import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("worker publishing cadence is twice weekly and monitor remains daily", () => {
  const wrangler = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

  assert.match(wrangler, /crons = \["0 4 \* \* 1,4", "0 3 \* \* \*"\]/);
  assert.match(worker, /cron === "0 4 \* \* 1,4"/);
  assert.match(worker, /cron === "0 3 \* \* \*"/);
});

test("default production research and quality budgets are configured", () => {
  const wrangler = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wrangler, /EXA_MAX_QUERIES = "30"/);
  assert.match(wrangler, /EXA_SOURCE_LIMIT = "8"/);
  assert.match(wrangler, /BLOG_MIN_WORDS = "1500"/);
  assert.match(wrangler, /BLOG_MIN_SECTIONS = "6"/);
  assert.match(wrangler, /BLOG_REQUIRE_FAQ = "true"/);
});
