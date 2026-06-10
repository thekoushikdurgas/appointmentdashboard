"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Bell, BellOff, Bookmark, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SavedSearchesAsideDrawer } from "@/components/feature/saved-searches/SavedSearchesAsideDrawer";
import {
  savedSearchesService,
  type SavedSearch,
} from "@/services/graphql/savedSearchesService";
import {
  SAVED_SEARCH_VERSION_SIDEBAR,
  type ContactSavedSearchPayload,
  type CompanySavedSearchPayload,
  type HireSignalSavedSearchPayload,
  isContactSavedSearchPayload,
  isCompanySavedSearchPayload,
  isHireSignalSavedSearchPayload,
} from "@/lib/savedSearchPayload";
import { countDraftConditions } from "@/lib/vqlDraft";
import { parseOperationError } from "@/lib/errorParser";
import { cn } from "@/lib/utils";
import { useSavedSearchContactCounts } from "@/hooks/useSavedSearchContactCounts";
import { useSavedSearchCompanyCounts } from "@/hooks/useSavedSearchCompanyCounts";
import { useSavedSearchHireSignalJobCounts } from "@/hooks/useSavedSearchHireSignalJobCounts";
import { SavedSearchCohortCount } from "@/components/feature/saved-searches/SavedSearchCohortCount";
import {
  emailService,
  type JobEmailNotificationConfig,
} from "@/services/graphql/emailService";
import { SavedSearchEmailNotifyModal } from "@/components/feature/saved-searches/SavedSearchEmailNotifyModal";

type Entity = "contact" | "company" | "hire_signal";

/** Isolated from list-loading state so typing in the save modal does not remount the input. */
function SaveSearchNameModal({
  isOpen,
  saving,
  saveName,
  onSaveNameChange,
  onClose,
  onSave,
  nameInputRef,
}: {
  isOpen: boolean;
  saving: boolean;
  saveName: string;
  onSaveNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
}) {
  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} onClick={onSave} disabled={!saveName.trim()}>
          Save
        </Button>
      </>
    ),
    [onClose, onSave, saveName, saving],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save current view"
      footer={footer}
      stacked
      initialFocusRef={nameInputRef}
    >
      <Input
        ref={nameInputRef}
        label="Name"
        value={saveName}
        onChange={(e) => onSaveNameChange(e.target.value)}
        placeholder="e.g. EU verified contacts"
      />
    </Modal>
  );
}

const SAVED_SEARCHES_PANEL_TITLE_ID = "c360-saved-searches-panel-title";

function countNonEmptyFacetGroups(
  facetValues: Record<string, string[]> | undefined,
): number {
  if (!facetValues) return 0;
  return Object.values(facetValues).filter((values) => values.length > 0)
    .length;
}

function describeSavedSearchSummary(s: SavedSearch): string {
  const raw = s.filters;
  if (!raw || typeof raw !== "object") {
    return "Click to apply this view";
  }
  if (isContactSavedSearchPayload(raw)) {
    const parts: string[] = [];
    if (raw.version === SAVED_SEARCH_VERSION_SIDEBAR) {
      if (raw.search.trim()) parts.push("Email search");
      const facetCount = countNonEmptyFacetGroups(raw.facetValues);
      if (facetCount > 0) {
        parts.push(`${facetCount} facet${facetCount === 1 ? "" : "s"}`);
      }
      const adv =
        raw.advancedListDraft &&
        countDraftConditions(raw.advancedListDraft.rootGroup) > 0;
      if (adv) parts.push("Advanced rules");
    } else {
      parts.push("Saved contact filters");
    }
    if (parts.length === 0) return "Current view (no extra filters)";
    return parts.join(" · ");
  }
  if (isCompanySavedSearchPayload(raw)) {
    const parts: string[] = [];
    if (raw.search.trim()) parts.push("Company search");
    if (raw.version === SAVED_SEARCH_VERSION_SIDEBAR) {
      const facetCount = countNonEmptyFacetGroups(raw.facetValues);
      if (facetCount > 0) {
        parts.push(`${facetCount} facet${facetCount === 1 ? "" : "s"}`);
      }
    }
    return parts.length > 0 ? parts.join(" · ") : "Current company view";
  }
  if (isHireSignalSavedSearchPayload(raw)) {
    const parts: string[] = [];
    if (raw.signalTimePreset === "new_7d") parts.push("Today's Jobs");
    return parts.length > 0 ? parts.join(" · ") : "All Signals";
  }
  return "Click to apply this view";
}

