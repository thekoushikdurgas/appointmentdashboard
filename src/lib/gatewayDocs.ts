import { API_URL } from "@/lib/config";

/** Resolve `apiMetadata.docs` to an absolute URL (uses `NEXT_PUBLIC_API_URL` for relative paths). */
export function resolveGatewayDocsUrl(docsPath: string): string {
  const p = (docsPath ?? "").trim();
  if (!p) return API_URL;
  if (/^https?:\/\//i.test(p)) return p;
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${API_URL.replace(/\/$/, "")}${path}`;
}
