#!/usr/bin/env node
/**
 * Optional smoke: GET gateway /health (REST). Set API_HEALTH_URL to override base.
 * Example: API_HEALTH_URL=http://127.0.0.1:8000 node scripts/health-smoke.mjs
 */
const base = (process.env.API_HEALTH_URL || "https://api.contact360.io").replace(
  /\/$/,
  "",
);
const url = `${base}/health`;

const res = await fetch(url, { method: "GET" });
if (!res.ok) {
  console.error(`[health-smoke] ${url} → ${res.status} ${res.statusText}`);
  process.exit(1);
}
console.log(`[health-smoke] OK ${url} → ${res.status}`);