function cohortCountKind(entity: Entity): "contact" | "company" | "job" {
  if (entity === "contact") return "contact";
  if (entity === "company") return "company";
  return "job";
}

function formatSavedSearchDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type SavedSearchesPresentation = "popover" | "panel";

interface SavedSearchesMenuProps {
  entity: Entity;
  getContactPayload?: () => ContactSavedSearchPayload;
  getCompanyPayload?: () => CompanySavedSearchPayload;
  getHireSignalPayload?: () => HireSignalSavedSearchPayload;
  onApplyContact?: (payload: ContactSavedSearchPayload) => void;
  onApplyCompany?: (payload: CompanySavedSearchPayload) => void;
  onApplyHireSignal?: (payload: HireSignalSavedSearchPayload) => void;
  className?: string;
  /** Contacts page: right slide-over panel instead of popover. */
  presentation?: SavedSearchesPresentation;
  /** Controlled open state when `presentation` is `panel`. */
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  /** When false, only the panel/drawer + save modal render (use an external trigger). */
  showTrigger?: boolean;
}

export function SavedSearchesTriggerButton({
  onClick,
  className,
}: {
  /** Omit when the trigger is wrapped by `Popover` (toggle handled by popover). */
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn(className)}
      leftIcon={<Bookmark size={14} />}
      onClick={onClick}
    >
      Saved
    </Button>
  );
}

