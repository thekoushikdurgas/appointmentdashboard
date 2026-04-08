import type { GeolocationInput } from "@/graphql/generated/types";

/**
 * Best-effort client hint for `LoginInput.geolocation` / `RegisterInput.geolocation`
 * (audit / user history on the gateway). No IP lookup — timezone + device string only.
 */
export function buildClientGeolocationHint(): GeolocationInput | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const device =
      typeof navigator !== "undefined"
        ? navigator.userAgent?.slice(0, 240) || undefined
        : undefined;
    if (!timezone && !device) return undefined;
    return {
      ...(timezone ? { timezone } : {}),
      ...(device ? { device } : {}),
    };
  } catch {
    return undefined;
  }
}
