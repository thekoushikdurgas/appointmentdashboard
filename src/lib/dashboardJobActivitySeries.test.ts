/// <reference types="vitest/globals" />
import { buildJobActivitySeriesFromJobs } from "./dashboardJobActivitySeries";

describe("buildJobActivitySeriesFromJobs", () => {
  it("buckets jobs by local calendar day in the last 30-day window", () => {
    const end = new Date();
    end.setHours(12, 0, 0, 0);
    const iso = end.toISOString();
    const series = buildJobActivitySeriesFromJobs(
      [
        { postedAt: iso, salaryMinUsd: 100, salaryMaxUsd: null },
        { postedAt: iso, salaryMinUsd: null, salaryMaxUsd: null },
      ],
      30,
    );
    const last = series[series.length - 1];
    expect(last.posted).toBe(2);
    expect(last.salaryListed).toBe(1);
  });

  it("ignores jobs outside the window", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 2);
    const series = buildJobActivitySeriesFromJobs(
      [{ postedAt: old.toISOString(), salaryMinUsd: null, salaryMaxUsd: null }],
      30,
    );
    expect(series.every((p) => p.posted === 0)).toBe(true);
  });

  it("skips invalid postedAt", () => {
    const series = buildJobActivitySeriesFromJobs(
      [{ postedAt: "", salaryMinUsd: null, salaryMaxUsd: null }],
      30,
    );
    expect(series.reduce((a, p) => a + p.posted, 0)).toBe(0);
  });
});
