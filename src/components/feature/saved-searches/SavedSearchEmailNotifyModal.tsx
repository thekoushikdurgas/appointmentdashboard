"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  emailService,
  type JobEmailNotificationConfig,
} from "@/services/graphql/emailService";
import { parseOperationError } from "@/lib/errorParser";

const DELAY_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 3, label: "3 hours" },
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
] as const;

type NewJobMode = "off" | "instant" | "delayed";

export function SavedSearchEmailNotifyModal({
  isOpen,
  searchId,
  searchName,
  config,
  configLoading,
  onClose,
  onConfigUpdated,
}: {
  isOpen: boolean;
  searchId: string;
  searchName: string;
  config: JobEmailNotificationConfig | null;
  configLoading: boolean;
  onClose: () => void;
  onConfigUpdated: (cfg: JobEmailNotificationConfig) => void;
}) {
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [newJobMode, setNewJobMode] = useState<NewJobMode>("off");
  const [delayHours, setDelayHours] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);

  const appliesToThisSearch =
    config?.savedSearchId != null && config.savedSearchId === searchId;

  useEffect(() => {
    if (!isOpen) return;
    if (!appliesToThisSearch) {
      setDailyEnabled(false);
      setNewJobMode("off");
      setDelayHours(3);
      return;
    }
    setDailyEnabled(Boolean(config?.dailyEnabled));
    const mode = (config?.newJobMode ?? "off") as NewJobMode;
    setNewJobMode(mode === "instant" || mode === "delayed" ? mode : "off");
    setDelayHours(config?.newJobDelayHours ?? 3);
  }, [isOpen, appliesToThisSearch, config]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await emailService.setJobEmailNotificationPreferences(
        searchId,
        {
          dailyEnabled,
          newJobMode,
          newJobDelayHours: newJobMode === "delayed" ? delayHours : null,
        },
      );
      const cfg = res.email.setJobEmailNotificationPreferences;
      onConfigUpdated(cfg);
      toast.success(`Email preferences saved for “${searchName}”.`);
      onClose();
    } catch (e) {
      toast.error(parseOperationError(e, "jobs").userMessage);
    } finally {
      setSaving(false);
    }
  }, [
    dailyEnabled,
    delayHours,
    newJobMode,
    onClose,
    onConfigUpdated,
    searchId,
    searchName,
  ]);

  const handleSendNow = useCallback(async () => {
    setSendingNow(true);
    try {
      const res = await emailService.sendJobEmailNow(searchId);
      if (res.email.sendJobEmailNow.success) {
        toast.success(`Email sent for “${searchName}”.`);
      } else {
        toast.error("Could not send email.");
      }
    } catch (e) {
      toast.error(parseOperationError(e, "jobs").userMessage);
    } finally {
      setSendingNow(false);
    }
  }, [searchId, searchName]);

  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} onClick={() => void handleSave()}>
          Save preferences
        </Button>
      </>
    ),
    [handleSave, onClose, saving],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Email notifications — ${searchName}`}
      footer={footer}
      stacked
    >
      {configLoading ? (
        <p className="c360-text-sm c360-text-muted">Loading preferences…</p>
      ) : (
        <div className="c360-flex c360-flex-col c360-gap-4">
          <div>
            <Button
              type="button"
              variant="primary"
              loading={sendingNow}
              onClick={() => void handleSendNow()}
            >
              Send email now
            </Button>
            <p className="c360-text-xs c360-text-muted c360-mt-2">
              Sends a one-time digest of current matching jobs.
            </p>
          </div>

          <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
            <input
              type="checkbox"
              checked={dailyEnabled}
              onChange={(e) => setDailyEnabled(e.target.checked)}
            />
            <span className="c360-text-sm">Daily digest (10:00 AM IST)</span>
          </label>

          <fieldset className="c360-flex c360-flex-col c360-gap-2">
            <legend className="c360-text-sm c360-fw-medium">
              New job alerts
            </legend>
            <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
              <input
                type="radio"
                name={`new-job-mode-${searchId}`}
                checked={newJobMode === "off"}
                onChange={() => setNewJobMode("off")}
              />
              <span className="c360-text-sm">Off</span>
            </label>
            <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
              <input
                type="radio"
                name={`new-job-mode-${searchId}`}
                checked={newJobMode === "instant"}
                onChange={() => setNewJobMode("instant")}
              />
              <span className="c360-text-sm">Immediately when new jobs match</span>
            </label>
            <label className="c360-flex c360-items-center c360-gap-2 c360-cursor-pointer">
              <input
                type="radio"
                name={`new-job-mode-${searchId}`}
                checked={newJobMode === "delayed"}
                onChange={() => setNewJobMode("delayed")}
              />
              <span className="c360-text-sm">After a delay (batched)</span>
            </label>
            {newJobMode === "delayed" ? (
              <select
                className="c360-text-sm"
                value={delayHours}
                onChange={(e) => setDelayHours(Number(e.target.value))}
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
      )}
    </Modal>
  );
}
