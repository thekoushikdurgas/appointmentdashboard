"use client";

const DELAY_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 3, label: "3 hours" },
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
] as const;

export type NewJobMode = "off" | "instant" | "delayed";

export function SavedSearchEmailNotifyFields({
  fieldIdPrefix,
  dailyEnabled,
  onDailyEnabledChange,
  newJobMode,
  onNewJobModeChange,
  delayHours,
  onDelayHoursChange,
  showSendNowHint = false,
}: {
  fieldIdPrefix: string;
  dailyEnabled: boolean;
  onDailyEnabledChange: (value: boolean) => void;
  newJobMode: NewJobMode;
  onNewJobModeChange: (value: NewJobMode) => void;
  delayHours: number;
  onDelayHoursChange: (value: number) => void;
  showSendNowHint?: boolean;
}) {
  return (
    <div className="c360-flex c360-flex-col c360-gap-4">
      {showSendNowHint ? (
        <p className="c360-text-xs c360-text-muted">
          Send email now delivers a one-time digest of current matching jobs.
        </p>
      ) : null}

      <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
        <input
          type="checkbox"
          checked={dailyEnabled}
          onChange={(e) => onDailyEnabledChange(e.target.checked)}
        />
        <span className="c360-text-sm">Daily digest (10:00 AM IST)</span>
      </label>

      <fieldset className="c360-flex c360-flex-col c360-gap-2">
        <legend className="c360-text-sm c360-fw-medium">New job alerts</legend>
        <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
          <input
            type="radio"
            name={`new-job-mode-${fieldIdPrefix}`}
            checked={newJobMode === "off"}
            onChange={() => onNewJobModeChange("off")}
          />
          <span className="c360-text-sm">Off</span>
        </label>
        <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
          <input
            type="radio"
            name={`new-job-mode-${fieldIdPrefix}`}
            checked={newJobMode === "instant"}
            onChange={() => onNewJobModeChange("instant")}
          />
          <span className="c360-text-sm">Immediately when new jobs match</span>
        </label>
        <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
          <input
            type="radio"
            name={`new-job-mode-${fieldIdPrefix}`}
            checked={newJobMode === "delayed"}
            onChange={() => onNewJobModeChange("delayed")}
          />
          <span className="c360-text-sm">After a delay (batched)</span>
        </label>
        {newJobMode === "delayed" ? (
          <select
            className="c360-text-sm"
            value={delayHours}
            onChange={(e) => onDelayHoursChange(Number(e.target.value))}
            aria-label="Delay before sending new job email"
          >
            {DELAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : null}
      </fieldset>
    </div>
  );
}
