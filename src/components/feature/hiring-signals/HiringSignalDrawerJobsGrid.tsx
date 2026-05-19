"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type {
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { C360MuiThemeProvider } from "@/components/ui/C360MuiThemeProvider";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { hiringSignalRowKey } from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { getHiringSignalsDataGridSx } from "@/components/feature/hiring-signals/hiringSignalsDataGridTheme";
import {
  HiringSignalsJobActionsCellLinkedInOnly,
  HiringSignalsJobLocationCell,
  HiringSignalsJobPostedCell,
  HiringSignalsJobTitleCellComfortable,
  HiringSignalsJobTitleCellCompact,
  HiringSignalsJobTypeBadgesCell,
} from "@/components/feature/hiring-signals/hiringSignalsGridCells";

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

const COL = {
  title: "Title",
  location: "Location",
  type: "Type",
  posted: "Posted",
  actions: "Actions",
} as const;

function DrawerJobsNoRows() {
  return (
    <div className="c360-flex c360-h-full c360-min-h-[120px] c360-items-center c360-justify-center c360-px-4">
      <p className="c360-table__empty c360-m-0 c360-text-sm c360-text-ink-muted">
        No jobs for this company.
      </p>
    </div>
  );
}

export interface HiringSignalDrawerJobsGridProps {
  rows: LinkedInJobRow[];
  loading?: boolean;
  density?: "comfortable" | "compact";
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  scrollClassName?: string;
}

export function HiringSignalDrawerJobsGrid({
  rows,
  loading = false,
  density = "comfortable",
  selectedKeys,
  onSelectionChange,
  scrollClassName = "c360-data-table-shell__scroll--modal c360-min-h-0",
}: HiringSignalDrawerJobsGridProps) {
  const badgeSize = density === "compact" ? "sm" : "md";
  const iconSz = density === "compact" ? 14 : 16;

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

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });

  useEffect(() => {
    setPaginationModel((prev) => ({
      ...prev,
      page: 0,
      pageSize: Math.max(rows.length || 1, 1),
    }));
  }, [rows.length]);

  const columns = useMemo<GridColDef<LinkedInJobRow>[]>(() => {
    return [
      {
        field: "title",
        headerName: COL.title,
        flex: 1.5,
        minWidth: 160,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => {
          const row = params.row;
          if (density === "compact") {
            return <HiringSignalsJobTitleCellCompact row={row} />;
          }
          return (
            <HiringSignalsJobTitleCellComfortable
              row={row}
              onOpenDescription={() => {}}
              showDescriptionButton={false}
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
        headerName: COL.location,
        flex: 1,
        minWidth: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobLocationCell row={params.row} />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "type",
        headerName: COL.type,
        flex: 0,
        width: 160,
        minWidth: 140,
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
        headerName: COL.posted,
        flex: 0,
        width: 120,
        minWidth: 110,
        sortable: true,
        sortingOrder: ["desc", "asc"],
        filterable: false,
        type: "dateTime",
        valueGetter: (_value, row) =>
          row.postedAt ? new Date(row.postedAt) : null,
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobPostedCell row={params.row} />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
      {
        field: "actions",
        headerName: COL.actions,
        flex: 0,
        width: 88,
        minWidth: 80,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params: GridRenderCellParams<LinkedInJobRow>) => (
          <HiringSignalsJobActionsCellLinkedInOnly
            row={params.row}
            iconSz={iconSz}
          />
        ),
        cellClassName: "c360-hs-grid-cell--center",
      },
    ];
  }, [badgeSize, density, iconSz]);

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
            getRowId={(row) => hiringSignalRowKey(row)}
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
            getEstimatedRowHeight={() => (density === "compact" ? 56 : 80)}
            columnHeaderHeight={44}
            density={density === "compact" ? "compact" : "comfortable"}
            slots={{ noRowsOverlay: DrawerJobsNoRows }}
            showColumnVerticalBorder
            sx={getHiringSignalsDataGridSx(density)}
            autoHeight
          />
        </div>
      </C360MuiThemeProvider>
    </C360DataTableShell>
  );
}
