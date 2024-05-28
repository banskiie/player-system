import { createTheme } from "@mui/material"

export const base = createTheme({
  palette: {
    primary: {
      main: "#1D1C1A",
    },
    secondary: {
      main: "#FAC898",
      dark: "#FF4500",
    },
    background: {
      default: "#FAF9F6",
    },
  },
  typography: {
    fontFamily: "Roboto",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "capitalize",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        asterisk: { color: "red" },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        asterisk: { color: "red" },
      },
    },
  },
})
