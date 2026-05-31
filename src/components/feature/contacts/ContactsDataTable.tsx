"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Columns3, ExternalLink } from "lucide-react";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { Skeleton } from "@/components/shared/Skeleton";
import { ContactDetailPanel } from "@/components/feature/contacts/ContactDetailPanel";
import {
  ContactsGridCompanyCellComfortable,
  ContactsGridCompanyCellCompact,
  ContactsGridEmailCellComfortable,
  ContactsGridEmailCellCompact,
} from "@/components/feature/contacts/contactsGridCells";
import { contactDetailRoute } from "@/lib/routes";
import { stashContactRowForDetail } from "@/lib/contactRowSession";
import { cn, getAvatarUrl } from "@/lib/utils";
import { mapConnectraError } from "@/lib/linkedinValidation";
import type { Contact } from "@/services/graphql/contactsService";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";

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

export const CONTACTS_DT_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
] as const;

/** Toggleable data columns (checkbox column is always shown). */
export const CONTACTS_DT_COLUMN_IDS = [
  "name",
  "title",
  "department",
  "region",
  "company",
  "email",
  "added",
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
  name: "Name",
  title: "Title",
  department: "Department",
  region: "Region",
  company: "Company",
  email: "Email",
  added: "Added",
  action: "Action",
};

