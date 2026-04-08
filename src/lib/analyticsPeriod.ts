import { subDays } from "date-fns";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

const DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** ISO DateTime range for `GetMetricsInput` / `AggregateMetricsInput`. */
export function getMetricsDateRange(period: AnalyticsPeriod): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = subDays(end, DAYS[period]);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}
