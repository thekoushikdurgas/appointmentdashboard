"use client";

import { Search } from "lucide-react";
import { useShellSearch } from "@/context/ShellSearchContext";

interface SidebarSearchProps {
  collapsed?: boolean;
}

export function SidebarSearch({ collapsed }: SidebarSearchProps) {
  const { openSearch } = useShellSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className="c360-sidebar-search-trigger"
      title="Search (Ctrl+K)"
      aria-label="Open search"
    >
      <Search size={15} />
      {!collapsed && (
        <>
          <span className="c360-sidebar-search-trigger__label">
            Search here…
          </span>
          <kbd className="c360-sidebar-search-trigger__kbd">⌘K</kbd>
        </>
      )}
    </button>
  );
}
