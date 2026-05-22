import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MemoryBlogStore } from "./blog-store.js";
import { runBlogPipeline } from "./pipeline.js";
import { buildSearchQueries, scoreKeywordOpportunity } from "./keyword-ranker.js";
import { businessProfile } from "./business-profile.js";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(currentDir, "..");

function loadEnv() {
  return {
    EXA_API_KEY: process.env.EXA_API_KEY,
    EXA_BASE_URL: process.env.EXA_BASE_URL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_BASE_URL: process.env.GROQ_BASE_URL,
    GROQ_MODEL: process.env.GROQ_MODEL,
    INTERNAL_RUN_TOKEN: process.env.INTERNAL_RUN_TOKEN,
  };
}

async function runDiscovery() {
  const store = new MemoryBlogStore();
  const queries = buildSearchQueries(businessProfile);

  const opportunities = queries.map((query) =>
    scoreKeywordOpportunity({
      query,
      results: [],
      profile: businessProfile,
    }),
  );

  await store.saveRun({
    runType: "manual",
    status: "skipped",
    summary: "Discovery dry run",
    payload: { queries, opportunities },
  });

  console.log(JSON.stringify({ queries, opportunities }, null, 2));
}

async function runPipeline() {
  const env = loadEnv();
  const report = await runBlogPipeline({
    env,
    store: new MemoryBlogStore(),
  });
  console.log(JSON.stringify(report, null, 2));
}

const command = process.argv[2] ?? "run";
if (command === "discover") {
  await runDiscovery();
} else if (command === "run") {
  await runPipeline();
} else if (command === "profile") {
  const profilePath = resolve(rootDir, "prompts/business-profile.md");
  console.log(readFileSync(profilePath, "utf8"));
} else {
  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}
