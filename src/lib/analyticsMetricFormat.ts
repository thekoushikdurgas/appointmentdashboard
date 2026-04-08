/** Display unit for stored performance metric values (aligned with backend docs). */
export function formatMetricValue(metricName: string, value: number): string {
  const u = metricName.toUpperCase();
  if (u === "LCP") return `${value.toFixed(2)} s`;
  if (u === "CLS") return value.toFixed(3);
  if (u === "FCP" || u === "INP" || u === "TTFB" || u === "FID")
    return `${Math.round(value)} ms`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
