/// <reference types="vitest/globals" />
import {
  effectivePostedBounds,
  effectivePostedAfter,
  effectivePostedBefore,
} from "@/lib/jobs/hiringSignalJobRows";

describe("effectivePostedBounds", () => {
  const fixedNow = new Date(2026, 5, 4, 15, 0, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("all preset passes through explicit bounds", () => {
    expect(
      effectivePostedBounds("all", {
        postedAfter: "2026-01-01",
        postedBefore: "2026-06-01",
      }),
    ).toEqual({
      postedAfter: "2026-01-01",
      postedBefore: "2026-06-01",
    });
  });

  it("new_7d defaults to local today when no sidebar date", () => {
    const bounds = effectivePostedBounds("new_7d", {});
    expect(bounds.postedAfter).toMatch(/2026-06-04T00:00:00/);
    expect(bounds.postedBefore).toMatch(/2026-06-04T23:59:59/);
    expect(bounds.postedAfter).toMatch(/T/);
  });

  it("new_7d respects sidebar date when set", () => {
    expect(
      effectivePostedBounds("new_7d", {
        postedAfter: "2026-05-01",
        postedBefore: "2026-05-31",
      }),
    ).toEqual({
      postedAfter: "2026-05-01",
      postedBefore: "2026-05-31",
    });
  });

  it("effectivePostedAfter and effectivePostedBefore delegate to bounds", () => {
    expect(effectivePostedAfter("all", "2026-03-01")).toBe("2026-03-01");
    expect(effectivePostedBefore("all", "2026-03-31")).toBe("2026-03-31");
    const after = effectivePostedAfter("new_7d", undefined);
    const before = effectivePostedBefore("new_7d", undefined);
    expect(after).toMatch(/2026-06-04T00:00:00/);
    expect(before).toMatch(/2026-06-04T23:59:59/);
  });
});
