"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type {
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { toast } from "sonner";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import { cn } from "@/lib/utils";
import { parseEmailServiceError } from "@/lib/emailErrors";
import { getHiringSignalsDataGridSx } from "@/components/feature/hiring-signals/hiringSignalsDataGridTheme";
import {
  HiringSignalDrawerContactEmailCell,
  HiringSignalsContactLinkedInCell,
} from "@/components/feature/hiring-signals/hiringSignalsGridCells";
import {
  connectraContactStableKey,
  pickContactDepartments,
  pickContactDisplay,
  pickContactFinderNames,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { emailService } from "@/services/graphql/emailService";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((mod) => mod.DataGrid),
  {
    ssr: false,
    loading: () => (
      <div className="c360-flex c360-items-center c360-justify-center c360-min-h-[200px]">
        <span className="c360-spinner" aria-label="Loading table…" />
      </div>
    ),
  },
) as typeof import("@mui/x-data-grid").DataGrid;

export type HiringSignalContactGridRow = {
  id: string;
  name: string;
  title: string;
  departmentsLabel: string;
  email: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
};

function DrawerContactsNoRows() {
  return (
    <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4">
      <p className="c360-table__empty c360-m-0 c360-text-sm c360-text-ink-muted">
        No contacts for this job.
      </p>
    </div>
  );
}

export interface HiringSignalDrawerContactsGridProps {
  contacts: unknown[];
  loading?: boolean;
  density?: "comfortable" | "compact";
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  scrollClassName?: string;
  companyWebsite: string;
  resolvedEmails: Record<string, string>;
  revealedRowIds: Set<string>;
  onRevealRow: (rowId: string, email: string) => void;
}