export function SavedSearchesMenu({
  entity,
  getContactPayload,
  getCompanyPayload,
  getHireSignalPayload,
  onApplyContact,
  onApplyCompany,
  onApplyHireSignal,
  className,
  presentation = "popover",
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  showTrigger = true,
}: SavedSearchesMenuProps) {
  const [list, setList] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [jobEmailConfig, setJobEmailConfig] =
    useState<JobEmailNotificationConfig | null>(null);
  const [jobEmailConfigLoading, setJobEmailConfigLoading] = useState(false);
  const [emailNotifyModal, setEmailNotifyModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const saveNameInputRef = useRef<HTMLInputElement>(null);
  const loadInvocationRef = useRef(0);
  const popoverOpenRef = useRef(false);
  const popoverWasOpenRef = useRef(false);
  const panelWasOpenRef = useRef(false);

  const panelOpen = panelOpenProp ?? internalPanelOpen;
  const setPanelOpen = useCallback(
    (open: boolean) => {
      if (onPanelOpenChange) onPanelOpenChange(open);
      else setInternalPanelOpen(open);
    },
    [onPanelOpenChange],
  );
  const typeFilter =
    entity === "contact"
      ? "contact"
      : entity === "company"
        ? "company"
        : "hire_signal";
  const errorDomain =
    entity === "contact"
      ? "contacts"
      : entity === "company"
        ? "companies"
        : "jobs";

  const panelCountsEnabled = presentation === "panel" && panelOpen;
  const contactCountsEnabled = entity === "contact" && panelCountsEnabled;
  const companyCountsEnabled = entity === "company" && panelCountsEnabled;
  const hireSignalCountsEnabled =
    entity === "hire_signal" && panelCountsEnabled;
  const contactCounts = useSavedSearchContactCounts(list, contactCountsEnabled);
  const companyCounts = useSavedSearchCompanyCounts(list, companyCountsEnabled);
  const hireSignalCounts = useSavedSearchHireSignalJobCounts(
    list,
    hireSignalCountsEnabled,
  );
  const cohortCountsEnabled =
    contactCountsEnabled || companyCountsEnabled || hireSignalCountsEnabled;
  const showJobEmailNotify =
    entity === "hire_signal" && presentation === "panel";

  const loadJobEmailConfig = useCallback(async () => {
    if (!showJobEmailNotify) return;
    setJobEmailConfigLoading(true);
    try {
      const res = await emailService.getJobEmailNotificationConfig();
      setJobEmailConfig(res.email.jobEmailNotificationConfig ?? null);
    } catch (e) {
      toast.error(parseOperationError(e, "jobs").userMessage);
      setJobEmailConfig(null);
    } finally {
      setJobEmailConfigLoading(false);
    }
  }, [showJobEmailNotify]);

  const load = useCallback(
    async (opts?: { fresh?: boolean; silent?: boolean }) => {
      ++loadInvocationRef.current;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await savedSearchesService.list(
          { type: typeFilter, limit: 100 },
          { fresh: opts?.fresh },
        );
        const searches = res.savedSearches.listSavedSearches.searches;
        setList(searches);
      } catch (e) {
        toast.error(parseOperationError(e, errorDomain).userMessage);
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, errorDomain],
  );

  const handlePopoverOpenChange = useCallback(
    (isOpen: boolean) => {
      const opened = isOpen && !popoverWasOpenRef.current;
      popoverOpenRef.current = isOpen;
      popoverWasOpenRef.current = isOpen;
      if (opened) void load();
    },
    [load],
  );

  useEffect(() => {
    if (presentation !== "panel") return;
    const opened = panelOpen && !panelWasOpenRef.current;
    panelWasOpenRef.current = panelOpen;
    if (opened) {
      void load();
      void loadJobEmailConfig();
    }
  }, [presentation, panelOpen, load, loadJobEmailConfig, entity]);

  const isJobEmailSubscribed = useCallback(
    (searchId: string) => {
      if (
        !jobEmailConfig ||
        jobEmailConfig.savedSearchId == null ||
        jobEmailConfig.savedSearchId !== searchId
      ) {
        return false;
      }
      return (
        jobEmailConfig.dailyEnabled ||
        (jobEmailConfig.newJobMode !== "off" &&
          jobEmailConfig.newJobMode !== undefined)
      );
    },
    [jobEmailConfig],
  );

  const openEmailNotifyModal = useCallback(
    (searchId: string, searchName: string) => {
      setEmailNotifyModal({ id: searchId, name: searchName });
    },
    [],
  );

  const handleSaveNameChange = useCallback((value: string) => {
    setSaveName(value);
  }, []);

  const closeSaveModal = useCallback(() => {
    setSaveOpen(false);
    setSaveName("");
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const openSaveModal = useCallback(() => {
    setSaveOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const name = saveName.trim();
    if (!name) return;
    const filters =
      entity === "contact"
        ? getContactPayload?.()
        : entity === "company"
          ? getCompanyPayload?.()
          : getHireSignalPayload?.();
    if (!filters) {
      toast.error("Could not build a payload for this view.");
      return;
    }
    setSaving(true);
    try {
      const created = await savedSearchesService.create({
        name,
        type: typeFilter,
        filters: filters as unknown as Record<string, unknown>,
      });
      const row = created.savedSearches.createSavedSearch;
      setList((prev) => {
        if (prev.some((s) => s.id === row.id)) return prev;
        const optimistic: SavedSearch = {
          id: row.id,
          name: row.name,
          description: null,
          type: row.type,
          searchTerm: null,
          filters: filters as unknown as Record<string, unknown>,
          sortField: null,
          sortDirection: null,
          pageSize: null,
          createdAt: row.createdAt ?? new Date().toISOString(),
          updatedAt: null,
          lastUsedAt: null,
          useCount: row.useCount ?? 0,
        };
        return [optimistic, ...prev];
      });
      toast.success("Saved search created.");
      closeSaveModal();
      await load({ fresh: true, silent: true });
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    } finally {
      setSaving(false);
    }
  }, [
    saveName,
    entity,
    getContactPayload,
    getCompanyPayload,
    getHireSignalPayload,
    typeFilter,
    errorDomain,
    closeSaveModal,
    load,
  ]);

  const handleApply = async (s: SavedSearch) => {
    try {
      const full = await savedSearchesService.get(s.id);
      const row = full.savedSearches.getSavedSearch;
      const raw = row.filters;
      if (entity === "contact" && isContactSavedSearchPayload(raw)) {
        onApplyContact?.(raw);
        await savedSearchesService.updateUsage(row.id);
      } else if (entity === "company" && isCompanySavedSearchPayload(raw)) {
        onApplyCompany?.(raw);
        await savedSearchesService.updateUsage(row.id);
      } else if (
        entity === "hire_signal" &&
        isHireSignalSavedSearchPayload(raw)
      ) {
        onApplyHireSignal?.(raw);
        await savedSearchesService.updateUsage(row.id);
      } else {
        toast.error(
          "This saved search uses an older format and could not be applied.",
        );
        return;
      }
      toast.success(`Applied “${row.name}”.`);
      if (presentation === "panel") setPanelOpen(false);
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete saved search “${name}”?`)) return;
    try {
      await savedSearchesService.delete(id, typeFilter);
      setList((prev) => prev.filter((s) => s.id !== id));
      if (jobEmailConfig?.savedSearchId === id) {
        setJobEmailConfig(null);
      }
      toast.success("Deleted.");
      await load({ fresh: true, silent: true });
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    }
  };

  const listBody = loading ? (
    <div className="c360-saved-searches-panel__loading">
      <Loader2
        className="c360-spin"
        size={24}
        aria-label="Loading saved searches"
      />
    </div>
  ) : list.length === 0 ? (
    <p className="c360-saved-searches-panel__empty">
      No saved searches yet. Use &ldquo;Save current&rdquo; to store this view.
    </p>
  ) : (
    <>
      <p className="c360-saved-searches-panel__hint">
        {list.length} saved view{list.length === 1 ? "" : "s"} — select one to
        apply filters.
        {contactCountsEnabled
          ? " Contact counts match each saved cohort."
          : companyCountsEnabled
            ? " Company counts match each saved cohort."
            : hireSignalCountsEnabled
              ? " Job counts match each saved view."
              : null}
      </p>
      <ul className="c360-saved-searches-panel__list">
        {list.map((s) => {
          const savedOn = formatSavedSearchDate(s.createdAt);
          const emailSubscribed = isJobEmailSubscribed(s.id);
          return (
            <li key={s.id} className="c360-saved-searches-panel__item">
              <button
                type="button"
                className="c360-saved-searches-panel__item-main"
                onClick={() => void handleApply(s)}
              >
                <span className="c360-saved-searches-panel__item-text">
                  <div className="c360-flex c360-items-center c360-gap-2">
                    <span className="c360-saved-searches-panel__item-icon">
                      <Bookmark size={16} aria-hidden />
                    </span>
                    <span className="c360-saved-searches-panel__item-name">
                      {cohortCountsEnabled ? (
                        <>
                          {s.name} {" ("}
                          <SavedSearchCohortCount
                            kind={cohortCountKind(entity)}
                            entry={
                              entity === "contact"
                                ? contactCounts[s.id]
                                : entity === "company"
                                  ? companyCounts[s.id]
                                  : hireSignalCounts[s.id]
                            }
                          />
                          {")"}
                        </>
                      ) : (
                        s.name
                      )}
                    </span>
                  </div>
                  <span className="c360-saved-searches-panel__item-meta">
                    {describeSavedSearchSummary(s)}
                    {savedOn ? ` · Saved ${savedOn}` : ""}
                  </span>
                </span>
              </button>
              <div className="c360-icons-container">
                {showJobEmailNotify ? (
                  <button
                    type="button"
                    className={cn(
                      "c360-btn c360-btn--ghost c360-btn--icon c360-saved-searches-panel__item-notify",
                      emailSubscribed &&
                      "c360-saved-searches-panel__item-notify--active",
                    )}
                    aria-label={`Email notifications for ${s.name}`}
                    aria-pressed={emailSubscribed ? "true" : "false"}
                    disabled={jobEmailConfigLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEmailNotifyModal(s.id, s.name);
                    }}
                  >
                    {emailSubscribed ? (
                      <Bell size={14} aria-hidden />
                    ) : (
                      <BellOff size={14} aria-hidden />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="c360-btn c360-btn--ghost c360-btn--icon c360-saved-searches-panel__item-delete"
                  aria-label={`Delete ${s.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(s.id, s.name);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );

  const popoverListBody = (
    <div className="c360-flex c360-flex-col c360-gap-3 c360-p-1">
      <div className="c360-flex c360-justify-between c360-items-center c360-gap-2">
        <span className="c360-text-sm c360-fw-medium">Saved Searches</span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setSaveOpen(true)}
        >
          Save current
        </Button>
      </div>
      {loading ? (
        <div className="c360-flex c360-justify-center c360-py-4">
          <Loader2 className="c360-spin" size={20} />
        </div>
      ) : list.length === 0 ? (
        <p className="c360-text-sm c360-text-muted c360-m-0">
          No saved searches yet. Use &ldquo;Save current&rdquo; to store this
          view.
        </p>
      ) : (
        <ul className="c360-list-none">
          {list.map((s) => (
            <li
              key={s.id}
              className="c360-flex c360-justify-between c360-items-center c360-gap-2 c360-py-2 c360-border-b c360-border-default"
            >
              <button
                type="button"
                className="c360-interactive-plain c360-text-left c360-flex-1 c360-text-sm"
                onClick={() => void handleApply(s)}
              >
                {s.name}
              </button>
              <button
                type="button"
                className="c360-btn c360-btn--ghost c360-btn--icon"
                aria-label={`Delete ${s.name}`}
                onClick={() => void handleDelete(s.id, s.name)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <>
      {presentation === "popover" && showTrigger ? (
        <Popover
          align="end"
          width={320}
          onOpenChange={handlePopoverOpenChange}
          trigger={<SavedSearchesTriggerButton className={className} />}
          content={popoverListBody}
        />
      ) : null}

      {presentation === "panel" ? (
        <>
          {showTrigger ? (
            <SavedSearchesTriggerButton
              className={className}
              onClick={() => setPanelOpen(true)}
            />
          ) : null}
          <SavedSearchesAsideDrawer
            isOpen={panelOpen}
            onClose={closePanel}
            trapFocus={!saveOpen}
            ariaLabelledBy={SAVED_SEARCHES_PANEL_TITLE_ID}
          >
            <header className="c360-saved-searches-panel__header">
              <div className="c360-saved-searches-panel__header-text">
                <h2
                  id={SAVED_SEARCHES_PANEL_TITLE_ID}
                  className="c360-saved-searches-panel__title"
                >
                  Saved Searches
                </h2>
              </div>
              <div className="c360-saved-searches-panel__header-actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={openSaveModal}
                  data-tour={
                    showJobEmailNotify ? "hs-email-save-btn" : undefined
                  }
                >
                  Save current
                </Button>
              </div>
            </header>
            <div className="c360-saved-searches-panel__body">{listBody}</div>
          </SavedSearchesAsideDrawer>
        </>
      ) : null}

      <SaveSearchNameModal
        isOpen={saveOpen}
        saving={saving}
        saveName={saveName}
        onSaveNameChange={handleSaveNameChange}
        onClose={closeSaveModal}
        onSave={handleSave}
        nameInputRef={saveNameInputRef}
      />

      {emailNotifyModal ? (
        <SavedSearchEmailNotifyModal
          isOpen
          searchId={emailNotifyModal.id}
          searchName={emailNotifyModal.name}
          config={jobEmailConfig}
          configLoading={jobEmailConfigLoading}
          onClose={() => setEmailNotifyModal(null)}
          onConfigUpdated={setJobEmailConfig}
        />
      ) : null}
    </>
  );
}
