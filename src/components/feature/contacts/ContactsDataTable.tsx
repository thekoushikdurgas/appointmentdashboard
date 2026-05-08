"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  ExternalLink,
  Loader2,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridRenderCellParams,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { ContactDetailPanel } from "@/components/feature/contacts/ContactDetailPanel";
import { contactDetailRoute } from "@/lib/routes";
import { cn, getAvatarUrl } from "@/lib/utils";
import { mapConnectraError } from "@/lib/linkedinValidation";
import type { Contact } from "@/services/graphql/contactsService";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";

export const CONTACTS_DT_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
] as const;

/** Toggleable data columns (checkbox + expand are always shown). */
export const CONTACTS_DT_COLUMN_IDS = [
  "ref",
  "added",
  "name",
  "title",
  "region",
  "status",
  "company",
  "email",
  "action",
] as const;

export type ContactsDataTableColumnId = (typeof CONTACTS_DT_COLUMN_IDS)[number];

export const CONTACTS_DT_DEFAULT_COLUMNS: ContactsDataTableColumnId[] = [
  ...CONTACTS_DT_COLUMN_IDS,
];

/** Human labels for column picker (contacts sidebar, table popover). */
export const CONTACTS_DT_COLUMN_LABELS: Record<
  ContactsDataTableColumnId,
  string
> = {
  ref: "Contact ref",
  added: "Added",
  name: "Name",
  title: "Title",
  region: "Region",
  status: "Status",
  company: "Company",
  email: "Email",
  action: "Action",
};

/** Maps sidebar / storage column id → MUI `field` on the grid. */
const COL_ID_TO_FIELD: Record<ContactsDataTableColumnId, string> = {
  ref: "ref",
  added: "createdAt",
  name: "name",
  title: "title",
  region: "region",
  status: "emailStatus",
  company: "company",
  email: "email",
  action: "action",
};

function hashContactRef(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++)
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 90000) + 10000;
  return `#C-${n}`;
}

function formatCheckInDate(iso: string): string {
  if (!iso) return "—";
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

type StatusTone = "danger" | "warning" | "success" | "primary" | "muted";

function emailStatusTone(status?: string): StatusTone {
  const s = (status || "").toUpperCase();
  if (s === "VALID") return "success";
  if (s === "FOUND") return "primary";
  if (s === "RISKY") return "danger";
  if (s === "UNKNOWN") return "warning";
  return "muted";
}

function emailStatusLabel(status?: string): string {
  const s = (status || "").toUpperCase();
  if (s === "VALID") return "Verified";
  if (s === "FOUND") return "Found";
  if (s === "RISKY") return "Risky";
  if (s === "UNKNOWN") return "Unknown";
  if (!status) return "No email";
  return status;
}

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
  return [{ field: "createdAt", sort: "desc" }];
}

function ContactsNoRowsOverlay({
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
      <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4 c360-gap-2">
        <Loader2 size={20} className="c360-spin" />
        <span className="c360-text-sm c360-text-ink-muted">
          Loading contacts…
        </span>
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
      <p className="c360-m-0 c360-text-sm c360-text-ink-muted">
        No contacts found
      </p>
    </div>
  );
}

export interface ContactsDataTableProps {
  contacts: Contact[];
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
  /** Replaces the full selection set (MUI `keepNonExistentRowsSelected` + server paging). */
  onSelectionChange: (ids: string[]) => void;
  expandedRow: string | null;
  onToggleExpand: (id: string) => void;
  onRetry?: () => void;
  /** Which data columns to show (checkbox + expand always on). */
  visibleColumns?: ContactsDataTableColumnId[];
  onToggleColumn?: (columnId: ContactsDataTableColumnId) => void;
  /** When the DataGrid column menu changes visibility, sync the ordered list (e.g. localStorage). */
  onVisibleColumnsResolved?: (columns: ContactsDataTableColumnId[]) => void;
  /** When false, hide the toolbar search field (e.g. search lives in the left filter sidebar). */
  showToolbarSearch?: boolean;
  /** When false, hide the Columns popover (e.g. column picker lives in the left filter sidebar). */
  showColumnPicker?: boolean;
  /** When false, hide “Show N entries” in the table toolbar (e.g. control lives in the page toolbar). */
  showPageSizeControl?: boolean;
  /** When false, hide the bottom “Showing X–Y of Z” + pager row (e.g. pagination lives only in the page chrome). */
  showPaginationFooter?: boolean;
  /** appointment-d1-style table density (toolbar view toggle). */
  density?: "comfortable" | "compact";
}

