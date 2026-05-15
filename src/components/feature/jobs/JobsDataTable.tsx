"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { MoreHorizontal, Loader2, Download } from "lucide-react";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowClassNameParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import type { MappedJob } from "@/lib/jobs/jobsMapper";
import {
  formatJobIdShort,
  isSuccessfulTerminalJobStatus,
  isHireSignalXlsxExportJob,
  canDownloadSchedulerOutput,
  schedulerOutputDownloadLabel,
} from "@/lib/jobs/jobsUtils";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((mod) => mod.DataGrid),
  {
    ssr: false,
    loading: () => (
      <div className="c360-flex c360-items-center c360-justify-center c360-min-h-[240px]">
        <span className="c360-spinner" aria-label="Loading table…" />
      </div>
    ),
  },
) as typeof import("@mui/x-data-grid").DataGrid;

export const JOBS_DT_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
] as const;

/** Toggleable data columns. */
export const JOBS_DT_COLUMN_IDS = [
  "jobRef",
  "started",
  "task",
  "service",
  "category",
  "progress",
  "status",
  "jobId",
  "actions",
] as const;

export type JobsDataTableColumnId = (typeof JOBS_DT_COLUMN_IDS)[number];

export const JOBS_DT_DEFAULT_COLUMNS: JobsDataTableColumnId[] = [
  ...JOBS_DT_COLUMN_IDS,
];

const COL_ID_TO_FIELD: Record<JobsDataTableColumnId, string> = {
  jobRef: "jobRef",
  started: "started",
  task: "task",
  service: "service",
  category: "category",
  progress: "progress",
  status: "status",
  jobId: "jobId",
  actions: "actions",
};

export const JOBS_DT_COLUMN_LABELS: Record<JobsDataTableColumnId, string> = {
  jobRef: "Job ref",
  started: "Started",
  task: "Task",
  service: "Service",
  category: "Category",
  progress: "Progress",
  status: "Status",
  jobId: "Job ID",
  actions: "Action",
};

function hashJobRef(jobId: string): string {
  let h = 0;
  for (let i = 0; i < jobId.length; i++)
    h = (Math.imul(31, h) + jobId.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 90000) + 10000;
  return `#J-${n}`;
}

function formatCheckInDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

function serviceLabel(s: string): string {
  if (s === "email_server") return "Email";
  if (s === "sync_server") return "Sync";
  return s || "—";
}

function categoryLabel(job: MappedJob): string {
  return job.jobSubtype || job.jobFamily || "—";
}

type StatusTone = "danger" | "warning" | "success" | "primary" | "muted";

function statusTone(status: string): StatusTone {
  const s = status.toUpperCase();
  if (s === "FAILED" || s === "CANCELLED") return "danger";
  if (s === "RUNNING" || s === "PAUSED" || s === "PENDING" || s === "OPEN") {
    if (s === "RUNNING") return "primary";
    return "warning";
  }
  if (isSuccessfulTerminalJobStatus(status)) return "success";
  return "muted";
}

function progressBarClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "c360-jobs-dt__progress-fill--success";
    case "danger":
      return "c360-jobs-dt__progress-fill--danger";
    case "warning":
      return "c360-jobs-dt__progress-fill--warning";
    case "primary":
      return "c360-jobs-dt__progress-fill--primary";
    default:
      return "c360-jobs-dt__progress-fill--muted";
  }
}

function progressTrackClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "c360-jobs-dt__progress-track--success";
    case "danger":
      return "c360-jobs-dt__progress-track--danger";
    case "warning":
      return "c360-jobs-dt__progress-track--warning";
    case "primary":
      return "c360-jobs-dt__progress-track--primary";
    default:
      return "c360-jobs-dt__progress-track--muted";
  }
}

function JobsNoRowsOverlay({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4 c360-gap-2">
        <Loader2 size={20} className="c360-spin" />
        <span className="c360-text-sm c360-text-ink-muted">Loading jobs…</span>
      </div>
    );
  }
  return (
    <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4">
      <p className="c360-m-0 c360-text-sm c360-text-ink-muted">
        No jobs match your filters.
      </p>
    </div>
  );
}

