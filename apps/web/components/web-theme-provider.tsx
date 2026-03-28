"use client";

import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const webTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7dd3fc",
    },
    secondary: {
      main: "#f9a8d4",
    },
    background: {
      default: "#050914",
      paper: "#0b1320",
    },
    success: {
      main: "#4ade80",
    },
    error: {
      main: "#fb7185",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontFamilyMonospace: "var(--font-mono), monospace",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

export function WebThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={webTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
