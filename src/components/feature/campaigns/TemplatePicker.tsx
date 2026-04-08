"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";
import { Mail, X, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCampaignTemplates } from "@/hooks/useCampaignTemplates";
import type { TemplateListRow } from "@/lib/templateListMapping";
import { cn } from "@/lib/utils";

export interface TemplatePickerProps {
  /** Currently selected template ID */
  value: string;
  /** Called when user selects a template */
  onSelect: (template: TemplateListRow) => void;
  /** Called when selection is cleared */
  onClear?: () => void;
  /** Label shown above the picker */
  label?: string;
}

const CATEGORY_COLOR: Record<string, "green" | "blue" | "orange" | "gray"> = {
  welcome: "green",
  newsletter: "blue",
  promo: "orange",
  followup: "gray",
  custom: "gray",
};

export function TemplatePicker({
  value,
  onSelect,
  onClear,
  label = "Email Template",
}: TemplatePickerProps) {
  const { templates, loading, notConfigured } = useCampaignTemplates();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closePicker = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useOverlayLayer(open && mounted, closePicker, panelRef, {
    initialFocusRef: searchInputRef,
  });

  const selected = templates.find((t) => t.id === value);

  const filtered = search.trim()
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.subject ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : templates;

  const handleSelect = (t: TemplateListRow) => {
    onSelect(t);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="c360-template-picker">
      {label && <label className="c360-label">{label}</label>}
      <div className="c360-template-picker__trigger">
        {selected ? (
          <div className="c360-template-picker__selected">
            <Mail size={14} />
            <span className="c360-template-picker__selected-name">
              {selected.name}
            </span>
            {selected.subject && (
              <span className="c360-template-picker__selected-subject">
                — {selected.subject}
              </span>
            )}
            <button
              type="button"
              className="c360-template-picker__clear"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
              }}
              aria-label="Clear selection"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setOpen(true)}
            disabled={loading || notConfigured}
          >
            {loading
              ? "Loading templates…"
              : notConfigured
                ? "Satellite not configured"
                : "Choose a template…"}
          </Button>
        )}
        {selected && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setOpen(true)}
          >
            Change
          </Button>
        )}
      </div>

      {open &&
        mounted &&
        createPortal(
          <div className="c360-modal-overlay" onClick={closePicker}>
            <div
              ref={panelRef}
              className="c360-template-picker__modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Pick a template"
              tabIndex={-1}
            >
              <div className="c360-template-picker__modal-header">
                <span className="c360-template-picker__modal-title">
                  Choose a template
                </span>
                <button
                  type="button"
                  className="c360-icon-btn"
                  onClick={closePicker}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="c360-template-picker__search">
                <Search size={14} />
                <input
                  ref={searchInputRef}
                  className="c360-template-picker__search-input"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="c360-template-picker__list">
                {filtered.length === 0 ? (
                  <p className="c360-text-muted c360-text-sm c360-p-3">
                    {search
                      ? "No templates match your search."
                      : "No templates available."}
                  </p>
                ) : (
                  filtered.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cn(
                        "c360-template-picker__item",
                        t.id === value &&
                          "c360-template-picker__item--selected",
                      )}
                      onClick={() => handleSelect(t)}
                    >
                      <div className="c360-template-picker__item-icon">
                        <Mail size={14} />
                      </div>
                      <div className="c360-template-picker__item-body">
                        <span className="c360-template-picker__item-name">
                          {t.name}
                          {t.isAiGenerated && (
                            <Badge color="primary" className="c360-ml-1">
                              <Sparkles size={10} />
                            </Badge>
                          )}
                        </span>
                        {t.subject && (
                          <span className="c360-template-picker__item-subject">
                            {t.subject}
                          </span>
                        )}
                      </div>
                      {t.category && (
                        <Badge
                          color={CATEGORY_COLOR[t.category] ?? "gray"}
                          className="c360-template-picker__item-badge"
                        >
                          {t.category}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
