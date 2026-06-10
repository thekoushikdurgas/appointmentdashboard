"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Columns3, ExternalLink, Users } from "lucide-react";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/shared/Skeleton";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import { C360DataGrid as DataGrid } from "@/components/ui/C360DataGrid";
import { formatDisplayLabel } from "@/lib/displayText";
import { cn, formatDateTime, formatCompact } from "@/lib/utils";
import { parseOperationError } from "@/lib/errorParser";
import type { Company } from "@/services/graphql/companiesService";
import { CompanyLogoThumb } from "@/components/feature/companies/CompanyLogoThumb";
import { stashCompanyRowForDetail } from "@/lib/rowSession";
import {
  COL_ID_TO_FIELD,
  COMPANIES_DT_COLUMN_IDS,
  COMPANIES_DT_COLUMN_LABELS,
  COMPANIES_DT_DEFAULT_COLUMNS,
  COMPANIES_DT_PAGE_SIZE_OPTIONS,
  type CompaniesDataTableColumnId,
} from "@/components/feature/companies/companiesTableModel";

export {
  COMPANIES_DT_COLUMN_IDS,
  COMPANIES_DT_COLUMN_LABELS,
  COMPANIES_DT_DEFAULT_COLUMNS,
  COMPANIES_DT_PAGE_SIZE_OPTIONS,
  type CompaniesDataTableColumnId,
} from "@/components/feature/companies/companiesTableModel";

const INDUSTRY_BADGE_COLORS = ["blue", "purple", "gray"] as const;

function gridSortModelFromSortBy(sortBy: string): GridSortModel {
  if (sortBy === "oldest" || sortBy === "newest") {
    return [
      {
        field: "createdAt",
        sort: sortBy === "oldest" ? "asc" : "desc",
      },
    ];
  }
  if (sortBy === "name_asc" || sortBy === "name_desc") {
    return [
      {
        field: "name",
        sort: sortBy === "name_asc" ? "asc" : "desc",
      },
    ];
  }
  if (sortBy === "employees_asc" || sortBy === "employees_desc") {
    return [
      {
        field: "employeeCount",
        sort: sortBy === "employees_asc" ? "asc" : "desc",
      },
    ];
  }
  if (sortBy === "location_asc" || sortBy === "location_desc") {
    return [
      {
        field: "location",
        sort: sortBy === "location_asc" ? "asc" : "desc",
      },
    ];
  }
  if (sortBy === "domain_asc" || sortBy === "domain_desc") {
    return [
      {
        field: "domain",
        sort: sortBy === "domain_asc" ? "asc" : "desc",
      },
    ];
  }
  if (sortBy === "contacts_asc" || sortBy === "contacts_desc") {
    return [
      {
        field: "contactCount",
        sort: sortBy === "contacts_asc" ? "asc" : "desc",
      },
    ];
  }
  return [{ field: "createdAt", sort: "desc" }];
}

function industryList(row: Company): string[] {
  if (row.industries?.length) return row.industries;
  if (row.industry) return [row.industry];
  return [];
}

