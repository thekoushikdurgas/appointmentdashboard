"use client";

import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Building2,
  Columns3,
  ExternalLink,
  FileText,
  Link2,
} from "lucide-react";
import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridRenderCellParams,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tooltip } from "@/components/ui/Tooltip";
import { Popover } from "@/components/ui/Popover";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  employmentTypeBadgeColor,
  hiringSignalInitials,
  hiringSignalRowKey,
  formatHireSignalPostedDate,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

import type {
  JobListFilters,
  JobListSortKey,
  JobListSortOrder,
} from "@/services/graphql/hiringSignalService";

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

export type HiringSignalsSortableColumnId = Exclude<
  HiringSignalsDataTableColumnId,
  "actions"
>;

/** Maps visible column id → job.server / Mongo sort field. */
export const HS_DT_COLUMN_SORT_MAP: Record<
  HiringSignalsSortableColumnId,
  JobListSortKey
> = {
  title: "title",
  company: "company_name",
  location: "location",
  type: "employment_type",
  posted: "posted_at",
};

const SORT_KEY_TO_GRID_FIELD = (
  Object.entries(HS_DT_COLUMN_SORT_MAP) as [
    HiringSignalsSortableColumnId,
    JobListSortKey,
  ][]
).reduce<Partial<Record<JobListSortKey, HiringSignalsSortableColumnId>>>(
  (acc, [field, key]) => {
    acc[key] = field;
    return acc;
  },
  {},
);

const DEFAULT_SORT_KEY: JobListSortKey = "posted_at";
const DEFAULT_SORT_ORDER: JobListSortOrder = "desc";

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

/** Prefer geo string; when LinkedIn omits location, show workplace types (Remote/Hybrid) if present. */
function displayLocationForRow(row: LinkedInJobRow): string {
  const geo = row.location?.trim();
  if (geo) return geo;
  const wt = row.workplaceTypes?.filter(Boolean) ?? [];
  if (wt.length) return wt.join(", ");
  return "—";
}

function gridSortModelFromListFilters(f: JobListFilters): GridSortModel {
  const sk = f.sortKey ?? DEFAULT_SORT_KEY;
  const so = f.sortOrder ?? DEFAULT_SORT_ORDER;
  const field = SORT_KEY_TO_GRID_FIELD[sk] ?? "posted";
  return [{ field, sort: so }];
}

export interface HiringSignalsToolbarTableExtrasProps {
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  visibleColumns: HiringSignalsDataTableColumnId[];
  onToggleColumn: (
    id: HiringSignalsDataTableColumnId,
    visible: boolean,
  ) => void;
}

