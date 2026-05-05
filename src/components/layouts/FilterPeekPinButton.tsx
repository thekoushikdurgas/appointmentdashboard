"use client";

import { Pin, PinOff } from "lucide-react";
import { useDataFiltersPeek } from "@/context/DataFiltersPeekContext";

export function FilterPeekPinButton() {
  const peek = useDataFiltersPeek();
  if (!peek) return null;

  const { pinned, togglePinned } = peek;

  return (
    <button
      type="button"
      className="c360-data-layout__filters-pin-trigger"
      aria-pressed={pinned ? "true" : "false"}
      aria-label={pinned ? "Unpin filters" : "Pin filters open"}
      title={pinned ? "Unpin filters" : "Pin filters open"}
      onClick={togglePinned}
    >
      {pinned ? (
        <PinOff size={16} aria-hidden />
      ) : (
        <Pin size={16} aria-hidden />
      )}
    </button>
  );
}
