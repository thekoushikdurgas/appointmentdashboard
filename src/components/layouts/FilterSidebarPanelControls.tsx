"use client";

import { Pin, PinOff } from "lucide-react";
import { useOptionalDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { useOptionalFilterSidebarPeek } from "@/context/FilterSidebarPeekContext";
import { cn } from "@/lib/utils";

/** Pin control for data-page filter sidebar headers (desktop). Pin on = expanded; pin off = rail + hover peek. */
export function FilterSidebarPanelControls() {
  const panel = useOptionalDataFiltersPanelContext();
  const peek = useOptionalFilterSidebarPeek();

  if (!panel?.collapseEnabled) return null;

  const { pinned, togglePin } = panel;
  const isRail =
    peek?.effectiveAnimateState === "collapsed" && !peek.isHoverPeeking;

  return (
    <div
      className={cn(
        "c360-data-filters-panel-controls",
        isRail && "c360-data-filters-panel-controls--rail",
      )}
    >
      <button
        type="button"
        className="c360-btn c360-btn--ghost c360-btn--icon c360-data-filters-panel-controls__btn"
        title={pinned ? "Unpin filters" : "Pin filters open"}
        aria-label={pinned ? "Unpin filters" : "Pin filters open"}
        aria-pressed={pinned}
        onClick={togglePin}
      >
        {pinned ? (
          <Pin size={16} aria-hidden />
        ) : (
          <PinOff size={16} aria-hidden />
        )}
      </button>
    </div>
  );
}
