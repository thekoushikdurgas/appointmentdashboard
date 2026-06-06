"use client";

import {
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useViewportFillHeight } from "@/hooks/useViewportFillHeight";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { Select } from "@/components/ui/Select";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import { C360DataGrid as DataGrid } from "@/components/ui/C360DataGrid";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { hiringSignalRowKey } from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { getHiringSignalsDataGridSx } from "@/components/feature/hiring-signals/hiringSignalsDataGridTheme";
import {
  HiringSignalsJobActionsCellMain,
  HiringSignalsJobCompanyCellComfortable,
  HiringSignalsJobCompanyCellCompact,
  HiringSignalsJobLocationCell,
  HiringSignalsJobPostedCell,
  HiringSignalsJobTitleCellComfortable,
  HiringSignalsJobTitleCellCompact,
  HiringSignalsJobTypeBadgesCell,
} from "@/components/feature/hiring-signals/hiringSignalsGridCells";

import {
  DEFAULT_JOB_SORT_KEY,
  DEFAULT_JOB_SORT_ORDER,
  type JobListFilters,
  type JobListSortKey,
  type JobListSortOrder,
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

function jobListFiltersRestrictResults(f: JobListFilters): boolean {
  return Boolean(
    f.titles?.length ||
    f.companies?.length ||
    f.locations?.length ||
    f.excludedTitles?.length ||
    f.excludedCompanies?.length ||
    f.excludedLocations?.length ||
    f.companyFunding?.length ||
    f.excludedCompanyFunding?.length ||
    f.companyRevenue?.length ||
    f.excludedCompanyRevenue?.length ||
    f.companyCountries?.length ||
    f.excludedCompanyCountries?.length ||
    f.companyIndustries?.length ||
    f.excludedCompanyIndustries?.length ||
    f.companyEmployeeSizes?.length ||
    f.excludedCompanyEmployeeSizes?.length ||
    f.companyMissingWebsite ||
    f.companyMissingRevenue ||
    f.companyCsuiteContactMinCount != null ||
    f.companyHrContactMinCount != null ||
    f.employmentType ||
    f.employmentTypes?.length ||
    f.seniority ||
    f.functionCategory ||
    f.postedAfter ||
    f.postedBefore ||
    f.runId ||
    f.workplaceTypes?.length ||
    f.industries?.length ||
    f.excludedIndustries?.length ||
    f.countries?.length ||
    f.applyMethod ||
    f.salaryMin != null ||
    f.salaryMax != null ||
    f.experienceBuckets?.length ||
    f.roleTracks?.length ||
    f.educationLevelMins?.length ||
    (f.clearanceMode && f.clearanceMode !== "allow") ||
    f.h1bOnly ||
    f.skillsAll?.length ||
    f.hideApplied,
  );
}

function HiringSignalsNoRowsOverlay({
  filtered,
  todaysJobsTab,
  onViewAllSignals,
  onClearPostedRange,
}: {
  filtered: boolean;
  todaysJobsTab?: boolean;
  onViewAllSignals?: () => void;
  onClearPostedRange?: () => void;
}) {
  const title = todaysJobsTab
    ? "No jobs posted today"
    : filtered
      ? "No jobs match your filters"
      : "No jobs yet";

  const hint = todaysJobsTab
    ? "Today's jobs shows roles with a posted date of today. Try all signals or adjust the date posted filter in the sidebar."
    : filtered
      ? "Clear or broaden filters in the sidebar to see more results."
      : "Run a scrape from job.server or check that your filters are not too narrow.";

  const showViewAll = Boolean(todaysJobsTab && onViewAllSignals);
  const showClearDates =
    Boolean(filtered && onClearPostedRange) && !todaysJobsTab;

  return (
    <div className="c360-hs-empty-overlay">
      <div className="c360-hs-empty-overlay__inner">
        <span className="c360-hs-empty-overlay__icon" aria-hidden>
          <Briefcase size={28} strokeWidth={1.5} />
        </span>
        <p className="c360-hs-empty-overlay__title">{title}</p>
        <p className="c360-hs-empty-overlay__hint">{hint}</p>
        {showViewAll || showClearDates ? (
          <div className="c360-hs-empty-overlay__actions">
            {showViewAll ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onViewAllSignals}
              >
                View all signals
              </Button>
            ) : null}
            {showClearDates ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearPostedRange}
              >
                Clear date filter
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function gridSortModelFromListFilters(f: JobListFilters): GridSortModel {
  const sk = f.sortKey ?? DEFAULT_JOB_SORT_KEY;
  const so = f.sortOrder ?? DEFAULT_JOB_SORT_ORDER;
  const field = SORT_KEY_TO_GRID_FIELD[sk] ?? "posted";
  return [{ field, sort: so }];
}

export interface HiringSignalsToolbarTableExtrasProps {
  pageSize: number;
  onPageSizeChange: (n: number) => void;
}

/** Page size — intended for `DataToolbar` `actionPrefix` on hiring signals. */
export function HiringSignalsToolbarTableExtras({
  pageSize,
  onPageSizeChange,
}: HiringSignalsToolbarTableExtrasProps) {
  return (
    <div className="c360-hs-toolbar-page-size">
      <span className="c360-hs-toolbar-page-size__label">Per page</span>
      <Select
        className="c360-hs-toolbar-page-size__select"
        fullWidth={false}
        inputSize="sm"
        value={String(pageSize)}
        onChange={(e) => onPageSizeChange(Number(e.target.value) || 25)}
        options={PAGE_SIZE_OPTIONS}
      />
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
  /** Toolbar "Today's jobs" tab — shapes empty-state copy and primary CTA. */
  todaysJobsTab?: boolean;
  onViewAllSignals?: () => void;
  onClearPostedRange?: () => void;
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
  todaysJobsTab,
  onViewAllSignals,
  onClearPostedRange,
  className,
}: HiringSignalsDataTableProps) {
  const tablePanelRef = useRef<HTMLDivElement>(null);
  useViewportFillHeight(tablePanelRef);

  const filteredEmpty = jobListFiltersRestrictResults(listFilters);
  const NoRowsOverlay = useCallback(
    () => (
      <HiringSignalsNoRowsOverlay
        filtered={filteredEmpty}
        todaysJobsTab={todaysJobsTab}
        onViewAllSignals={onViewAllSignals}
        onClearPostedRange={onClearPostedRange}
      />
    ),
    [filteredEmpty, onClearPostedRange, onViewAllSignals, todaysJobsTab],
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see block comment above (sort fields only)
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
          sortKey: DEFAULT_JOB_SORT_KEY,
          sortOrder: DEFAULT_JOB_SORT_ORDER,
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
            return <HiringSignalsJobTitleCellCompact row={row} />;
          }
          return (
            <HiringSignalsJobTitleCellComfortable
              row={row}
              onOpenDescription={onOpenDescription}
            />
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
            return (
              <HiringSignalsJobCompanyCellCompact
                row={row}
                onOpenCompanyDrawer={onOpenCompanyDrawer}
              />
            );
          }
          return (
            <HiringSignalsJobCompanyCellComfortable
              row={row}
              onOpenCompanyDrawer={onOpenCompanyDrawer}
            />
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
          <HiringSignalsJobLocationCell row={params.row} />
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
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobTypeBadgesCell
            row={params.row}
            badgeSize={badgeSize}
          />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "posted",
        headerName: COL_LABELS.posted,
        flex: 0,
        width: 118,
        minWidth: 108,
        sortable: true,
        /**
         * MUI: first sort on a column uses `sortingOrder[0]` (see getNextGridSortDirection).
         * Job boards expect newest-first on Posted when the user activates this column.
         */
        sortingOrder: ["desc", "asc"],
        filterable: false,
        type: "dateTime",
        valueGetter: (_value, row) =>
          row.postedAt ? new Date(row.postedAt) : null,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobPostedCell
            row={params.row}
            showTime={density !== "compact"}
          />
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
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobActionsCellMain
            row={params.row}
            iconSz={iconSz}
            onOpenCompany={onOpenCompany}
            onOpenConnectra={onOpenConnectra}
          />
        ),
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
    <div
      ref={tablePanelRef}
      className={cn(
        "c360-hs-signals-table-panel c360-w-full c360-min-w-0",
        className,
      )}
    >
      <C360DataTableShell>
        <C360MuiThemeProvider>
          <div
            className={cn(
              "c360-hs-data-grid c360-w-full",
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
                noRowsOverlay: NoRowsOverlay,
              }}
              showColumnVerticalBorder
              sx={getHiringSignalsDataGridSx(density)}
            />
          </div>
        </C360MuiThemeProvider>
      </C360DataTableShell>
    </div>
  );
}
