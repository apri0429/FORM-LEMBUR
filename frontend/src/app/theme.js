import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1f4e8c',
      light: '#2f6fb2',
      dark: '#163a6b',
      '50': '#eef4fb',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f4a940',
      light: '#ffc861',
      dark: '#d4881e',
      contrastText: '#fff',
    },
    success: { main: '#2e7d32' },
    error:   { main: '#c62828' },
    warning: { main: '#f57f17', '50': '#fff8e1' },
    background: {
      default: '#f7fbff',
      paper:   '#ffffff',
    },
    text: {
      primary:   '#1a2d4a',
      secondary: '#6b7e99',
    },
    divider: '#e8eef5',
  },
  typography: { fontFamily: 'Inter, sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 24px rgba(10,25,55,0.22)',
          borderRadius: 14,
          border: '1px solid #e8eef5',
          background: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1f4e8c 0%, #2f6fb2 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #163a6b 0%, #1f4e8c 100%)' },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #f4a940 0%, #ffc861 100%)',
          color: '#fff',
          '&:hover': { background: 'linear-gradient(135deg, #d4881e 0%, #f4a940 100%)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: '#1a2d4a',
            background: '#f4f7fc',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiInputBase: {
      styleOverrides: { root: { borderRadius: '8px !important' } },
    },
    MuiAlert:  { styleOverrides: { root: { borderRadius: 10 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});

export default theme;