export function ContactsDataTable({
  contacts,
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
  expandedRow,
  onToggleExpand,
  onRetry,
  visibleColumns: visibleColumnsProp,
  onToggleColumn,
  onVisibleColumnsResolved,
  showToolbarSearch = true,
  showColumnPicker = true,
  showPageSizeControl = true,
  showPaginationFooter = true,
  density = "comfortable",
}: ContactsDataTableProps) {
  const visibleColumns = visibleColumnsProp ?? CONTACTS_DT_DEFAULT_COLUMNS;
  const vis = useMemo(() => new Set(visibleColumns), [visibleColumns]);

  const hasCol = useCallback(
    (id: ContactsDataTableColumnId) => visibleColumns.includes(id),
    [visibleColumns],
  );

  const errorMsg = useMemo(
    () => (error ? mapConnectraError(error) : null),
    [error],
  );

  const columnVisibilityModel = useMemo(() => {
    const m: GridColumnVisibilityModel = {};
    m.__expand = true;
    for (const id of CONTACTS_DT_COLUMN_IDS) {
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
      }
    },
    [onSortChange],
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      const next = CONTACTS_DT_COLUMN_IDS.filter(
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

  const expandedContact = useMemo(
    () => contacts.find((c) => c.id === expandedRow) ?? null,
    [contacts, expandedRow],
  );

  const columns = useMemo<GridColDef<Contact>[]>(
    () => [
      {
        field: "__expand",
        headerName: "",
        width: 44,
        minWidth: 44,
        maxWidth: 44,
        sortable: false,
        filterable: false,
        disableReorder: true,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const open = expandedRow === params.row.id;
          return (
            <button
              type="button"
              className="c360-contacts-dt__expand"
              aria-expanded={open}
              aria-label={open ? "Collapse details" : "Expand details"}
              onClick={() => onToggleExpand(params.row.id)}
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          );
        },
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "ref",
        headerName: CONTACTS_DT_COLUMN_LABELS.ref,
        flex: 0,
        width: 110,
        minWidth: 96,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) => hashContactRef(row.id),
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <strong className="c360-contacts-dt__job-ref">
            {hashContactRef(params.row.id)}
          </strong>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "createdAt",
        headerName: CONTACTS_DT_COLUMN_LABELS.added,
        flex: 0,
        width: 152,
        minWidth: 132,
        sortable: true,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span className="c360-contacts-dt__muted">
            {formatCheckInDate(params.row.createdAt)}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "name",
        headerName: CONTACTS_DT_COLUMN_LABELS.name,
        flex: 1.25,
        minWidth: 200,
        sortable: true,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const row = params.row;
          if (density === "compact") {
            return (
              <button
                type="button"
                className="c360-contacts-dt__name-btn c360-flex c360-min-w-0 c360-items-center c360-gap-2 c360-text-left"
                onClick={() => onToggleExpand(row.id)}
              >
                <Image
                  src={getAvatarUrl(row.name, 32)}
                  alt=""
                  width={28}
                  height={28}
                  className="c360-contact-avatar c360-shrink-0"
                />
                <span className="c360-contacts-dt__task-link c360-min-w-0 c360-truncate">
                  {row.name}
                </span>
              </button>
            );
          }
          return (
            <button
              type="button"
              className="c360-contacts-dt__name-btn"
              onClick={() => onToggleExpand(row.id)}
            >
              <Image
                src={getAvatarUrl(row.name, 32)}
                alt=""
                width={32}
                height={32}
                className="c360-contact-avatar"
              />
              <span className="c360-contacts-dt__task-link c360-text-left">
                {row.name}
              </span>
            </button>
          );
        },
        cellClassName:
          density === "compact"
            ? "c360-ct-grid-cell--center"
            : "c360-ct-grid-cell--top",
      },
      {
        field: "title",
        headerName: CONTACTS_DT_COLUMN_LABELS.title,
        flex: 1,
        minWidth: 120,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) => row.title ?? "",
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span className="c360-contacts-dt__muted c360-min-w-0 c360-truncate">
            {params.row.title || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "region",
        headerName: CONTACTS_DT_COLUMN_LABELS.region,
        flex: 1,
        minWidth: 120,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) => row.location || row.country || "",
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span
            className="c360-contacts-dt__muted c360-contacts-dt__truncate c360-min-w-0"
            title={
              params.row.location || params.row.country || ""
                ? String(params.row.location || params.row.country)
                : undefined
            }
          >
            {params.row.location || params.row.country || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "emailStatus",
        headerName: CONTACTS_DT_COLUMN_LABELS.status,
        flex: 0,
        width: 120,
        minWidth: 104,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const tone = emailStatusTone(params.row.emailStatus);
          return (
            <span
              className={cn(
                "c360-contacts-dt__pill",
                `c360-contacts-dt__pill--${tone}`,
              )}
            >
              <span className="c360-contacts-dt__pill-dot" aria-hidden />
              {emailStatusLabel(params.row.emailStatus)}
            </span>
          );
        },
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "company",
        headerName: CONTACTS_DT_COLUMN_LABELS.company,
        flex: 1,
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span
            className="c360-contacts-dt__muted c360-contacts-dt__truncate c360-min-w-0"
            title={params.row.company || undefined}
          >
            {params.row.company || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "email",
        headerName: CONTACTS_DT_COLUMN_LABELS.email,
        flex: 1,
        minWidth: 160,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span
            className="c360-contacts-dt__email c360-text-xs c360-min-w-0 c360-truncate"
            title={params.row.email || undefined}
          >
            {params.row.email || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
      {
        field: "action",
        headerName: CONTACTS_DT_COLUMN_LABELS.action,
        flex: 0,
        width: 72,
        minWidth: 64,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const row = params.row;
          const expanded = expandedRow === row.id;
          return (
            <div className="c360-flex c360-w-full c360-items-center c360-justify-end">
              <Popover
                align="end"
                width={200}
                trigger={
                  <button
                    type="button"
                    className="c360-contacts-dt__action-btn"
                    aria-label={`Actions for ${row.name}`}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                }
                content={
                  <div className="c360-contacts-dt__menu">
                    <Link
                      href={contactDetailRoute(row.id)}
                      className="c360-contacts-dt__menu-link"
                    >
                      <ExternalLink size={14} aria-hidden />
                      View profile
                    </Link>
                    <button
                      type="button"
                      className="c360-contacts-dt__menu-item"
                      onClick={() => onToggleExpand(row.id)}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </button>
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="c360-contacts-dt__menu-link"
                      >
                        <Mail size={14} aria-hidden />
                        Compose email
                      </a>
                    ) : null}
                  </div>
                }
              />
            </div>
          );
        },
        cellClassName: "c360-ct-grid-cell--center",
      },
    ],
    [density, expandedRow, onToggleExpand],
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
            {CONTACTS_DT_COLUMN_IDS.map((id) => (
              <Checkbox
                key={id}
                size="sm"
                label={CONTACTS_DT_COLUMN_LABELS[id]}
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

  const showLoadingOverlay = Boolean(loading && contacts.length === 0);

  return (
    <div
      className={cn(
        "c360-contacts-dt",
        density === "compact" && "c360-contacts-dt--compact",
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
                    options={[...CONTACTS_DT_PAGE_SIZE_OPTIONS]}
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
                placeholder="Filter by email, name…"
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
              "c360-contacts-data-grid c360-min-h-[320px] c360-w-full",
              density === "compact" && "c360-contacts-data-grid--compact",
            )}
          >
            <DataGrid
              rows={contacts}
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
              showColumnVerticalBorder
              slots={{
                noRowsOverlay: () => (
                  <ContactsNoRowsOverlay
                    error={error}
                    errorMsg={errorMsg}
                    onRetry={onRetry}
                    loading={loading}
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
                "& .MuiDataGrid-cell.c360-ct-grid-cell--top": {
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                "& .MuiDataGrid-cell.c360-ct-grid-cell--center": {
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

      {expandedContact ? (
        <ContactDetailPanel contact={expandedContact} layout="block" />
      ) : null}

      {showPaginationFooter ? (
        <div className="c360-contacts-dt__footer">
          <p className="c360-contacts-dt__footer-text">
            Showing {showingFrom} to {showingTo} of {total} entries
          </p>
          <div className="c360-contacts-dt__pager">
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
            >
              Previous
            </Button>
            <span className="c360-contacts-dt__footer-text">
              Page {safePage} of {pageCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={safePage >= pageCount}
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
