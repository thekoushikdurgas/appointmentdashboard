"use client";

import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const hasActionClusterTail =
    (filterConfig?.show !== false && !!filterConfig) ||
    (viewModes && viewModes.length > 0) ||
    actions.length > 0;

  return (
    <div
      className={cn(`${p}`, className)}
      role="region"
      aria-label="List toolbar"
    >
      {tabs && tabs.length > 0 ? (
        <div className={`${p}__tabs`} role="tablist" aria-label="List scope">
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
                  <span className={`${p}__tab-count`} aria-label="Count">
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={`${p}__actions`}>
        {actionPrefix ? (
          <div className={`${p}__action-prefix`}>{actionPrefix}</div>
        ) : null}
        {actionPrefix && hasActionClusterTail ? (
          <div className={`${p}__divider`} aria-hidden />
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
          <div
            className={`${p}__view-toggle`}
            role="group"
            aria-label="View mode"
          >
            {viewModes.map((mode) => {
              const isActive = viewMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  title={mode.label}
                  aria-pressed={isActive ? "true" : "false"}
                  className={cn(
                    `${p}__view-btn`,
                    isActive && `${p}__view-btn--active`,
                  )}
                  onClick={() => onViewModeChange?.(mode.value)}
                >
                  <mode.icon size={14} aria-hidden />
                  <span className={`${p}__view-label`}>{mode.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {(filterConfig || (viewModes && viewModes.length > 0)) &&
        actions.length > 0 ? (
          <div className={`${p}__divider`} aria-hidden />
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
