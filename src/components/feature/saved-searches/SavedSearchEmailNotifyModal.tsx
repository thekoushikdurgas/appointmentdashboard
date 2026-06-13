"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  SavedSearchEmailNotifyFields,
  type NewJobMode,
} from "@/components/feature/saved-searches/SavedSearchEmailNotifyFields";
import {
  emailService,
  type JobEmailNotificationConfig,
} from "@/services/graphql/emailService";
import { parseOperationError } from "@/lib/errorParser";

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
        <Button
          variant="primary"
          loading={sendingNow}
          disabled={configLoading || saving}
          onClick={() => void handleSendNow()}
        >
          Send email now
        </Button>
        <Button
          loading={saving}
          disabled={configLoading}
          onClick={() => void handleSave()}
        >
          Save preferences
        </Button>
      </>
    ),
    [configLoading, handleSave, handleSendNow, onClose, saving, sendingNow],
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
        <SavedSearchEmailNotifyFields
          fieldIdPrefix={searchId}
          dailyEnabled={dailyEnabled}
          onDailyEnabledChange={setDailyEnabled}
          newJobMode={newJobMode}
          onNewJobModeChange={setNewJobMode}
          delayHours={delayHours}
          onDelayHoursChange={setDelayHours}
          showSendNowHint
        />
      )}
    </Modal>
  );
}