export function HiringSignalDrawerContactsGrid({
  contacts,
  loading = false,
  density = "comfortable",
  selectedKeys,
  onSelectionChange,
  scrollClassName = "c360-data-table-shell__scroll--modal c360-min-h-0",
  companyWebsite,
  resolvedEmails,
  revealedRowIds,
  onRevealRow,
}: HiringSignalDrawerContactsGridProps) {
  const rows = useMemo<HiringSignalContactGridRow[]>(
    () =>
      contacts.map((row, i) => {
        const p = pickContactDisplay(row);
        const n = pickContactFinderNames(row);
        const deps = pickContactDepartments(row);
        return {
          id: connectraContactStableKey(row, i),
          name: p.name,
          title: p.title,
          departmentsLabel: deps.length ? deps.join(", ") : "",
          email: p.email,
          firstName: n.firstName,
          lastName: n.lastName,
          linkedinUrl: p.linkedinUrl,
        };
      }),
    [contacts],
  );

  const iconSz = density === "compact" ? 14 : 16;

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingRowId(null);
  }, [contacts]);

  useEffect(() => {
    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
      pageSize: Math.max(rows.length || 1, 1),
    }));
  }, [rows.length]);

  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set(Array.from(selectedKeys)),
    }),
    [selectedKeys],
  );

  const handleRowSelectionModelChange = useCallback(
    (model: GridRowSelectionModel) => {
      if (model.type === "exclude") {
        if (model.ids.size === 0) {
          onSelectionChange(new Set(rows.map((r) => r.id)));
          return;
        }
        const excluded = new Set(Array.from(model.ids, (id) => String(id)));
        const next = new Set<string>();
        for (const row of rows) {
          if (!excluded.has(row.id)) {
            next.add(row.id);
          }
        }
        onSelectionChange(next);
        return;
      }
      onSelectionChange(new Set(Array.from(model.ids, (id) => String(id))));
    },
    [onSelectionChange, rows],
  );

  const handleFindEmail = useCallback(
    async (row: HiringSignalContactGridRow) => {
      const fromContact = row.email.trim();
      if (fromContact) {
        onRevealRow(row.id, fromContact);
        return;
      }
      if (!row.firstName.trim()) {
        toast.error("Contact must have a first name to find email.");
        return;
      }
      if (!companyWebsite.trim()) {
        toast.error(
          "Company website is required to find email for this contact.",
        );
        return;
      }
      setLoadingRowId(row.id);
      try {
        const result = await emailService.findEmails({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          website: companyWebsite.trim(),
        });
        const emails = result.email?.findEmails?.emails ?? [];
        const found = emails[0]?.email?.trim() ?? "";
        onRevealRow(row.id, found);
      } catch (err) {
        toast.error(parseEmailServiceError(err));
        onRevealRow(row.id, "");
      } finally {
        setLoadingRowId(null);
      }
    },
    [companyWebsite, onRevealRow],
  );

  const columns = useMemo<GridColDef<HiringSignalContactGridRow>[]>(() => {
    return [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 120,
        sortable: true,
        renderCell: (
          params: GridRenderCellParams<HiringSignalContactGridRow>,
        ) => (
          <span className="c360-text-sm c360-font-medium c360-text-ink">
            {params.row.name || "—"}
          </span>
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "title",
        headerName: "Title",
        flex: 1.25,
        minWidth: 100,
        sortable: true,
        renderCell: (
          params: GridRenderCellParams<HiringSignalContactGridRow>,
        ) => (
          <span
            className="c360-line-clamp-2 c360-text-2xs c360-text-ink-muted"
            title={params.row.title || undefined}
          >
            {params.row.title?.trim() ? params.row.title : "—"}
          </span>
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "departmentsLabel",
        headerName: "Department",
        flex: 1,
        minWidth: 88,
        sortable: true,
        renderCell: (
          params: GridRenderCellParams<HiringSignalContactGridRow>,
        ) => (
          <span
            className="c360-line-clamp-2 c360-text-2xs c360-text-ink-muted"
            title={params.row.departmentsLabel || undefined}
          >
            {params.row.departmentsLabel?.trim()
              ? params.row.departmentsLabel
              : "—"}
          </span>
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 160,
        sortable: false,
        renderCell: (
          params: GridRenderCellParams<HiringSignalContactGridRow>,
        ) => (
          <HiringSignalDrawerContactEmailCell
            isRevealed={revealedRowIds.has(params.row.id)}
            resolvedEmail={resolvedEmails[params.row.id] ?? ""}
            loading={loadingRowId === params.row.id}
            onFindClick={() => {
              void handleFindEmail(params.row);
            }}
          />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0,
        width: 88,
        minWidth: 72,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (
          params: GridRenderCellParams<HiringSignalContactGridRow>,
        ) => (
          <HiringSignalsContactLinkedInCell
            linkedinUrl={params.row.linkedinUrl}
            iconSz={iconSz}
          />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
    ];
  }, [handleFindEmail, iconSz, loadingRowId, resolvedEmails, revealedRowIds]);

  return (
    <C360DataTableShell scrollClassName={scrollClassName}>
      <C360MuiThemeProvider>
        <div
          className={cn(
            "c360-hs-data-grid c360-min-h-[200px] c360-w-full",
            density === "compact" && "c360-hs-data-grid--compact",
          )}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            checkboxSelection
            disableRowSelectionExcludeModel
            disableRowSelectionOnClick
            keepNonExistentRowsSelected
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={handleRowSelectionModelChange}
            sortingMode="client"
            paginationMode="client"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            hideFooter
            loading={Boolean(loading)}
            getRowHeight={() => "auto"}
            getEstimatedRowHeight={() => (density === "compact" ? 48 : 64)}
            columnHeaderHeight={44}
            density={density === "compact" ? "compact" : "comfortable"}
            slots={{ noRowsOverlay: DrawerContactsNoRows }}
            showColumnVerticalBorder
            sx={getHiringSignalsDataGridSx(density)}
            autoHeight
          />
        </div>
      </C360MuiThemeProvider>
    </C360DataTableShell>
  );
}
