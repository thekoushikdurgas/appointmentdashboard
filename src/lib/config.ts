/**
 * Application Configuration
 * Centralized configuration file for environment variables and feature flags.
 * GraphQL endpoint aligns with contact360.io/api (FastAPI + Strawberry).
 */

/**
 * Production builds must use HTTPS for the API when the app is served over HTTPS
 * (mixed content blocks http:// fetches). Override with NEXT_PUBLIC_API_URL.
 */
const defaultApiBase =
  process.env.NODE_ENV === "production"
    ? "https://api.contact360.io"
    : "http://api.contact360.io";

const _apiBase = process.env.NEXT_PUBLIC_API_URL || defaultApiBase;
export const API_URL = _apiBase.replace(/\/$/, "");

/**
 * In development, default to same-origin `/graphql` (resolved below) so the browser
 * does not cross-origin fetch `api.contact360.io` (avoids CORS unless the API lists
 * http://localhost:3000 in ALLOWED_ORIGINS). next.config.ts rewrites `/graphql` to
 * GRAPHQL_UPSTREAM_URL (defaults to http://api.contact360.io when unset in examples).
 */
function resolveGraphqlUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  // if (process.env.NODE_ENV === "development") {
  //   return "http://localhost:8000/graphql";
  // }
  return `${API_URL}/graphql`;
}

export const GRAPHQL_URL = resolveGraphqlUrl();

export const JOBS_S3_BUCKET =
  process.env.NEXT_PUBLIC_JOBS_S3_BUCKET || "appointment360uploads";

export const EXPORTS_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_EXPORTS_FEATURE_ENABLED === "true";

export const ENABLE_GEOLOCATION =
  process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION !== "false";

export const GEOLOCATION_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_GEOLOCATION_TIMEOUT ?? "5000",
  10,
);

/**
 * Résumé Matcher via contact360.io/api gateway (`/resume/v1`).
 * - Production default: same host as `API_URL` (Bearer JWT required except health).
 * - Development default: `""` → browser calls `/resume/v1/...` (see `next.config.ts` rewrite).
 * Override with `NEXT_PUBLIC_RESUME_AI_URL` to hit scraper.server directly (e.g. local :8000).
 */
export function resolveResumeAiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_RESUME_AI_URL;
  if (explicit !== undefined) return explicit.trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "";
  return API_URL;
}

export const RESUME_AI_URL = resolveResumeAiBase();

/**
 * Whether Résumé Matcher requests should be enabled in the UI.
 * Development allows an empty base URL (same-origin `/resume/v1` rewrite).
 */
export function isResumeAiConfigured(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const explicit = process.env.NEXT_PUBLIC_RESUME_AI_URL;
  if (explicit !== undefined) return explicit.trim().length > 0;
  return Boolean(API_URL?.trim());
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
