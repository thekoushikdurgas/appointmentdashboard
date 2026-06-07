"use client";

import { useMemo } from "react";
import { Download, Play, RefreshCw } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { HiringSignalsGlobalSearch } from "@/components/feature/hiring-signals/HiringSignalsGlobalSearch";
import { HiringSignalsToolbarTableExtras } from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { useDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";

export interface HiringSignalsListToolbarProps {
  globalSearchTokens?: string[];
  runId?: string;
  loading: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  signalTimePreset: "all" | "new_7d";
  canExportHireSignalXlsx: boolean;
  isSuperAdmin: boolean;
  onGlobalSearchTokensChange: (tokens: string[]) => void;
  onSignalTimePresetChange: (preset: "all" | "new_7d") => void;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (size: number) => void;
  onExportClick: () => void;
  onRefresh: () => void;
  onRunScrapeClick: () => void;
}

export function HiringSignalsListToolbar({
  globalSearchTokens,
  runId,
  loading,
  total,
  pageSize,
  currentPage,
  signalTimePreset,
  canExportHireSignalXlsx,
  isSuperAdmin,
  onGlobalSearchTokensChange,
  onSignalTimePresetChange,
  onPageChange,
  onPageSizeChange,
  onExportClick,
  onRefresh,
  onRunScrapeClick,
}: HiringSignalsListToolbarProps) {
  const { openFilters, collapseEnabled } = useDataFiltersPanelContext();
  const { activeDraftCount } = useHireSignalFilter();

  const filterActiveCount = useMemo(() => {
    let n = activeDraftCount;
    n += normalizeHiringSignalTokenList(globalSearchTokens ?? []).length;
    if (runId?.trim()) n += 1;
    return n;
  }, [activeDraftCount, globalSearchTokens, runId]);

  const runIdTrimmed = runId?.trim() ?? "";

  return (
    <div className="c360-hs-toolbar-stack">
      <div className="c360-hs-toolbar-search-row">
        <HiringSignalsGlobalSearch
          className="c360-hs-global-search--toolbar-full"
          tokens={globalSearchTokens ?? []}
          disabled={loading}
          onTokensChange={onGlobalSearchTokensChange}
        />
        {runIdTrimmed ? (
          <span className="c360-text-2xs c360-text-muted c360-shrink-0 c360-hs-toolbar-run-hint">
            {total.toLocaleString()} jobs match this run
          </span>
        ) : null}
      </div>
      <DataToolbar
        cssPrefix="c360-toolbar"
        tabs={[
          {
            value: "all",
            label: "All signals",
            count: total,
            showCountOnlyWhenActive: true,
          },
          {
            value: "new",
            label: "Today's jobs",
            count: total,
            showCountOnlyWhenActive: true,
          },
        ]}
        activeTab={signalTimePreset === "new_7d" ? "new" : "all"}
        onTabChange={(v) =>
          onSignalTimePresetChange(v === "new" ? "new_7d" : "all")
        }
        totalCount={total}
        filterConfig={{
          activeCount: filterActiveCount,
          onOpen: openFilters,
          show: collapseEnabled,
        }}
        actionPrefix={
          <>
            {total > pageSize ? (
              <Pagination
                variant="dropdown"
                className="c360-hiring-signals-toolbar-pagination"
                page={currentPage + 1}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => onPageChange(p - 1)}
              />
            ) : null}
            <HiringSignalsToolbarTableExtras
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        }
        actions={[
          ...(canExportHireSignalXlsx
            ? [
              {
                label: "Export XLSX",
                onClick: onExportClick,
                icon: Download,
                variant: "secondary" as const,
                disabled: loading || total === 0,
              },
            ]
            : []),
          {
            label: "Refresh",
            onClick: () => void onRefresh(),
            icon: RefreshCw,
            variant: "secondary",
            disabled: loading,
          },
          ...(isSuperAdmin
            ? [
              {
                label: "Run scrape",
                onClick: onRunScrapeClick,
                icon: Play,
                variant: "primary" as const,
              },
            ]
            : []),
        ]}
      />
    </div>
  );
}
