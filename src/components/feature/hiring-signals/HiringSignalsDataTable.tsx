"use client";

import { FileText, Building2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

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

export interface HiringSignalsDataTableProps {
  rows: LinkedInJobRow[];
  loading?: boolean;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  onOpenDescription: (row: LinkedInJobRow) => void;
  onOpenCompany: (row: LinkedInJobRow) => void;
  className?: string;
}

export function HiringSignalsDataTable({
  rows,
  loading,
  pageSize,
  onPageSizeChange,
  onOpenDescription,
  onOpenCompany,
  className,
}: HiringSignalsDataTableProps) {
  return (
    <div className={cn("c360-w-full c360-min-w-0 c360-space-y-3", className)}>
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-2">
        <span className="c360-text-2xs c360-text-ink-muted">Per page</span>
        <Select
          className="c360-w-24"
          fullWidth={false}
          value={String(pageSize)}
          onChange={(e) => onPageSizeChange(Number(e.target.value) || 25)}
          options={PAGE_SIZE_OPTIONS}
        />
      </div>

      <div className="c360-overflow-x-auto c360-rounded-md c360-border c360-border-ink-8">
        <table className="c360-w-full c360-text-left c360-text-sm">
          <thead className="c360-border-b c360-border-ink-8 c360-bg-ink-4/40">
            <tr>
              <th className="c360-px-3 c360-py-2 c360-font-medium">Title</th>
              <th className="c360-px-3 c360-py-2 c360-font-medium">Company</th>
              <th className="c360-px-3 c360-py-2 c360-font-medium">Location</th>
              <th className="c360-px-3 c360-py-2 c360-font-medium">Type</th>
              <th className="c360-px-3 c360-py-2 c360-font-medium">Posted</th>
              <th className="c360-px-3 c360-py-2 c360-w-px c360-text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="c360-px-3 c360-py-8 c360-text-center c360-text-ink-muted"
                >
                  <span className="c360-inline-flex c360-items-center c360-gap-2">
                    <Loader2
                      className="c360-animate-spin"
                      size={18}
                      aria-hidden
                    />
                    Loading roles…
                  </span>
                </td>
              </tr>
            ) : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="c360-px-3 c360-py-10 c360-text-center c360-text-ink-muted"
                >
                  No job rows yet. Run a scrape from job.server or check
                  filters.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr
                key={row.id || row.linkedinJobId + row.apifyItemId}
                className="c360-border-b c360-border-ink-8 c360-last:c360-border-0 hover:c360-bg-ink-2/30"
              >
                <td className="c360-px-3 c360-py-2 c360-align-top c360-font-medium c360-text-ink">
                  <span className="c360-line-clamp-2">{row.title || "—"}</span>
                </td>
                <td className="c360-px-3 c360-py-2 c360-align-top c360-text-ink-muted">
                  {row.companyName || "—"}
                </td>
                <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs c360-text-ink-muted">
                  {row.location || "—"}
                </td>
                <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs">
                  {row.employmentType || "—"}
                </td>
                <td className="c360-px-3 c360-py-2 c360-align-top c360-text-2xs c360-text-ink-muted">
                  {formatPosted(row.postedAt)}
                </td>
                <td className="c360-px-3 c360-py-2 c360-align-top c360-text-right c360-nowrap c360-space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="c360-gap-1 c360-px-2"
                    onClick={() => onOpenDescription(row)}
                    title="View description"
                  >
                    <FileText size={14} />
                    JD
                  </Button>
                  {row.companyUuid ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="c360-gap-1 c360-px-2"
                      onClick={() => onOpenCompany(row)}
                      title="Company roles"
                    >
                      <Building2 size={14} />
                    </Button>
                  ) : null}
                  {row.jobUrl ? (
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
                        title="Open LinkedIn"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
