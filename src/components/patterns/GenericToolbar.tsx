"use client";

import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export interface ToolbarTab {
  label: string;
  value: string;
  count?: number;
  showCountOnlyWhenActive?: boolean;
}

export interface ViewModeConfig {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface ToolbarAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  icon?: LucideIcon;
  disabled?: boolean;
  /** Native tooltip when the action is disabled (e.g. coming soon). */
  title?: string;
}

export interface FilterConfig {
  activeCount: number;
  onOpen: () => void;
  show?: boolean;
}

export interface GenericToolbarProps {
  tabs?: ToolbarTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  /** Inline summary between tabs and the actions cluster (e.g. list stats). */
  meta?: ReactNode;
  viewModes?: ViewModeConfig[];
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  filterConfig?: FilterConfig;
  /** Renders at the start of the right-hand actions cluster (e.g. columns + per page). */
  actionPrefix?: ReactNode;
  actions?: ToolbarAction[];
  className?: string;
  /** BEM prefix for scoped styles (default: kit toolbar). */
  cssPrefix?: string;
}

export function GenericToolbar({
  tabs,
  activeTab,
  onTabChange,
  meta,
  viewModes,
  viewMode,
  onViewModeChange,
  filterConfig,
  actionPrefix,
  actions = [],
  className,
  cssPrefix = "c360-toolbar",
}: GenericToolbarProps) {
  const p = cssPrefix;
  const hasLeading = (tabs && tabs.length > 0) || meta != null;

  return (
    <div
      className={cn(`${p}`, className)}
      role="region"
      aria-label="List toolbar"
    >
      {hasLeading ? (
        <div className={`${p}__leading`}>
          {tabs && tabs.length > 0 ? (
            <div
              className={`${p}__tabs`}
              role="tablist"
              aria-label="List scope"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                const showCount =
                  tab.count !== undefined &&
                  (isActive || !tab.showCountOnlyWhenActive);
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive ? "true" : "false"}
                    id={`${p}__tab-${tab.value}`}
                    className={cn(`${p}__tab`, isActive && `${p}__tab--active`)}
                    onClick={() => onTabChange?.(tab.value)}
                  >
                    <span className={`${p}__tab-label`}>{tab.label}</span>
                    {showCount ? (
                      <span
                        className={`${p}__tab-count`}
                        aria-label={`Count ${formatNumber(tab.count ?? 0)}`}
                        title={
                          tab.count !== undefined && tab.count >= 10_000
                            ? formatNumber(tab.count)
                            : undefined
                        }
                      >
                        {tab.count !== undefined && tab.count >= 10_000
                          ? formatCompact(tab.count)
                          : tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          {meta ? <div className={`${p}__meta`}>{meta}</div> : null}
        </div>
      ) : null}

      <div className={`${p}__actions`}>
        {actionPrefix ? (
          <div className={`${p}__action-prefix`}>{actionPrefix}</div>
        ) : null}
        {filterConfig?.show !== false && filterConfig ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`${p}__filter-btn`}
            onClick={filterConfig.onOpen}
            aria-label={`Open filters${filterConfig.activeCount > 0 ? `, ${filterConfig.activeCount} active` : ""}`}
          >
            <Filter size={14} aria-hidden />
            Filters
            {filterConfig.activeCount > 0 ? (
              <span className={`${p}__filter-badge`}>
                {filterConfig.activeCount}
              </span>
            ) : null}
          </Button>
        ) : null}

        {viewModes && viewModes.length > 0 ? (
          <div className={`${p}__view-toggle`}>
            <Select
              id={`${p}-view-mode`}
              aria-label="View mode"
              value={viewMode ?? viewModes[0]?.value ?? ""}
              onChange={(e) => onViewModeChange?.(e.target.value)}
              options={viewModes.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              fullWidth={false}
              inputSize="sm"
              className={`${p}__view-select`}
            />
          </div>
        ) : null}

        <div className={`${p}__action-buttons`}>
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={`${action.label}-${idx}`}
                type="button"
                variant={action.variant ?? "secondary"}
                size="sm"
                disabled={action.disabled}
                title={action.title}
                onClick={action.onClick}
                leftIcon={Icon ? <Icon size={14} /> : undefined}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