export interface JobsDataTableProps {
  jobs: MappedJob[];
  loading?: boolean;
  expandedJobId: string | null;
  onToggleExpand: (jobId: string) => void;
  retryingJobId: string | null;
  onRetry: (jobId: string) => void | Promise<void>;
  onPause: (jobId: string) => void;
  onPauseConnectra: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onTerminateConnectra: (jobId: string) => void;
  onResume: (jobId: string) => void;
  onResumeConnectra: (jobId: string) => void;
  /** Raw S3 object key or HTTPS URL; parent may presign keys via GraphQL. */
  onDownloadOutput: (job: MappedJob) => void | Promise<void>;
  /** Opens global review drawer with this scheduler job prefilled. */
  onOpenJobTicket?: (job: MappedJob) => void;
  renderDetailPanel: (jobId: string) => ReactNode;
  /** When set, pagination footer is portaled into this element (e.g. Card header) instead of below the grid. */
  paginationPortalRef?: RefObject<HTMLDivElement | null>;
  /** When set, the filter + page-size toolbar is portaled into this element (e.g. Card header). */
  tableToolbarPortalRef?: RefObject<HTMLDivElement | null>;
}

export function JobsDataTable({
  jobs,
  loading,
  expandedJobId,
  onToggleExpand,
  retryingJobId,
  onRetry,
  onPause,
  onPauseConnectra,
  onCancel,
  onTerminateConnectra,
  onResume,
  onResumeConnectra,
  onDownloadOutput,
  onOpenJobTicket,
  renderDetailPanel,
  paginationPortalRef,
  tableToolbarPortalRef,
}: JobsDataTableProps) {
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "started", sort: "desc" },
  ]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<JobsDataTableColumnId[]>(
    () => [...JOBS_DT_DEFAULT_COLUMNS],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.jobId.toLowerCase().includes(q) ||
        j.typeLabel.toLowerCase().includes(q) ||
        j.status.toLowerCase().includes(q) ||
        (j.sourceService || "").toLowerCase().includes(q) ||
        (j.jobFamily || "").toLowerCase().includes(q),
    );
  }, [jobs, search]);

  useEffect(() => {
    setPaginationModel((m) => ({ ...m, page: 0 }));
  }, [search]);

  useEffect(() => {
    const ps = Math.max(1, paginationModel.pageSize);
    const pc = Math.max(1, Math.ceil(filtered.length / ps));
    setPaginationModel((m) => {
      const nextPage = Math.min(m.page, pc - 1);
      if (nextPage === m.page) return m;
      return { ...m, page: nextPage };
    });
  }, [filtered.length, paginationModel.pageSize]);

  const vis = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  const columnVisibilityModel = useMemo(() => {
    const m: GridColumnVisibilityModel = {};
    for (const id of JOBS_DT_COLUMN_IDS) {
      m[COL_ID_TO_FIELD[id]] = vis.has(id);
    }
    return m;
  }, [vis]);

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      const next = JOBS_DT_COLUMN_IDS.filter(
        (id) => model[COL_ID_TO_FIELD[id]] !== false,
      );
      if (next.length === 0) return;
      setVisibleColumns(next);
    },
    [],
  );

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(selectedKeys),
    }),
    [selectedKeys],
  );

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      if (model.type === "exclude") {
        const excluded = new Set(Array.from(model.ids, (id) => String(id)));
        const next = new Set<string>();
        for (const row of filtered) {
          if (!excluded.has(row.jobId)) next.add(row.jobId);
        }
        setSelectedKeys(next);
        return;
      }
      setSelectedKeys(new Set(Array.from(model.ids, (id) => String(id))));
    },
    [filtered],
  );

  const expandedJob = useMemo(
    () =>
      expandedJobId
        ? (jobs.find((j) => j.jobId === expandedJobId) ?? null)
        : null,
    [jobs, expandedJobId],
  );

  const [paginationHostEl, setPaginationHostEl] = useState<HTMLElement | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!paginationPortalRef) {
      setPaginationHostEl(null);
      return;
    }
    setPaginationHostEl(paginationPortalRef.current);
  }, [paginationPortalRef]);

  const [tableToolbarHostEl, setTableToolbarHostEl] =
    useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!tableToolbarPortalRef) {
      setTableToolbarHostEl(null);
      return;
    }
    setTableToolbarHostEl(tableToolbarPortalRef.current);
  }, [tableToolbarPortalRef]);

  const columns = useMemo<GridColDef<MappedJob>[]>(() => {
    const cols: GridColDef<MappedJob>[] = [
      {
        field: "jobRef",
        headerName: JOBS_DT_COLUMN_LABELS.jobRef,
        flex: 0,
        width: 104,
        minWidth: 96,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => row.jobId,
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <strong className="c360-jobs-dt__job-ref">
            {hashJobRef(params.row.jobId)}
          </strong>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "started",
        headerName: JOBS_DT_COLUMN_LABELS.started,
        flex: 0,
        width: 152,
        minWidth: 132,
        sortable: true,
        filterable: false,
        type: "dateTime",
        valueGetter: (_v, row) =>
          row.createdAt ? new Date(row.createdAt) : null,
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <span className="c360-jobs-dt__muted">
            {formatCheckInDate(params.row.createdAt)}
          </span>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "task",
        headerName: JOBS_DT_COLUMN_LABELS.task,
        flex: 1,
        minWidth: 140,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => row.typeLabel,
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <button
            type="button"
            className="c360-jobs-dt__task-link"
            onClick={() => onToggleExpand(params.row.jobId)}
          >
            {params.row.typeLabel}
          </button>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "service",
        headerName: JOBS_DT_COLUMN_LABELS.service,
        flex: 0,
        width: 88,
        minWidth: 72,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => serviceLabel(row.sourceService),
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <span className="c360-jobs-dt__muted">
            {serviceLabel(params.row.sourceService)}
          </span>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "category",
        headerName: JOBS_DT_COLUMN_LABELS.category,
        flex: 0,
        width: 120,
        minWidth: 96,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => categoryLabel(row),
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <span className="c360-jobs-dt__muted">
            {categoryLabel(params.row)}
          </span>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "progress",
        headerName: JOBS_DT_COLUMN_LABELS.progress,
        flex: 1,
        minWidth: 140,
        sortable: true,
        filterable: false,
        type: "number",
        valueGetter: (_v, row) => row.progress,
        renderCell: (params: GridRenderCellParams<MappedJob>) => {
          const job = params.row;
          const tone = statusTone(job.status);
          const pct = Math.min(100, Math.max(0, job.progress));
          return (
            <div className="c360-min-w-0 c360-w-full">
              <div
                className={cn(
                  "c360-jobs-dt__progress-track",
                  progressTrackClass(tone),
                )}
              >
                <div
                  ref={(el) =>
                    applyVars(el, {
                      "--c360-jobs-dt-progress-pct": `${pct}%`,
                    })
                  }
                  className={cn(
                    "c360-jobs-dt__progress-fill",
                    progressBarClass(tone),
                  )}
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress ${Math.round(pct)} percent`}
                />
              </div>
              <span className="c360-jobs-dt__progress-meta">
                {job.total > 0
                  ? `${job.processed} / ${job.total}`
                  : isHireSignalXlsxExportJob(job) && pct > 0
                    ? `${Math.round(pct)}%`
                    : job.jobFamily}
              </span>
            </div>
          );
        },
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "status",
        headerName: JOBS_DT_COLUMN_LABELS.status,
        flex: 0,
        width: 168,
        minWidth: 148,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => row.status,
        renderCell: (params: GridRenderCellParams<MappedJob>) => {
          const job = params.row;
          const tone = statusTone(job.status);
          const pct = Math.min(100, Math.max(0, job.progress));
          const pctLabel = `${Math.round(pct)}%`;
          return (
            <div className="c360-jobs-dt__status-wrap">
              <span
                className={cn(
                  "c360-jobs-dt__pill",
                  `c360-jobs-dt__pill--${tone}`,
                )}
              >
                <span className="c360-jobs-dt__pill-dot" aria-hidden />
                {job.status}
              </span>
              <span
                className={cn(
                  "c360-jobs-dt__label-badge",
                  `c360-jobs-dt__label-badge--${tone}`,
                )}
              >
                {pctLabel}
              </span>
            </div>
          );
        },
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "jobId",
        headerName: JOBS_DT_COLUMN_LABELS.jobId,
        flex: 0,
        width: 120,
        minWidth: 96,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => row.jobId,
        renderCell: (params: GridRenderCellParams<MappedJob>) => (
          <span
            className="c360-jobs-dt__mono c360-text-xs"
            title={params.row.jobId}
          >
            {formatJobIdShort(params.row.jobId)}
          </span>
        ),
        cellClassName: "c360-jobs-grid-cell--center",
      },
      {
        field: "actions",
        headerName: JOBS_DT_COLUMN_LABELS.actions,
        flex: 0,
        width: 200,
        minWidth: 160,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<MappedJob>) => {
          const job = params.row;
          const expanded = expandedJobId === job.jobId;
          return (
            <div className="c360-flex c360-items-center c360-justify-end c360-gap-1 c360-flex-nowrap">
              {canDownloadSchedulerOutput(job) && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="c360-whitespace-nowrap"
                  leftIcon={<Download size={14} />}
                  aria-label={`${schedulerOutputDownloadLabel(job)} via presigned URL`}
                  title="Presigned download for job output"
                  onClick={() => void onDownloadOutput(job)}
                >
                  {schedulerOutputDownloadLabel(job)}
                </Button>
              )}
              <Popover
                align="end"
                width={220}
                trigger={
                  <button
                    type="button"
                    className="c360-jobs-dt__action-btn"
                    aria-label={`Actions for ${job.typeLabel}`}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                }
                content={
                  <div className="c360-jobs-dt__menu">
                    {canDownloadSchedulerOutput(job) && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--primary"
                        onClick={() => void onDownloadOutput(job)}
                      >
                        {schedulerOutputDownloadLabel(job)}
                      </button>
                    )}
                    <button
                      type="button"
                      className="c360-jobs-dt__menu-item"
                      onClick={() => onToggleExpand(job.jobId)}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </button>
                    {onOpenJobTicket && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item"
                        onClick={() => onOpenJobTicket(job)}
                      >
                        Report issue (ticket)
                      </button>
                    )}
                    {job.canPause && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item"
                        onClick={() => onPause(job.jobId)}
                      >
                        Pause
                      </button>
                    )}
                    {job.canPauseConnectra && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item"
                        onClick={() => onPauseConnectra(job.jobId)}
                      >
                        Pause (sync)
                      </button>
                    )}
                    {job.status === "PAUSED" &&
                      job.sourceService === "email_server" && (
                        <button
                          type="button"
                          className="c360-jobs-dt__menu-item"
                          onClick={() => onResume(job.jobId)}
                        >
                          Resume
                        </button>
                      )}
                    {job.canResumeConnectra && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item"
                        onClick={() => onResumeConnectra(job.jobId)}
                      >
                        Resume (sync)
                      </button>
                    )}
                    {job.canCancel && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--danger"
                        onClick={() => onCancel(job.jobId)}
                      >
                        Cancel
                      </button>
                    )}
                    {job.canTerminateConnectra && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--danger"
                        onClick={() => onTerminateConnectra(job.jobId)}
                      >
                        Terminate (sync)
                      </button>
                    )}
                    {job.canRetry && (
                      <button
                        type="button"
                        className="c360-jobs-dt__menu-item"
                        disabled={retryingJobId === job.jobId}
                        onClick={() => void onRetry(job.jobId)}
                      >
                        {retryingJobId === job.jobId ? "Retrying…" : "Retry"}
                      </button>
                    )}
                  </div>
                }
              />
            </div>
          );
        },
        cellClassName: "c360-jobs-grid-cell--center",
      },
    ];
    return cols;
  }, [
    expandedJobId,
    onCancel,
    onDownloadOutput,
    onOpenJobTicket,
    onPause,
    onPauseConnectra,
    onResume,
    onResumeConnectra,
    onRetry,
    onTerminateConnectra,
    onToggleExpand,
    retryingJobId,
  ]);

  const showLoadingOverlay = Boolean(loading && jobs.length === 0);

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / Math.max(1, paginationModel.pageSize)),
  );
  const safePage = Math.min(paginationModel.page, pageCount - 1);

  const getRowClassName = useCallback(
    (params: GridRowClassNameParams<MappedJob>) =>
      expandedJobId === params.row.jobId ? "c360-jobs-dt__row--expanded" : "",
    [expandedJobId],
  );

  const tableToolbar = (
    <div className="c360-jobs-dt__toolbar">
      <div className="c360-jobs-dt__toolbar-left">
        <Select
          className="c360-w-24"
          fullWidth={false}
          aria-label="Rows per page"
          value={String(paginationModel.pageSize)}
          onChange={(e) =>
            setPaginationModel({
              page: 0,
              pageSize: Number(e.target.value) || 10,
            })
          }
          options={[...JOBS_DT_PAGE_SIZE_OPTIONS]}
        />
      </div>
      <div className="c360-jobs-dt__toolbar-right">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter jobs…"
          aria-label="Filter jobs"
          className="c360-jobs-dt__search"
        />
      </div>
    </div>
  );

  const paginationFooter = (
    <div
      className={cn(
        "c360-jobs-dt__footer",
        paginationPortalRef && "c360-jobs-dt__footer--portal",
      )}
    >
      <Pagination
        className="c360-jobs-dt__pager"
        total={filtered.length}
        page={safePage + 1}
        pageSize={paginationModel.pageSize}
        onPageChange={(p) =>
          setPaginationModel((m) => ({
            ...m,
            page: Math.min(pageCount - 1, Math.max(0, p - 1)),
          }))
        }
      />
    </div>
  );

  return (
    <div className="c360-jobs-dt">
      {!tableToolbarPortalRef ? tableToolbar : null}

      <C360DataTableShell>
        <C360MuiThemeProvider>
          <div className="c360-jobs-data-grid c360-min-h-[320px] c360-w-full">
            <DataGrid
              rows={filtered}
              columns={columns}
              getRowId={(row) => row.jobId}
              checkboxSelection
              disableRowSelectionExcludeModel
              disableRowSelectionOnClick
              keepNonExistentRowsSelected
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              sortingMode="client"
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              paginationMode="client"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50, 100]}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              disableColumnFilter
              hideFooter
              loading={showLoadingOverlay}
              getRowClassName={getRowClassName}
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => 72}
              columnHeaderHeight={44}
              density="comfortable"
              showColumnVerticalBorder
              slots={{
                noRowsOverlay: () => (
                  <JobsNoRowsOverlay
                    loading={Boolean(loading && jobs.length === 0)}
                  />
                ),
              }}
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
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-cell.c360-jobs-grid-cell--center": {
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                },
                "& .MuiDataGrid-row": {
                  maxHeight: "none !important",
                },
                "& .MuiDataGrid-row.c360-jobs-dt__row--expanded": {
                  background:
                    "var(--c360-surface-hover, rgba(0, 0, 0, 0.04)) !important",
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

      {expandedJob ? (
        <div className="c360-px-1 c360-pb-2">
          {renderDetailPanel(expandedJob.jobId)}
        </div>
      ) : null}

      {paginationPortalRef && paginationHostEl
        ? createPortal(paginationFooter, paginationHostEl)
        : !paginationPortalRef
          ? paginationFooter
          : null}
      {tableToolbarPortalRef && tableToolbarHostEl
        ? createPortal(tableToolbar, tableToolbarHostEl)
        : null}
    </div>
  );
}