/** Maps sidebar / storage column id → MUI `field` on the grid. */
const COL_ID_TO_FIELD: Record<ContactsDataTableColumnId, string> = {
  name: "name",
  title: "title",
  department: "departmentsJoined",
  region: "region",
  company: "company",
  email: "email",
  added: "createdAt",
  action: "action",
};

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
  /**
   * Company detail / embedded lists: name links to `/contacts/[uuid]` (no avatar in name
   * column), no checkboxes, no expand drawer; client-side sort on the current page.
   */
  embedded?: boolean;
  /** Extra class on the root `.c360-contacts-dt` wrapper (e.g. company detail scope). */
  className?: string;
  /** Opens hiring-signals company drawer (`CompanyDrawerPanel`) for this contact's company. */
  onOpenCompanyDrawer?: (contact: Contact) => void;
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
  embedded = false,
  className,
  onOpenCompanyDrawer,
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

  const columns = useMemo<GridColDef<Contact>[]>(() => {
    const cols: GridColDef<Contact>[] = [
      {
        field: "name",
        headerName: CONTACTS_DT_COLUMN_LABELS.name,
        flex: 1.25,
        minWidth: 200,
        sortable: true,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const row = params.row;
          if (embedded) {
            return (
              <Link
                href={contactDetailRoute(row.id)}
                className={
                  density === "compact"
                    ? "c360-contacts-dt__name-btn c360-flex c360-min-w-0 c360-items-center c360-text-left"
                    : "c360-contacts-dt__name-btn"
                }
              >
                <span
                  className={
                    density === "compact"
                      ? "c360-contacts-dt__task-link c360-min-w-0 c360-truncate"
                      : "c360-contacts-dt__task-link c360-text-left"
                  }
                >
                  {row.name}
                </span>
              </Link>
            );
          }
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
        field: "departmentsJoined",
        headerName: CONTACTS_DT_COLUMN_LABELS.department,
        flex: 1,
        minWidth: 140,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) =>
          row.departments?.length ? row.departments.join(", ") : "",
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span
            className="c360-contacts-dt__muted c360-min-w-0 c360-truncate"
            title={params.value ? String(params.value) : undefined}
          >
            {params.value ? String(params.value) : "—"}
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
        field: "company",
        headerName: CONTACTS_DT_COLUMN_LABELS.company,
        flex: 1.25,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const row = params.row;
          const openDrawer = !embedded ? onOpenCompanyDrawer : undefined;
          if (density === "compact") {
            return (
              <ContactsGridCompanyCellCompact
                contact={row}
                onOpenCompanyDrawer={openDrawer}
              />
            );
          }
          return (
            <ContactsGridCompanyCellComfortable
              contact={row}
              onOpenCompanyDrawer={openDrawer}
            />
          );
        },
        cellClassName:
          density === "compact"
            ? "c360-ct-grid-cell--center"
            : "c360-ct-grid-cell--top",
      },
      {
        field: "email",
        headerName: CONTACTS_DT_COLUMN_LABELS.email,
        flex: 1,
        minWidth: 220,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => {
          const row = params.row;
          if (density === "compact") {
            return <ContactsGridEmailCellCompact contact={row} />;
          }
          return <ContactsGridEmailCellComfortable contact={row} />;
        },
        cellClassName:
          density === "compact"
            ? "c360-ct-grid-cell--center"
            : "c360-ct-grid-cell--top",
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
        field: "action",
        headerName: CONTACTS_DT_COLUMN_LABELS.action,
        flex: 0,
        width: 100,
        minWidth: 88,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <div className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end c360-gap-1">
            <Link
              href={contactDetailRoute(params.row.id)}
              onMouseDown={() => {
                stashContactRowForDetail(params.row);
              }}
              onClick={() => {
                stashContactRowForDetail(params.row);
                // #region agent log
                fetch(
                  "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Debug-Session-Id": "c73258",
                    },
                    body: JSON.stringify({
                      sessionId: "c73258",
                      runId: "contact-detail",
                      hypothesisId: "E6",
                      location: "ContactsDataTable.tsx:viewClick",
                      message: "contact View clicked from table",
                      data: {
                        contactId: params.row.id,
                        companyId: params.row.companyId ?? null,
                        name: params.row.name,
                      },
                      timestamp: Date.now(),
                    }),
                  },
                ).catch(() => {});
                // #endregion
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                title="View"
                className="c360-hs-grid-action-btn"
                aria-label={`View profile for ${params.row.name}`}
              >
                <ExternalLink size={14} aria-hidden />
              </Button>
            </Link>
          </div>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      },
    ];
    if (embedded) {
      const seniorityCol: GridColDef<Contact> = {
        field: "seniority",
        headerName: "Seniority",
        flex: 0,
        width: 112,
        minWidth: 96,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span className="c360-contacts-dt__muted c360-text-xs c360-min-w-0 c360-truncate">
            {params.row.seniority?.trim() || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      };
      const stageCol: GridColDef<Contact> = {
        field: "stage",
        headerName: "Stage",
        flex: 0,
        width: 100,
        minWidth: 88,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span className="c360-contacts-dt__muted c360-text-xs c360-min-w-0 c360-truncate">
            {params.row.stage?.trim() || "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      };
      const titleIdx = cols.findIndex((c) => c.field === "title");
      if (titleIdx >= 0) {
        cols.splice(titleIdx + 1, 0, seniorityCol, stageCol);
      } else {
        cols.unshift(seniorityCol, stageCol);
      }

      const phoneCol: GridColDef<Contact> = {
        field: "phonelines",
        headerName: "Phones",
        flex: 1,
        minWidth: 128,
        sortable: false,
        filterable: false,
        valueGetter: (_v, row) =>
          [row.phone, row.workDirectPhone, row.homePhone, row.otherPhone]
            .map((s) => (s || "").trim())
            .filter(Boolean)
            .join(" · "),
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span
            className="c360-contacts-dt__muted c360-text-xs c360-min-w-0 c360-truncate"
            title={params.value ? String(params.value) : undefined}
          >
            {params.value ? String(params.value) : "—"}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      };
      const liCol: GridColDef<Contact> = {
        field: "linkedinEmbed",
        headerName: "LinkedIn",
        flex: 0,
        width: 104,
        minWidth: 88,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) =>
          params.row.linkedinUrl ? (
            <a
              href={params.row.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c360-link c360-text-xs"
            >
              View
            </a>
          ) : (
            <span className="c360-contacts-dt__muted">—</span>
          ),
        cellClassName: "c360-ct-grid-cell--center",
      };
      const createdIdx = cols.findIndex((c) => c.field === "createdAt");
      if (createdIdx >= 0) {
        cols.splice(createdIdx, 0, phoneCol, liCol);
      } else {
        cols.push(phoneCol, liCol);
      }

      const updatedCol: GridColDef<Contact> = {
        field: "contactUpdatedAt",
        headerName: "Updated",
        flex: 0,
        width: 152,
        minWidth: 132,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Contact>) => (
          <span className="c360-contacts-dt__muted">
            {formatCheckInDate(params.row.updatedAt)}
          </span>
        ),
        cellClassName: "c360-ct-grid-cell--center",
      };
      const actionIdx = cols.findIndex((c) => c.field === "action");
      if (actionIdx >= 0) {
        cols.splice(actionIdx, 0, updatedCol);
      } else {
        cols.push(updatedCol);
      }
    }
    return cols;
  }, [density, embedded, onToggleExpand, onOpenCompanyDrawer]);

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
              checkboxSelection={!embedded}
              disableRowSelectionOnClick
              keepNonExistentRowsSelected={!embedded}
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={handleRowSelectionModelChange}
              sortingMode={embedded ? "client" : "server"}
              sortModel={embedded ? undefined : sortModel}
              onSortModelChange={embedded ? () => {} : handleSortModelChange}
              disableColumnMenu={embedded}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={
                embedded ? () => {} : handleColumnVisibilityModelChange
              }
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

      {expandedContact && !embedded ? (
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
