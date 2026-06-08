/// <reference types="vitest/globals" />
import { routeMatches } from "./tourNavigation";
import { DEFAULT_TOUR_STEPS } from "./tourSteps";

describe("routeMatches", () => {
  it("matches prefix routes for nested paths", () => {
    expect(routeMatches("/hiring-signals", "/hiring-signals")).toBe(true);
    expect(routeMatches("/billing", "/billing", "prefix")).toBe(true);
  });

  it("rejects unrelated paths", () => {
    expect(routeMatches("/dashboard", "/hiring-signals")).toBe(false);
  });
});

describe("DEFAULT_TOUR_STEPS", () => {
  it("defines the hiring-signals-first tour flow", () => {
    expect(DEFAULT_TOUR_STEPS).toHaveLength(8);
    expect(DEFAULT_TOUR_STEPS.map((s) => s.id)).toEqual([
      "welcome",
      "dashboard",
      "hiring-signals",
      "hs-filters",
      "hs-job-list",
      "hs-contacts-panel",
      "hs-email-notify",
      "billing",
    ]);
  });
});
