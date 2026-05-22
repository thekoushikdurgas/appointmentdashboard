/// <reference types="vitest/globals" />
import {
  formatHireSignalPostedDate,
  isHireSignalPostedDateOnly,
} from "./hiringSignalPostedDate";

describe("isHireSignalPostedDateOnly", () => {
  it("detects YYYY-MM-DD from OpenSearch time_posted", () => {
    expect(isHireSignalPostedDateOnly("2026-05-22")).toBe(true);
  });

  it("detects legacy UI normalization at UTC midnight", () => {
    expect(isHireSignalPostedDateOnly("2026-05-22T00:00:00.000Z")).toBe(true);
  });

  it("does not treat real timestamps as date-only", () => {
    expect(
      isHireSignalPostedDateOnly("2026-05-22T14:18:40.294Z"),
    ).toBe(false);
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
