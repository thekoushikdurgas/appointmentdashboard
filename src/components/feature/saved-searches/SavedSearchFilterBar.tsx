"use client";

import { Search } from "lucide-react";
import { Select } from "@/components/ui/Select";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "all", label: "All" },
];

interface SavedSearchFilterBarProps {
  searchQuery: string;
  typeFilter: string;
  onSearchChange: (v: string) => void;
  onTypeChange: (v: string) => void;
}

export function SavedSearchFilterBar({
  searchQuery,
  typeFilter,
  onSearchChange,
  onTypeChange,
}: SavedSearchFilterBarProps) {
  return (
    <div className="c360-flex-row-wrap c360-items-center c360-gap-3 c360-mb-4">
      <div className="c360-search-box">
        <Search size={14} className="c360-search-box__icon" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search saved searches…"
          className="c360-search-box__input"
        />
      </div>
      <Select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        options={TYPE_OPTIONS}
        className="c360-w-40"
      />
    </div>
  );
}
