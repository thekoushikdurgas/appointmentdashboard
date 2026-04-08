/** Turn JSON map stats (e.g. logStatistics.byLevel) into sorted bar rows. */
export function jsonCountsToRows(
  json: unknown,
  max = 12,
): { label: string; value: number }[] {
  if (!json || typeof json !== "object") return [];
  return Object.entries(json as Record<string, unknown>)
    .map(([label, raw]) => ({
      label,
      value: typeof raw === "number" ? raw : Number(raw) || 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}
