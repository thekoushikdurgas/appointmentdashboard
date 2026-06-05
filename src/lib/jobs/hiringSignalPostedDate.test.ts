/// <reference types="vitest/globals" />
import {
  formatHireSignalPostedDate,
  formatHireSignalPostedParts,
  isHireSignalPostedDateOnly,
  normalizeHireSignalPostedAtIso,
  parseHireSignalCalendarParts,
} from "./hiringSignalPostedDate";

describe("parseHireSignalCalendarParts", () => {
  it("parses YYYY-MM-DD and UTC midnight without rollover", () => {
    expect(parseHireSignalCalendarParts("2026-05-31")).toEqual({
      y: 2026,
      m: 5,
      d: 31,
    });
    expect(parseHireSignalCalendarParts("2026-05-31T00:00:00.000Z")).toEqual({
      y: 2026,
      m: 5,
      d: 31,
    });
  });
});

describe("isHireSignalPostedDateOnly", () => {
  it("detects YYYY-MM-DD from OpenSearch time_posted", () => {
    expect(isHireSignalPostedDateOnly("2026-05-22")).toBe(true);
  });

  it("detects legacy UI normalization at UTC midnight", () => {
    expect(isHireSignalPostedDateOnly("2026-05-22T00:00:00.000Z")).toBe(true);
  });

  it("does not treat real timestamps as date-only", () => {
    expect(isHireSignalPostedDateOnly("2026-05-22T14:18:40.294Z")).toBe(false);
  });
});

describe("formatHireSignalPostedDate", () => {
  it("does not show 5:30 am for date-only when withTime is true", () => {
    const out = formatHireSignalPostedDate("2026-05-22", {
      withTime: true,
      emptyAsDash: true,
    });
    expect(out.toLowerCase()).not.toMatch(/5:30|05:30/);
    expect(out).toMatch(/2026|22|May/i);
  });

  it("shows time for full ISO timestamps", () => {
    const out = formatHireSignalPostedDate("2026-05-22T14:18:40.294Z", {
      withTime: true,
      emptyAsDash: true,
    });
    expect(out.length).toBeGreaterThan(10);
    expect(out).not.toBe("—");
  });
});

describe("formatHireSignalPostedParts", () => {
  it("returns date and time for full ISO", () => {
    const { date, time } = formatHireSignalPostedParts(
      "2026-05-27T00:07:19.000Z",
    );
    expect(date).toMatch(/2026|27|May/i);
    expect(time).toBeTruthy();
  });

  it("returns date only when index has calendar day", () => {
    const { date, time } = formatHireSignalPostedParts("2026-05-22");
    expect(date).toMatch(/2026|22|May/i);
    expect(time).toBeNull();
  });

  it("formats UTC-midnight calendar stamp as the same calendar day", () => {
    const { date, time } = formatHireSignalPostedParts("2026-05-31T00:00:00Z");
    expect(date).toMatch(/31.*May|May.*31/i);
    expect(time).toBeNull();
  });
});

describe("normalizeHireSignalPostedAtIso", () => {
  it("collapses UTC midnight to YYYY-MM-DD", () => {
    expect(normalizeHireSignalPostedAtIso("2026-05-31T00:00:00Z")).toBe(
      "2026-05-31",
    );
    expect(normalizeHireSignalPostedAtIso("2026-05-31")).toBe("2026-05-31");
  });

  it("preserves real timestamps", () => {
    const iso = "2026-05-31T14:18:40.294Z";
    expect(normalizeHireSignalPostedAtIso(iso)).toBe(iso);
  });
});
