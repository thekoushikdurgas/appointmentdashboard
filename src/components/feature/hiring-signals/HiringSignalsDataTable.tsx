"use client";

import { useMemo } from "react";
import {
  FileText,
  Building2,
  ExternalLink,
  Link2,
  Columns3,
} from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tooltip } from "@/components/ui/Tooltip";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  employmentTypeBadgeColor,
  hiringSignalInitials,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export const HS_DT_COLUMN_IDS = [
  "title",
  "company",
  "location",
  "type",
  "posted",
  "actions",
] as const;

export type HiringSignalsDataTableColumnId = (typeof HS_DT_COLUMN_IDS)[number];

export const HS_DT_DEFAULT_COLUMNS: HiringSignalsDataTableColumnId[] = [
  ...HS_DT_COLUMN_IDS,
];

const COL_LABELS: Record<HiringSignalsDataTableColumnId, string> = {
  title: "Title",
  company: "Company",
  location: "Location",
  type: "Type",
  posted: "Posted",
  actions: "Actions",
};

export function hiringSignalRowKey(row: LinkedInJobRow): string {
  return row.id || `${row.linkedinJobId}-${row.apifyItemId}`;
}

function formatPosted(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

function isRemoteAllowed(remote: string): boolean {
  const x = remote.trim().toLowerCase();
  return (
    x === "true" ||
    x === "yes" ||
    x === "1" ||
    x.includes("remote") ||
    x.includes("hybrid")
  );
}

export interface HiringSignalsDataTableProps {
  rows: LinkedInJobRow[];
  loading?: boolean;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  onOpenDescription: (row: LinkedInJobRow) => void;
  onOpenCompany: (row: LinkedInJobRow) => void;
  onOpenConnectra: (row: LinkedInJobRow) => void;
  /** Slide-over company panel (prototype-style). */
  onOpenCompanyDrawer?: (row: LinkedInJobRow) => void;
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  density?: "comfortable" | "compact";
  visibleColumns?: HiringSignalsDataTableColumnId[];
  onToggleColumn?: (id: HiringSignalsDataTableColumnId, visible: boolean) => void;
  className?: string;
}

export function HiringSignalsDataTable({
  rows,
  loading,
  pageSize,
  onPageSizeChange,
  onOpenDescription,
  onOpenCompany,
  onOpenConnectra,
  onOpenCompanyDrawer,
  selectedKeys,
  onSelectionChange,
  density = "comfortable",
  visibleColumns = HS_DT_DEFAULT_COLUMNS,
  onToggleColumn,
  className,
}: HiringSignalsDataTableProps) {
  const vis = useMemo(
    () => new Set(visibleColumns),
    [visibleColumns],
  );

  const allIds = useMemo(() => rows.map(hiringSignalRowKey), [rows]);
  const allSelected =
    rows.length > 0 &&
    rows.every((r) => selectedKeys.has(hiringSignalRowKey(r)));
  const someSelected = rows.some((r) =>
    selectedKeys.has(hiringSignalRowKey(r)),
  );

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set([...selectedKeys, ...allIds]));
    } else {
      const next = new Set(selectedKeys);
      for (const id of allIds) next.delete(id);
      onSelectionChange(next);
    }
  };

  const exportSelected = () => {
    const picked = rows.filter((r) => selectedKeys.has(hiringSignalRowKey(r)));
    if (picked.length === 0) {
      toast.message("Nothing selected", {
        description: "Select one or more rows first.",
      });
      return;
    }
    const flat = picked.map((r) => ({
      linkedin_job_id: r.linkedinJobId,
      title: r.title,
      company: r.companyName,
      location: r.location,
      employment_type: r.employmentType,
      seniority: r.seniority,
      function_category: r.functionCategory,
      posted_at: r.postedAt,
      job_url: r.jobUrl,
      company_uuid: r.companyUuid,
    }));
    const csv = Papa.unparse(flat);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hiring-signals-export-${picked.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV", { description: `${picked.length} row(s)` });
  };

  const columnPicker =
    onToggleColumn != null ? (
      <Popover
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="c360-gap-1"
          >
            <Columns3 size={14} aria-hidden />
            Columns
          </Button>
        }
        content={
          <div className="c360-space-y-2 c360-p-1">
            <p className="c360-m-0 c360-text-2xs c360-font-medium c360-text-ink-muted">
              Visible columns
            </p>
            {HS_DT_COLUMN_IDS.map((id) => (
              <Checkbox
                key={id}
                size="sm"
                checked={vis.has(id)}
                onChange={(c) => onToggleColumn(id, c)}
                label={COL_LABELS[id]}
              />
            ))}
          </div>
        }
        width={220}
      />
    ) : null;

  const skeletonRows =
    loading && rows.length === 0
      ? Array.from({ length: 5 }).map((_, si) => (
          <tr
            key={`sk-${si}`}
            className={cn(
              "c360-hs-skeleton-row c360-border-b c360-border-ink-8",
              density === "compact" && "c360-hs-row--compact",
            )}
          >
            {Array.from({ length: 7 }).map((__, ci) => (
              <td key={ci} className="c360-px-3 c360-py-2">
                <div className="c360-skeleton c360-hs-skeleton-cell" />
              </td>
            ))}
          </tr>
        ))
      : null;

  return (
    <div className={cn("c360-w-full c360-min-w-0 c360-space-y-3", className)}>
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
        {selectedKeys.size > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={exportSelected}
          >
            Export selected ({selectedKeys.size})
          </Button>
        ) : (
          <span className="c360-text-2xs c360-text-ink-muted" />
        )}
        <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-2">
          {columnPicker}
          <span className="c360-text-2xs c360-text-ink-muted">Per page</span>
          <Select
            className="c360-w-24"
            fullWidth={false}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value) || 25)}
            options={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      <div className="c360-overflow-x-auto c360-rounded-md c360-border c360-border-ink-8">
        <table className="c360-w-full c360-text-left c360-text-sm">
          <thead className="c360-border-b c360-border-ink-8 c360-bg-ink-4/40">
            <tr>
              <th className="c360-w-px c360-px-2 c360-py-2">
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={toggleAll}
                  size="sm"
                />
              </th>
              {vis.has("title") ? (
                <th className="c360-px-3 c360-py-2 c360-font-medium">
                  Title
                </th>
              ) : null}
              {vis.has("company") ? (
                <th className="c360-px-3 c360-py-2 c360-font-medium">
                  Company
                </th>
              ) : null}
              {vis.has("location") ? (
                <th className="c360-px-3 c360-py-2 c360-font-medium">
                  Location
                </th>
              ) : null}
              {vis.has("type") ? (
                <th className="c360-px-3 c360-py-2 c360-font-medium">Type</th>
              ) : null}
              {vis.has("posted") ? (
                <th className="c360-px-3 c360-py-2 c360-font-medium">
                  Posted
                </th>
              ) : null}
              {vis.has("actions") ? (
                <th className="c360-px-3 c360-py-2 c360-w-px c360-text-right">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {skeletonRows}
            {!loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + vis.size}
                  className="c360-px-3 c360-py-10 c360-text-center c360-text-ink-muted"
                >
                  No job rows yet. Run a scrape from job.server or check
                  filters.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const rk = hiringSignalRowKey(row);
              return (
                <tr
                  key={rk}
                  className={cn(
                    "c360-hs-row c360-border-b c360-border-ink-8",
                    density === "compact" && "c360-hs-row--compact",
                  )}
                >
                  <td className="c360-px-2 c360-py-2 c360-align-top">
                    <Checkbox
                      aria-label={`Select ${row.title || "job"}`}
                      checked={selectedKeys.has(rk)}
                      onChange={(c) => {
                        const next = new Set(selectedKeys);
                        if (c) next.add(rk);
                        else next.delete(rk);
                        onSelectionChange(next);
                      }}
                      size="sm"
                    />
                  </td>
                  {vis.has("title") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-font-medium c360-text-ink">
                      <span className="c360-line-clamp-2">
                        {row.title || "—"}
                      </span>
                      {row.seniority ? (
                        <p className="c360-mt-0-5 c360-text-2xs c360-text-ink-muted c360-font-normal">
                          {row.seniority}
                        </p>
                      ) : null}
                    </td>
                  ) : null}
                  {vis.has("company") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-text-ink-muted">
                      <div className="c360-flex c360-items-center c360-gap-2">
                        <div className="c360-hs-avatar">
                          {row.companyLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.companyLogoUrl}
                              alt=""
                              width={32}
                              height={32}
                            />
                          ) : (
                            hiringSignalInitials(row.companyName || "C")
                          )}
                        </div>
                        <div className="c360-min-w-0">
                          {onOpenCompanyDrawer && row.companyUuid ? (
                            <button
                              type="button"
                              className="c360-block c360-max-w-full c360-truncate c360-text-left c360-font-medium c360-text-ink hover:c360-underline"
                              onClick={() => onOpenCompanyDrawer(row)}
                            >
                              {row.companyName || "—"}
                            </button>
                          ) : (
                            <span className="c360-text-ink">
                              {row.companyName || "—"}
                            </span>
                          )}
                          {row.functionCategory ? (
                            <p className="c360-mt-0-5 c360-text-2xs c360-text-ink-muted">
                              {row.functionCategory}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  ) : null}
                  {vis.has("location") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs c360-text-ink-muted">
                      {row.location || "—"}
                    </td>
                  ) : null}
                  {vis.has("type") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs">
                      <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-1">
                        {row.employmentType ? (
                          <Badge
                            color={employmentTypeBadgeColor(row.employmentType)}
                            size="sm"
                          >
                            {row.employmentType}
                          </Badge>
                        ) : (
                          "—"
                        )}
                        {isRemoteAllowed(row.remoteAllowed) ? (
                          <Badge color="emerald" size="sm">
                            Remote
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                  {vis.has("posted") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs c360-text-ink-muted">
                      {formatPosted(row.postedAt)}
                    </td>
                  ) : null}
                  {vis.has("actions") ? (
                    <td className="c360-px-3 c360-py-2 c360-align-top c360-text-right c360-nowrap">
                      <div className="c360-inline-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-1">
                        <Tooltip content="Job description" placement="top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="c360-gap-1 c360-px-2"
                            onClick={() => onOpenDescription(row)}
                            aria-label="View job description"
                          >
                            <FileText size={14} aria-hidden />
                            JD
                          </Button>
                        </Tooltip>
                        {row.companyUuid ? (
                          <Tooltip
                            content="Company roles (Mongo)"
                            placement="top"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="c360-gap-1 c360-px-2"
                              onClick={() => onOpenCompany(row)}
                              aria-label="Open company roles"
                            >
                              <Building2 size={14} aria-hidden />
                            </Button>
                          </Tooltip>
                        ) : null}
                        <Tooltip
                          content="Connectra profile & people"
                          placement="top"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="c360-gap-1 c360-px-2"
                            onClick={() => onOpenConnectra(row)}
                            aria-label="Open Connectra data"
                          >
                            <Link2 size={14} aria-hidden />
                          </Button>
                        </Tooltip>
                        {row.jobUrl ? (
                          <Tooltip content="Open on LinkedIn" placement="top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              asChild
                              className="c360-p-1.5"
                            >
                              <a
                                href={row.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open job on LinkedIn"
                              >
                                <ExternalLink size={14} aria-hidden />
                              </a>
                            </Button>
                          </Tooltip>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
