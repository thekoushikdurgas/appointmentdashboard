"use client";

import { useCallback, useState } from "react";
import { Bookmark, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  savedSearchesService,
  type SavedSearch,
} from "@/services/graphql/savedSearchesService";
import {
  type ContactSavedSearchPayload,
  type CompanySavedSearchPayload,
  isContactSavedSearchPayload,
  isCompanySavedSearchPayload,
} from "@/lib/savedSearchPayload";
import { parseOperationError } from "@/lib/errorParser";
import { cn } from "@/lib/utils";

type Entity = "contact" | "company";

interface SavedSearchesMenuProps {
  entity: Entity;
  getContactPayload?: () => ContactSavedSearchPayload;
  getCompanyPayload?: () => CompanySavedSearchPayload;
  onApplyContact?: (payload: ContactSavedSearchPayload) => void;
  onApplyCompany?: (payload: CompanySavedSearchPayload) => void;
  className?: string;
}

export function SavedSearchesMenu({
  entity,
  getContactPayload,
  getCompanyPayload,
  onApplyContact,
  onApplyCompany,
  className,
}: SavedSearchesMenuProps) {
  const [list, setList] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const typeFilter = entity === "contact" ? "contact" : "company";
  const errorDomain = entity === "contact" ? "contacts" : "companies";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await savedSearchesService.list({
        type: typeFilter,
        limit: 100,
      });
      setList(res.savedSearches.listSavedSearches.searches);
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, errorDomain]);

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    const filters =
      entity === "contact" ? getContactPayload?.() : getCompanyPayload?.();
    if (!filters) {
      toast.error("Could not build a payload for this view.");
      return;
    }
    setSaving(true);
    try {
      await savedSearchesService.create({
        name,
        type: typeFilter,
        filters: filters as unknown as Record<string, unknown>,
      });
      toast.success("Saved search created.");
      setSaveOpen(false);
      setSaveName("");
      await load();
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    } finally {
      setSaving(false);
    }
  };

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
      } else {
        toast.error(
          "This saved search uses an older format and could not be applied.",
        );
        return;
      }
      toast.success(`Applied “${row.name}”.`);
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete saved search “${name}”?`)) return;
    try {
      await savedSearchesService.delete(id);
      toast.success("Deleted.");
      await load();
    } catch (e) {
      toast.error(parseOperationError(e, errorDomain).userMessage);
    }
  };

  return (
    <>
      <Popover
        align="end"
        width={320}
        onOpenChange={(isOpen) => {
          if (isOpen) void load();
        }}
        trigger={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(className)}
            leftIcon={<Bookmark size={14} />}
          >
            Saved
          </Button>
        }
        content={
          <div className="c360-flex c360-flex-col c360-gap-3 c360-p-1">
            <div className="c360-flex c360-justify-between c360-items-center c360-gap-2">
              <span className="c360-text-sm c360-fw-medium">
                Saved searches
              </span>
              <Button
                type="button"
                variant="ghost"
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
                No saved searches yet. Use &ldquo;Save current&rdquo; to store
                this view.
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
        }
      />

      <Modal
        isOpen={saveOpen}
        onClose={() => {
          setSaveOpen(false);
          setSaveName("");
        }}
        title="Save current view"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSaveOpen(false);
                setSaveName("");
              }}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={() => void handleSave()}
              disabled={!saveName.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="e.g. EU verified contacts"
        />
      </Modal>
    </>
  );
}
