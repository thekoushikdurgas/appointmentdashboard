/** Matches gateway / satellite limit per mutation. */
export const SALES_NAV_SAVE_MAX_PROFILES = 1000;

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    out.push(items.slice(i, i + chunkSize));
  }
  return out;
}

/** Parse pasted JSON; must be an array of objects (satellite snake_case or mixed). */
export function parseProfilesJsonArray(
  raw: string,
): Array<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("JSON must be an array of profile objects");
  }
  if (parsed.length === 0) {
    throw new Error("Array is empty");
  }
  if (parsed.length > SALES_NAV_SAVE_MAX_PROFILES * 50) {
    throw new Error("Too many profiles in one paste (reduce batch size)");
  }
  return parsed.map((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Item ${i} must be an object`);
    }
    return item as Record<string, unknown>;
  });
}
