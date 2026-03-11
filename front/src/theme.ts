import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8B3A2E",
      light: "#B65D4D",
      dark: "#64291F",
      contrastText: "#FFF8F4",
    },
    secondary: {
      main: "#B86A3C",
      light: "#D38A60",
      dark: "#8E4F2B",
      contrastText: "#FFF8F4",
    },
    background: {
      default: "#F6EEE8",
      paper: "#FFF9F4",
    },
    text: {
      primary: "#35211B",
      secondary: "#6B534B",
    },
    divider: "#E6D5CB",
    error: {
      main: "#B5422C",
    },
    success: {
      main: "#7A8B4B",
    },
    warning: {
      main: "#B86A3C",
    },
  },
  shape: {
    borderRadius: 0,
  },
  typography: {
    fontFamily: `"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`,
    h3: {
      fontWeight: 800,
    },
    h4: {
      fontWeight: 800,
    },
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 10px 30px rgba(101, 52, 38, 0.18)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFF9F4",
          borderRight: "1px solid #E6D5CB",
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFF9F4",
          borderColor: "#E6D5CB",
          boxShadow: "0 8px 24px rgba(86, 49, 37, 0.08)",
          borderRadius: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        containedPrimary: {
          boxShadow: "0 8px 18px rgba(139, 58, 46, 0.22)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 0,
        },
      },
    },
  },
});

export default theme;
