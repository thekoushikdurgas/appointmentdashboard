/// <reference types="vitest/globals" />
import {
  endOfLocalDay,
  postedBoundsFromCustomDay,
  postedBoundsFromPreset,
  startOfLocalDay,
  toLocalRFC3339,
} from "./hiringSignalFilterDraft";

describe("toLocalRFC3339", () => {
  it("includes T and timezone offset", () => {
    const d = new Date(2026, 5, 4, 14, 30, 0, 0);
    const out = toLocalRFC3339(d);
    expect(out).toMatch(/T/);
    expect(out).toMatch(/[+-]\d{2}:\d{2}$/);
  });
});

describe("postedBoundsFromPreset", () => {
  const now = new Date(2026, 5, 4, 15, 0, 0, 0);

  it("today uses same local calendar day for after and before", () => {
    const { postedAfter, postedBefore } = postedBoundsFromPreset("today", now);
    expect(postedAfter).toMatch(/2026-06-04T00:00:00/);
    expect(postedBefore).toMatch(/2026-06-04T23:59:59/);
    expect(postedAfter).toMatch(/T/);
    expect(postedBefore).toMatch(/T/);
  });

  it("yesterday uses previous local calendar day", () => {
    const { postedAfter, postedBefore } = postedBoundsFromPreset(
      "yesterday",
      now,
    );
    expect(postedAfter).toMatch(/2026-06-03T00:00:00/);
    expect(postedBefore).toMatch(/2026-06-03T23:59:59/);
  });

  it("7d spans 7 inclusive local days ending today", () => {
    const { postedAfter, postedBefore } = postedBoundsFromPreset("7d", now);
    expect(postedAfter).toMatch(/2026-05-29T00:00:00/);
    expect(postedBefore).toMatch(/2026-06-04T23:59:59/);
  });

  it("15d spans 15 inclusive local days ending today", () => {
    const { postedAfter, postedBefore } = postedBoundsFromPreset("15d", now);
    expect(postedAfter).toMatch(/2026-05-21T00:00:00/);
    expect(postedBefore).toMatch(/2026-06-04T23:59:59/);
  });

  it("30d spans 30 inclusive local days ending today", () => {
    const { postedAfter, postedBefore } = postedBoundsFromPreset("30d", now);
    expect(postedAfter).toMatch(/2026-05-06T00:00:00/);
    expect(postedBefore).toMatch(/2026-06-04T23:59:59/);
  });
});

describe("postedBoundsFromCustomDay", () => {
  it("maps YYYY-MM-DD to local start and end of that day", () => {
    const { postedAfter, postedBefore } =
      postedBoundsFromCustomDay("2026-03-15");
    expect(postedAfter).toMatch(/2026-03-15T00:00:00/);
    expect(postedBefore).toMatch(/2026-03-15T23:59:59/);
  });

  it("returns empty bounds for invalid input", () => {
    expect(postedBoundsFromCustomDay("")).toEqual({
      postedAfter: "",
      postedBefore: "",
    });
    expect(postedBoundsFromCustomDay("not-a-date")).toEqual({
      postedAfter: "",
      postedBefore: "",
    });
  });
});

describe("startOfLocalDay / endOfLocalDay", () => {
  it("anchors to local midnight and end of day", () => {
    const mid = new Date(2026, 0, 10, 12, 34, 56, 789);
    const start = startOfLocalDay(mid);
    const end = endOfLocalDay(mid);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
  });
});
