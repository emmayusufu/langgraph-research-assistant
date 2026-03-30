"use client";

import { createTheme } from "@mui/material/styles";

const shared = {
  typography: {
    fontFamily: "var(--font-noto-sans), 'Noto Sans', sans-serif",
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: {
      fontWeight: 500,
      fontSize: "0.75rem",
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
    },
    body2: { lineHeight: 1.7, fontSize: "0.9rem" },
    button: { fontWeight: 600, textTransform: "none" as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "8px 20px" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 8 },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: { main: "#0d9488", light: "#ccfbf1", dark: "#0f766e" },
    secondary: { main: "#6366f1" },
    background: { default: "#fafaf9", paper: "#ffffff" },
    text: { primary: "#1c1917", secondary: "#78716c" },
    divider: "#e7e5e4",
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#2dd4bf", light: "#042f2e", dark: "#14b8a6" },
    secondary: { main: "#818cf8" },
    background: { default: "#0c0a09", paper: "#1c1917" },
    text: { primary: "#fafaf9", secondary: "#a8a29e" },
    divider: "#292524",
  },
});
