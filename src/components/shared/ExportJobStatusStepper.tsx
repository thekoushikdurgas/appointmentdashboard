"use client";

const STEPS = ["Upload", "Queued", "Processing", "Done"] as const;

function stepIndexFromStatus(status: string | null | undefined): number {
  if (!status) return 0;
  const u = status.toUpperCase();
  if (u.includes("FAIL") || u.includes("ERROR") || u.includes("CANCEL")) {
    return 3;
  }
  if (
    u.includes("COMPLET") ||
    u.includes("SUCCEED") ||
    u.includes("DONE") ||
    u.includes("SUCCESS")
  ) {
    return 3;
  }
  if (u.includes("PROCESS") || u.includes("RUNNING") || u.includes("RUN")) {
    return 2;
  }
  if (
    u.includes("QUEUE") ||
    u.includes("PENDING") ||
    u.includes("OPEN") ||
    u.includes("WAIT")
  ) {
    return 1;
  }
  return 0;
}

export function ExportJobStatusStepper({
  jobStatus,
  failed,
}: {
  jobStatus: string | null;
  failed?: boolean;
}) {
  const active = failed ? 3 : stepIndexFromStatus(jobStatus);
  return (
    <div
      className="c360-export-stepper c360-flex c360-items-center c360-gap-1 c360-text-xs c360-mb-3"
      aria-label="Job status"
    >
      {STEPS.map((label, i) => {
        const done = i < active || (i === 3 && !failed && active >= 3);
        const current = i === active;
        return (
          <div key={label} className="c360-flex c360-items-center c360-gap-1">
            <span
              className={
                done || current
                  ? "c360-font-medium c360-text-body"
                  : "c360-text-muted"
              }
            >
              {label}
              {i === 3 && failed ? " / Failed" : ""}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="c360-text-muted" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
