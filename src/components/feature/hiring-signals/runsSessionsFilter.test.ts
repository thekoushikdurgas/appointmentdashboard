/// <reference types="vitest/globals" />
import { matchesRunsSessionsFilter } from "./runsSessionsFilter";

describe("matchesRunsSessionsFilter", () => {
  it("returns all rows for all filter", () => {
    expect(matchesRunsSessionsFilter("done", "all")).toBe(true);
    expect(matchesRunsSessionsFilter("running", "all")).toBe(true);
  });

  it("active includes pending, running, and paused", () => {
    expect(matchesRunsSessionsFilter("pending", "active")).toBe(true);
    expect(matchesRunsSessionsFilter("running", "active")).toBe(true);
    expect(matchesRunsSessionsFilter("paused", "active")).toBe(true);
    expect(matchesRunsSessionsFilter("done", "active")).toBe(false);
    expect(matchesRunsSessionsFilter("cancelled", "active")).toBe(false);
  });

  it("running includes only running status", () => {
    expect(matchesRunsSessionsFilter("running", "running")).toBe(true);
    expect(matchesRunsSessionsFilter("pending", "running")).toBe(false);
    expect(matchesRunsSessionsFilter("paused", "running")).toBe(false);
    expect(matchesRunsSessionsFilter("done", "running")).toBe(false);
  });
});
