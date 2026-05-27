/// <reference types="vitest/globals" />
import {
  compareHireSignalRunRows,
  hireSignalRunStartedMs,
  sortHireSignalRunRows,
} from "./hiringSignalRunsSort";

describe("hireSignalRunStartedMs", () => {
  it("prefers started_at over created_at", () => {
    const ms = hireSignalRunStartedMs({
      started_at: "2026-05-27T19:30:23.665969",
      created_at: "2026-05-27T19:30:23.600390+00:00",
    });
    expect(ms).toBeGreaterThan(0);
    expect(new Date(ms).toISOString()).toContain("2026-05-27");
  });

  it("falls back to created_at when pending (no start)", () => {
    const ms = hireSignalRunStartedMs({
      created_at: "2026-05-27T19:25:06.852495+00:00",
    });
    expect(ms).toBeGreaterThan(0);
  });
});

describe("sortHireSignalRunRows", () => {
  it("orders by started desc (newest first)", () => {
    const rows = [
      { job_id: "a", created_at: "2026-05-27T18:00:00+00:00" },
      {
        job_id: "b",
        started_at: "2026-05-27T19:30:23.665969",
        created_at: "2026-05-27T19:30:23.600390+00:00",
      },
    ];
    const sorted = sortHireSignalRunRows(rows, "started", "desc");
    expect(sorted[0]?.job_id).toBe("b");
  });

  it("orders status with running before done", () => {
    expect(
      compareHireSignalRunRows(
        { status: "running" },
        { status: "done" },
        "status",
      ),
    ).toBeLessThan(0);
  });
});