function CompaniesNoRowsOverlay({
  error,
  errorMsg,
  onRetry,
  loading,
}: {
  error: string | null;
  errorMsg: string | null;
  onRetry?: () => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="c360-flex c360-h-full c360-min-h-[320px] c360-w-full c360-flex-col c360-justify-center c360-gap-3 c360-px-4 c360-py-6">
        <Skeleton height={44} />
        <Skeleton height={44} />
        <Skeleton height={44} />
        <Skeleton height={44} />
        <Skeleton height={44} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="c360-flex c360-h-full c360-min-h-[120px] c360-flex-col c360-items-center c360-justify-center c360-px-4 c360-text-center">
        <p className="c360-m-0 c360-text-sm c360-text-danger">{errorMsg}</p>
        {onRetry ? (
          <Button
            variant="ghost"
            size="sm"
            className="c360-mt-2"
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4">
      <p className="c360-table__empty c360-m-0 c360-text-sm c360-text-ink-muted">
        No companies for this page. Adjust filters or search.
      </p>
    </div>
  );
}

export interface CompaniesDataTableProps {
  rows: Company[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
  onRetry?: () => void;
  visibleColumns?: CompaniesDataTableColumnId[];
  onToggleColumn?: (columnId: CompaniesDataTableColumnId) => void;
  onVisibleColumnsResolved?: (columns: CompaniesDataTableColumnId[]) => void;
  showToolbarSearch?: boolean;
  showColumnPicker?: boolean;
  showPageSizeControl?: boolean;
  showPaginationFooter?: boolean;
  density?: "comfortable" | "compact";
  className?: string;
}

export function CompaniesDataTable({
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  error,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  selected,
  onSelectionChange,
  onRetry,
  visibleColumns: visibleColumnsProp,
  onToggleColumn,
  onVisibleColumnsResolved,
  showToolbarSearch = true,
  showColumnPicker = true,
  showPageSizeControl = true,
  showPaginationFooter = true,
  density = "comfortable",
  className,
}: CompaniesDataTableProps) {
  const visibleColumns = visibleColumnsProp ?? COMPANIES_DT_DEFAULT_COLUMNS;
  const vis = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  const hasCol = useCallback(
    (id: CompaniesDataTableColumnId) => visibleColumns.includes(id),
    [visibleColumns],
  );

  const errorMsg = useMemo(
    () => (error ? parseOperationError(error, "companies").userMessage : null),
    [error],
  );

  const columnVisibilityModel = useMemo(() => {
    const m: GridColumnVisibilityModel = {};
    for (const id of COMPANIES_DT_COLUMN_IDS) {
      m[COL_ID_TO_FIELD[id]] = vis.has(id);
    }
    return m;
  }, [vis]);

  const sortModel = useMemo(() => gridSortModelFromSortBy(sortBy), [sortBy]);

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(selected),
    }),
    [selected],
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      const first = model[0];
      if (!first?.sort) {
        onSortChange("newest");
        return;
      }
      if (first.field === "createdAt") {
        onSortChange(first.sort === "asc" ? "oldest" : "newest");
      } else if (first.field === "name") {
        onSortChange(first.sort === "asc" ? "name_asc" : "name_desc");
      } else if (first.field === "employeeCount") {
        onSortChange(first.sort === "asc" ? "employees_asc" : "employees_desc");
      } else if (first.field === "location") {
        onSortChange(first.sort === "asc" ? "location_asc" : "location_desc");
      } else if (first.field === "domain") {
        onSortChange(first.sort === "asc" ? "domain_asc" : "domain_desc");
      } else if (first.field === "contactCount") {
        onSortChange(first.sort === "asc" ? "contacts_asc" : "contacts_desc");
      }
    },
    [onSortChange],
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      const next = COMPANIES_DT_COLUMN_IDS.filter(
        (id) => model[COL_ID_TO_FIELD[id]] !== false,
      );
      if (next.length === 0) return;
      onVisibleColumnsResolved?.(next);
    },
    [onVisibleColumnsResolved],
  );

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      onSelectionChange(Array.from(model.ids, (id) => String(id)));
    },
    [onSelectionChange],
  );

  const columns = useMemo<GridColDef<Company>[]>(
    () => [
      {
        field: "name",
        headerName: COMPANIES_DT_COLUMN_LABELS.name,
        flex: 1.5,
        minWidth: 220,
        sortable: true,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Company, string>) => {
          const row = params.row;
          if (density === "compact") {
            return (
              <div className="c360-flex c360-min-w-0 c360-max-w-full c360-items-center c360-gap-2">
                <CompanyLogoThumb key={row.id} company={row} iconSize={14} />
                <Link
                  href={`/companies/${row.id}`}
                  onClick={() => stashCompanyRowForDetail(row)}
                  className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
                >
                  {formatDisplayLabel(row.name)}
                </Link>
              </div>
            );
          }
          return (
            <div className="c360-flex c360-min-w-0 c360-items-center c360-gap-3">
              <CompanyLogoThumb key={row.id} company={row} />
              <div className="c360-min-w-0 c360-flex-1">
                <Link
                  href={`/companies/${row.id}`}
                  onClick={() => stashCompanyRowForDetail(row)}
                  className="c360-block c360-max-w-full c360-truncate c360-font-medium c360-text-body hover:c360-underline"
                >
                  {formatDisplayLabel(row.name)}
                </Link>
                {row.website ? (
                  <div className="c360-text-xs c360-text-muted c360-truncate">
                    {row.website}
                  </div>
                ) : null}
              </div>
            </div>
          );
        },
        cellClassName:
          density === "compact"
            ? "c360-co-grid-cell--center"
            : "c360-co-grid-cell--top",
      },
      {
        field: "industries",
        headerName: COMPANIES_DT_COLUMN_LABELS.industries,
        flex: 1.1,
        minWidth: 160,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) => industryList(row).join(", "),
        renderCell: (params: GridRenderCellParams<Company>) => {
          const inds = industryList(params.row);
          if (inds.length === 0) {
            return (
              <span className="c360-hs-grid-meta-text c360-text-ink-muted">
                —
              </span>
            );
          }
          const shown = inds.slice(0, 2);
          const more = inds.length - shown.length;
          return (
            <div className="c360-flex c360-min-w-0 c360-flex-wrap c360-items-center c360-gap-1">
              {shown.map((label, i) => (
                <Badge
                  key={`${label}-${i}`}
                  color={
                    INDUSTRY_BADGE_COLORS[i % INDUSTRY_BADGE_COLORS.length]
                  }
                >
                  {formatDisplayLabel(label)}
                </Badge>
              ))}
              {more > 0 ? (
                <span className="c360-text-2xs c360-text-muted">
                  +{more} more
                </span>
              ) : null}
            </div>
          );
        },
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "employeeCount",
        headerName: COMPANIES_DT_COLUMN_LABELS.employees,
        flex: 0,
        width: 110,
        minWidth: 96,
        sortable: true,
        filterable: false,
        type: "number",
        align: "left",
        headerAlign: "left",
        valueGetter: (_v, row) => row.employeeCount ?? null,
        renderCell: (params: GridRenderCellParams<Company>) => (
          <span className="c360-hs-grid-meta-text c360-text-ink-muted">
            {params.row.employeeCount != null
              ? formatCompact(params.row.employeeCount)
              : "—"}
          </span>
        ),
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "location",
        headerName: COMPANIES_DT_COLUMN_LABELS.location,
        flex: 1,
        minWidth: 140,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) =>
          row.location ||
          [row.city, row.state, row.country].filter(Boolean).join(", ") ||
          "",
        renderCell: (params: GridRenderCellParams<Company>) => (
          <span
            className="c360-hs-grid-meta-text c360-text-ink-muted c360-min-w-0 c360-truncate"
            title={
              params.row.location ||
              [params.row.city, params.row.state, params.row.country]
                .filter(Boolean)
                .join(", ")
            }
          >
            {formatDisplayLabel(
              params.row.location ||
                [params.row.city, params.row.state, params.row.country]
                  .filter(Boolean)
                  .join(", ") ||
                "",
            )}
          </span>
        ),
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "domain",
        headerName: COMPANIES_DT_COLUMN_LABELS.domain,
        flex: 0.9,
        minWidth: 120,
        sortable: true,
        filterable: false,
        valueGetter: (_v, row) => row.domain ?? "",
        renderCell: (params: GridRenderCellParams<Company>) => (
          <span className="c360-hs-grid-meta-text c360-text-ink-muted c360-truncate">
            {params.row.domain || "—"}
          </span>
        ),
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "contactCount",
        headerName: COMPANIES_DT_COLUMN_LABELS.contacts,
        flex: 0,
        width: 110,
        minWidth: 96,
        sortable: true,
        filterable: false,
        description:
          "Sorted by contact count for the current page after counts are loaded.",
        type: "number",
        align: "left",
        headerAlign: "left",
        valueGetter: (_v, row) => row.contactCount ?? 0,
        renderCell: (params: GridRenderCellParams<Company>) => (
          <div className="c360-flex c360-items-center c360-gap-1">
            <Users size={14} className="c360-text-muted" />
            <span className="c360-hs-grid-meta-text c360-text-ink-muted">
              {params.row.contactCount ?? 0}
            </span>
          </div>
        ),
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "createdAt",
        headerName: COMPANIES_DT_COLUMN_LABELS.added,
        flex: 0,
        width: 168,
        minWidth: 148,
        sortable: true,
        filterable: false,
        type: "dateTime",
        valueGetter: (_v, row) =>
          row.createdAt ? new Date(row.createdAt) : null,
        renderCell: (params: GridRenderCellParams<Company>) => {
          const added = params.row.createdAt;
          const label = formatDateTime(added);
          return (
            <span
              className="c360-hs-grid-meta-text c360-text-ink-muted c360-whitespace-nowrap"
              title={added ? new Date(added).toISOString() : undefined}
            >
              {label}
            </span>
          );
        },
        cellClassName: "c360-co-grid-cell--center",
      },
      {
        field: "action",
        headerName: COMPANIES_DT_COLUMN_LABELS.action,
        flex: 0,
        width: 100,
        minWidth: 88,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<Company>) => (
          <div className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end c360-gap-1">
            <Link
              href={`/companies/${params.row.id}`}
              onClick={() => stashCompanyRowForDetail(params.row)}
            >
              <Button
                variant="ghost"
                size="sm"
                title="View"
                className="c360-hs-grid-action-btn"
              >
                <ExternalLink size={14} />
              </Button>
            </Link>
          </div>
        ),
        cellClassName: "c360-co-grid-cell--center",
      },
    ],
    [density],
  );

  const columnsMenu =
    showColumnPicker && onToggleColumn != null ? (
      <Popover
        align="start"
        width={240}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Columns3 size={16} aria-hidden />}
            className="c360-contacts-dt__columns-btn"
          >
            Columns
          </Button>
        }
        content={
          <div
            className="c360-contacts-dt__columns-menu"
            role="group"
            aria-label="Visible columns"
          >
            <p className="c360-contacts-dt__columns-hint">
              Show or hide table columns
            </p>
            {COMPANIES_DT_COLUMN_IDS.map((id) => (
              <Checkbox
                key={id}
                size="sm"
                label={COMPANIES_DT_COLUMN_LABELS[id]}
                checked={hasCol(id)}
                onChange={() => onToggleColumn(id)}
                disabled={hasCol(id) && visibleColumns.length <= 1}
              />
            ))}
          </div>
        }
      />
    ) : null;

  const hasTableToolbar =
    showPageSizeControl ||
    showToolbarSearch ||
    (showColumnPicker && onToggleColumn != null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const showingFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  const showLoadingOverlay = Boolean(loading);

  return (
    <div
      className={cn(
        "c360-companies-dt c360-w-full c360-min-w-0",
        density === "compact" && "c360-companies-dt--compact",
        className,
      )}
    >
      {hasTableToolbar ? (
        <div className="c360-contacts-dt__toolbar">
          {showPageSizeControl || columnsMenu ? (
            <div className="c360-contacts-dt__toolbar-left">
              {showPageSizeControl ? (
                <>
                  <span className="c360-contacts-dt__toolbar-label">Show</span>
                  <Select
                    options={[...COMPANIES_DT_PAGE_SIZE_OPTIONS]}
                    value={String(pageSize)}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    fullWidth={false}
                    className="c360-contacts-dt__page-size"
                  />
                  <span className="c360-contacts-dt__toolbar-label">
                    entries
                  </span>
                </>
              ) : null}
              {columnsMenu}
            </div>
          ) : null}
          {showToolbarSearch ? (
            <div className="c360-contacts-dt__toolbar-right">
              <span className="c360-contacts-dt__toolbar-label">Search:</span>
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter by company name…"
                className="c360-contacts-dt__search"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <C360DataTableShell>
        <C360MuiThemeProvider>
          <div
            className={cn(
              "c360-companies-data-grid c360-min-h-[320px] c360-w-full",
              density === "compact" && "c360-companies-data-grid--compact",
            )}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              checkboxSelection
              disableRowSelectionOnClick
              keepNonExistentRowsSelected
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              disableColumnFilter
              hideFooter
              loading={showLoadingOverlay}
              getRowHeight={() => "auto"}
              getEstimatedRowHeight={() => (density === "compact" ? 48 : 72)}
              columnHeaderHeight={44}
              density={density === "compact" ? "compact" : "comfortable"}
              slots={{
                noRowsOverlay: () => (
                  <CompaniesNoRowsOverlay
                    error={error}
                    errorMsg={errorMsg}
                    onRetry={onRetry}
                    loading={loading}
                  />
                ),
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
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-cell.c360-co-grid-cell--top": {
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                "& .MuiDataGrid-cell.c360-co-grid-cell--center": {
                  alignItems: "center",
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

      {showPaginationFooter ? (
        <div className="c360-contacts-dt__footer c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2 c360-border-t c360-border-border c360-px-3 c360-py-2">
          <p className="c360-m-0 c360-text-sm c360-text-muted">
            {total === 0
              ? "No entries"
              : `Showing ${showingFrom.toLocaleString()}–${showingTo.toLocaleString()} of ${total.toLocaleString()}`}
          </p>
          <div className="c360-flex c360-items-center c360-gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1 || loading}
              onClick={() => onPageChange(safePage - 1)}
            >
              Previous
            </Button>
            <span className="c360-text-sm c360-text-muted">
              Page {safePage} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount || loading}
              onClick={() => onPageChange(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
