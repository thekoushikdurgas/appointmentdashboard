export type RunsSessionsFilter = "active" | "running" | "all";

/** Client-side filter for gateway cards and satellite runs tables. */
export function matchesRunsSessionsFilter(
  status: string | undefined | null,
  filter: RunsSessionsFilter,
): boolean {
  const st = (status ?? "").toLowerCase();
  if (filter === "all") return true;
  if (filter === "running") return st === "running";
  return st === "pending" || st === "running" || st === "paused";
}
