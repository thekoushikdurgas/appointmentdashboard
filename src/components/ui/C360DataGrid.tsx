"use client";

import dynamic from "next/dynamic";

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

export { DataGrid as C360DataGrid };
