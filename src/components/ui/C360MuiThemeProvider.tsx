"use client";

import * as React from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { useTheme as useC360Theme } from "@/context/ThemeContext";

/**
 * Maps Contact360 `data-theme` (light/dark) to MUI so DataGrid and peers match the app shell.
 */
export function C360MuiThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme: c360Theme } = useC360Theme();
  const mode = c360Theme === "dark" ? "dark" : "light";

  const muiTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#60a5fa" : "#2563eb",
          },
          background:
            mode === "dark"
              ? { default: "#0f1419", paper: "#151b22" }
              : { default: "#ffffff", paper: "#ffffff" },
        },
        typography: {
          fontFamily: "inherit",
          fontSize: 13,
        },
        components: {
          MuiButtonBase: {
            defaultProps: {
              disableRipple: true,
            },
          },
        },
      }),
    [mode],
  );

  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}
