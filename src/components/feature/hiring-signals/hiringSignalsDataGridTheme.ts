import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Shared MUI DataGrid `sx` for hiring-signals job grids (main page + drawer).
 * Keeps header band, cell flex layout, and density-specific tweaks in one place.
 */
export function getHiringSignalsDataGridSx(
  density: "comfortable" | "compact",
): SxProps<Theme> {
  return (theme: Theme) => ({
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
      justifyContent: density === "compact" ? "flex-start" : "center",
    },
    "& .MuiDataGrid-cell[data-field='avatar']": {
      justifyContent: "center",
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
  });
}
