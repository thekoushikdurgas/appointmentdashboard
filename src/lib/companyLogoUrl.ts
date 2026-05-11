/**
 * Hostname / favicon helpers for company list UIs when the API has no dedicated logo field.
 * Uses Google’s public favicon endpoint (hostname only in query).
 */

export function companyLogoHostname(company: {
  website?: string | null;
  domain?: string | null;
}): string | null {
  const rawSite = company.website?.trim();
  if (rawSite) {
    try {
      const withProto = /^https?:\/\//i.test(rawSite)
        ? rawSite
        : `https://${rawSite}`;
      const { hostname } = new URL(withProto);
      if (hostname) return hostname;
    } catch {
      /* fall through */
    }
    const stripped = rawSite
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.trim();
    if (stripped) return stripped;
  }
  const d = company.domain?.trim();
  if (d) {
    return (
      d
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        ?.trim() || null
    );
  }
  return null;
}

/** Returns a small favicon URL, or null if we cannot infer a host. */
export function companyFaviconUrl(company: {
  website?: string | null;
  domain?: string | null;
}): string | null {
  const host = companyLogoHostname(company);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
}
