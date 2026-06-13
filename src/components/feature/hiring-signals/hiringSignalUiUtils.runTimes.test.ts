/// <reference types="vitest/globals" />
import {
  satelliteRunStartedIso,
  satelliteRunStartedIsQueued,
} from "./hiringSignalUiUtils";

describe("satelliteRunStartedIso", () => {
  it("uses created_at for pending sessions without worker start", () => {
    const iso = satelliteRunStartedIso({
      status: "pending",
      created_at: "2026-06-13T10:00:00+00:00",
    });
    expect(iso).toBe("2026-06-13T10:00:00+00:00");
  });

  it("prefers started_at when worker has claimed the job", () => {
    const iso = satelliteRunStartedIso({
      status: "running",
      started_at: "2026-06-13T10:27:00+00:00",
      created_at: "2026-06-13T10:00:00+00:00",
    });
    expect(iso).toBe("2026-06-13T10:27:00+00:00");
  });

  it("marks pending rows without started_at as queued", () => {
    expect(
      satelliteRunStartedIsQueued({
        status: "pending",
        created_at: "2026-06-13T10:00:00+00:00",
      }),
    ).toBe(true);
    expect(
      satelliteRunStartedIsQueued({
        status: "running",
        started_at: "2026-06-13T10:27:00+00:00",
      }),
    ).toBe(false);
  });
});