/** Columns popover + page size — intended for `DataToolbar` `actionPrefix` on hiring signals. */
export function HiringSignalsToolbarTableExtras({
  pageSize,
  onPageSizeChange,
  visibleColumns,
  onToggleColumn,
}: HiringSignalsToolbarTableExtrasProps) {
  const vis = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  return (
    <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
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
      <span className="c360-text-2xs c360-text-ink-muted">Per page</span>
      <Select
        className="c360-w-24"
        fullWidth={false}
        value={String(pageSize)}
        onChange={(e) => onPageSizeChange(Number(e.target.value) || 25)}
        options={PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}

/** Logo with fallback to initials when URL fails or returns a broken asset (avoids thin strips in cells). */
function HiringSignalsCompanyAvatar({
  logoUrl,
  companyName,
}: {
  logoUrl?: string | null;
  companyName?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const raw = logoUrl?.trim();
  const showImg = Boolean(raw && !imgFailed);

  return (
    <div className="c360-hs-avatar c360-hs-grid-company-avatar" aria-hidden>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote URLs from raw_payload / ingest
        <img
          src={proxiedCompanyLogoSrc(raw!)}
          alt=""
          className="c360-h-full c360-w-full c360-object-cover"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="c360-hs-grid-company-avatar__initials">
          {hiringSignalInitials(companyName || "C")}
        </span>
      )}
    </div>
  );
}

function HiringSignalsNoRowsOverlay() {
  return (
    <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4">
      <p className="c360-table__empty c360-m-0 c360-text-sm c360-text-ink-muted">
        No job rows yet. Run a scrape from job.server or check filters.
      </p>
    </div>
  );
}

export interface HiringSignalsDataTableProps {
  rows: LinkedInJobRow[];
  loading?: boolean;
  onOpenDescription: (row: LinkedInJobRow) => void;
  onOpenCompany: (row: LinkedInJobRow) => void;
  onOpenConnectra: (row: LinkedInJobRow) => void;
  /** Slide-over company panel (prototype-style). */
  onOpenCompanyDrawer?: (row: LinkedInJobRow) => void;
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  density?: "comfortable" | "compact";
  visibleColumns?: HiringSignalsDataTableColumnId[];
  /** Applied list filters (includes toolbar preset merged posted range). */
  listFilters: JobListFilters;
  setListFilters: Dispatch<SetStateAction<JobListFilters>>;
  /** Total matching rows from server (required for server pagination alignment). */
  totalRowCount: number;
  /** Keeps toolbar column checkboxes in sync with DataGrid column menu / panel. */
  onColumnVisibilityResolved?: (
    columns: HiringSignalsDataTableColumnId[],
  ) => void;
  className?: string;
}

export function HiringSignalsDataTable({
  rows,
  loading,
  onOpenDescription,
  onOpenCompany,
  onOpenConnectra,
  onOpenCompanyDrawer,
  selectedKeys,
  onSelectionChange,
  density = "comfortable",
  visibleColumns = HS_DT_DEFAULT_COLUMNS,
  listFilters,
  setListFilters,
  totalRowCount,
  onColumnVisibilityResolved,
  className,
}: HiringSignalsDataTableProps) {
  const vis = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  const columnVisibilityModel = useMemo(() => {
    const m: GridColumnVisibilityModel = {};
    for (const id of HS_DT_COLUMN_IDS) {
      m[id] = vis.has(id);
    }
    return m;
  }, [vis]);

  /** Deps must not be whole `listFilters` — offset-only updates would rebuild this array, MUI can fire `onSortModelChange`, and our handler resets `offset` to 0 (snap back to page 1). */
  const sortModel = useMemo(
    () => gridSortModelFromListFilters(listFilters),
    [listFilters.sortKey, listFilters.sortOrder],
  );

  const limit = listFilters.limit ?? 25;
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({
      page: Math.floor((listFilters.offset ?? 0) / Math.max(1, limit)),
      pageSize: limit,
    }),
    [listFilters.offset, limit],
  );

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      const pageSize = Math.max(1, Math.floor(Number(model.pageSize) || 25));
      const page = Math.max(0, Math.floor(Number(model.page) || 0));
      setListFilters((f) => ({
        ...f,
        offset: page * pageSize,
        limit: pageSize,
      }));
    },
    [setListFilters],
  );

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(Array.from(selectedKeys)),
    }),
    [selectedKeys],
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      const first = model[0];
      if (!first?.sort) {
        setListFilters((f) => ({
          ...f,
          sortKey: DEFAULT_SORT_KEY,
          sortOrder: DEFAULT_SORT_ORDER,
          offset: 0,
        }));
        return;
      }
      const field = first.field as HiringSignalsSortableColumnId;
      const sortKey = HS_DT_COLUMN_SORT_MAP[field];
      if (!sortKey) return;
      setListFilters((f) => ({
        ...f,
        sortKey,
        sortOrder: first.sort as JobListSortOrder,
        offset: 0,
      }));
    },
    [setListFilters],
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      const next = HS_DT_COLUMN_IDS.filter((id) => model[id] !== false);
      if (next.length === 0) return;
      onColumnVisibilityResolved?.(next);
    },
    [onColumnVisibilityResolved],
  );

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      // MUI X may use `exclude` + empty ids for "select all" when exclude-model optimization is on.
      // Parent state is a flat Set of row keys — translate both models (see toggleAllRows in useGridRowSelection).
      if (model.type === "exclude") {
        if (model.ids.size === 0) {
          onSelectionChange(new Set(rows.map((r) => hiringSignalRowKey(r))));
          return;
        }
        const excluded = new Set(Array.from(model.ids, (id) => String(id)));
        const next = new Set<string>();
        for (const row of rows) {
          const k = hiringSignalRowKey(row);
          if (!excluded.has(k)) {
            next.add(k);
          }
        }
        onSelectionChange(next);
        return;
      }
      onSelectionChange(new Set(Array.from(model.ids, (id) => String(id))));
    },
    [onSelectionChange, rows],
  );

  const columns = useMemo<GridColDef<LinkedInJobRow>[]>(() => {
    const badgeSize = density === "compact" ? "sm" : "md";
    const iconSz = density === "compact" ? 14 : 16;

    const cols: GridColDef<LinkedInJobRow>[] = [
      {
        field: "title",
        headerName: COL_LABELS.title,
        flex: 1.5,
        minWidth: 240,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => {
          const row = params.row;
          if (density === "compact") {
            return (
              <span
                className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink"
                title={row.title || undefined}
              >
                {row.title || "—"}
              </span>
            );
          }
          return (
            <div className="c360-hs-grid-title-stack">
              <div className="c360-hs-grid-title-stack__row">
                <span
                  className="c360-hs-grid-title-stack__title c360-min-w-0 c360-font-medium c360-text-ink"
                  title={row.title || undefined}
                >
                  {row.title || "—"}
                </span>
                <Tooltip content="Job description" placement="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="c360-hs-grid-title-stack__jd c360-shrink-0 c360-gap-1 c360-px-2"
                    onClick={() => onOpenDescription(row)}
                    aria-label="View job description"
                  >
                    <FileText size={16} aria-hidden />
                    JD
                  </Button>
                </Tooltip>
              </div>
              {row.seniority ? (
                <p className="c360-hs-grid-title-stack__meta">
                  {row.seniority}
                </p>
              ) : null}
            </div>
          );
        },
        cellClassName:
          density === "compact"
            ? "c360-hs-grid-cell--center"
            : "c360-hs-grid-cell--top",
      },
      {
        field: "company",
        headerName: COL_LABELS.company,
        flex: 1.25,
        minWidth: 200,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => {
          const row = params.row;
          if (density === "compact") {
            return onOpenCompanyDrawer && row.companyUuid ? (
              <button
                type="button"
                className="c360-hs-table__company-link c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
                onClick={() => onOpenCompanyDrawer(row)}
              >
                {row.companyName || "—"}
              </button>
            ) : (
              <span className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink">
                {row.companyName || "—"}
              </span>
            );
          }
          return (
            <div className="c360-hs-grid-company-cell">
              <HiringSignalsCompanyAvatar
                logoUrl={row.companyLogoUrl}
                companyName={row.companyName}
              />
              <div className="c360-min-w-0 c360-flex-1">
                {onOpenCompanyDrawer && row.companyUuid ? (
                  <button
                    type="button"
                    className="c360-hs-table__company-link c360-block c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
                    onClick={() => onOpenCompanyDrawer(row)}
                  >
                    {row.companyName || "—"}
                  </button>
                ) : (
                  <span className="c360-text-sm c360-font-medium c360-text-ink">
                    {row.companyName || "—"}
                  </span>
                )}
                {row.functionCategory ? (
                  <p className="c360-m-0 c360-mt-0-5 c360-text-xs c360-text-ink-muted">
                    {row.functionCategory}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
        cellClassName:
          density === "compact"
            ? "c360-hs-grid-cell--center"
            : "c360-hs-grid-cell--top",
      },
      {
        field: "location",
        headerName: COL_LABELS.location,
        flex: 1,
        minWidth: 140,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <span className="c360-hs-grid-meta-text">
            {displayLocationForRow(params.row)}
          </span>
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "type",
        headerName: COL_LABELS.type,
        flex: 0,
        width: 168,
        minWidth: 148,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => {
          const row = params.row;
          return (
            <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
              {row.employmentType ? (
                <Badge
                  color={employmentTypeBadgeColor(row.employmentType)}
                  size={badgeSize}
                >
                  {row.employmentType}
                </Badge>
              ) : (
                <span className="c360-text-xs c360-text-ink-muted">—</span>
              )}
              {isRemoteAllowed(row.remoteAllowed) ? (
                <Badge color="emerald" size={badgeSize}>
                  Remote
                </Badge>
              ) : null}
            </div>
          );
        },
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "posted",
        headerName: COL_LABELS.posted,
        flex: 0,
        width: 128,
        minWidth: 118,
        sortable: true,
        filterable: false,
        type: "dateTime",
        valueGetter: (_value, row) =>
          row.postedAt ? new Date(row.postedAt) : null,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <span className="c360-hs-grid-meta-text">
            {formatHireSignalPostedDate(params.row.postedAt, {
              withTime: false,
              emptyAsDash: true,
            })}
          </span>
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "actions",
        headerName: COL_LABELS.actions,
        flex: 0,
        width: 156,
        minWidth: 152,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => {
          const row = params.row;
          return (
            <div
              className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end"
              role="group"
              aria-label={`Actions for ${row.title || "job"}`}
            >
              {row.companyUuid ? (
                <Tooltip content="Company roles (Mongo)" placement="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="c360-hs-grid-action-btn c360-gap-1 c360-px-2"
                    onClick={() => onOpenCompany(row)}
                    aria-label="Open company roles"
                  >
                    <Building2 size={iconSz} aria-hidden />
                  </Button>
                </Tooltip>
              ) : null}
              <Tooltip content="Connectra profile & people" placement="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="c360-hs-grid-action-btn c360-gap-1 c360-px-2"
                  onClick={() => onOpenConnectra(row)}
                  aria-label="Open Connectra data"
                >
                  <Link2 size={iconSz} aria-hidden />
                </Button>
              </Tooltip>
              {row.jobUrl ? (
                <Tooltip content="Open on LinkedIn" placement="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    asChild
                    className="c360-hs-grid-action-btn c360-p-2"
                  >
                    <a
                      href={row.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open job on LinkedIn"
                    >
                      <ExternalLink size={iconSz} aria-hidden />
                    </a>
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          );
        },
        cellClassName: "c360-hs-grid-cell--center",
      },
    ];
    return cols;
  }, [
    density,
    onOpenCompany,
    onOpenCompanyDrawer,
    onOpenConnectra,
    onOpenDescription,
  ]);

  /** Show overlay on any refetch so server pagination never looks "stuck" on the previous page. */
  const showLoadingOverlay = Boolean(loading);

  return (
    <div className={cn("c360-w-full c360-min-w-0", className)}>
      <C360DataTableShell>
        <C360MuiThemeProvider>
          <div
            className={cn(
              "c360-hs-data-grid c360-min-h-[320px] c360-w-full",
              density === "compact" && "c360-hs-data-grid--compact",
            )}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => hiringSignalRowKey(row)}
              checkboxSelection
              /** Forces include-model select-all; otherwise MUI uses exclude+empty ids and controlled parents that only forward `ids` see an empty selection. */
              disableRowSelectionExcludeModel
              disableRowSelectionOnClick
              keepNonExistentRowsSelected
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              sortingMode="server"
              sortingOrder={["asc", "desc"]}
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              paginationMode="server"
              rowCount={totalRowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              disableColumnFilter
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              hideFooter
              loading={showLoadingOverlay}
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => (density === "compact" ? 56 : 80)}
              columnHeaderHeight={44}
              density={density === "compact" ? "compact" : "comfortable"}
              slots={{
                noRowsOverlay: HiringSignalsNoRowsOverlay,
              }}
              showColumnVerticalBorder
              sx={(theme) => ({
                border: "none",
                borderRadius: 0,
                fontFamily: "inherit",
                "& .MuiDataGrid-columnHeaders": {
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(148, 163, 184, 0.14)",
                },
                "& .MuiDataGrid-columnHeader": {},
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-cell.c360-hs-grid-cell--top": {
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                "& .MuiDataGrid-cell[data-field='company']": {
                  justifyContent:
                    density === "compact" ? "flex-start" : "center",
                },
                "& .MuiDataGrid-cell[data-field='location']": {
                  flexDirection: "column",
                  justifyContent: "center",
                },
                "& .MuiDataGrid-cell[data-field='type']": {
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                "& .MuiDataGrid-row": {
                  maxHeight: "none !important",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "none",
                },
              })}
              autoHeight
            />
          </div>
        </C360MuiThemeProvider>
      </C360DataTableShell>
    </div>
  );
}
