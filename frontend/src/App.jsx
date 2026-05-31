import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Header from './components/template/Header';
import Sidebar from './components/template/Sidebar';
import { primaryNavigationItems, adminNavigationItems, hrNavigationItems, secondaryNavigationItems } from './services/Navigation';
import BackgroundMain from './components/template/BackgroundMain';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';

const Dashboard      = lazy(() => import('./pages/Dashboard'));
const FormLembur     = lazy(() => import('./pages/FormLembur'));
const Approval       = lazy(() => import('./pages/Approval'));
const ApprovedList   = lazy(() => import('./pages/ApprovedList'));
const DetailLembur   = lazy(() => import('./pages/DetailLembur'));
const MasterKaryawan = lazy(() => import('./pages/MasterKaryawan'));
const Departemen     = lazy(() => import('./pages/Departemen'));
const Laporan        = lazy(() => import('./pages/Laporan'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress size={32} />
  </Box>
);

/* ─── MUI Theme — Pilar Group ─────────────────────────────────── */
const muiTheme = createTheme({
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

const ROUTE_TITLES = {
  '/':               'Dashboard',
  '/form/baru':      'Buat Form Lembur',
  '/approval':       'Approval Form Lembur',
  '/approved':       'Approved Form Lembur',
  '/laporan':        'Laporan Lembur',
}

function getHeaderTitle(pathname) {
  if (pathname.startsWith('/admin/employees'))   return 'Master Data Karyawan'
  if (pathname.startsWith('/admin/departments')) return 'Master Data Departemen'
  if (pathname.startsWith('/admin'))             return 'Master Data'
  if (pathname.startsWith('/form/edit/'))        return 'Edit Form Lembur'
  if (pathname.startsWith('/form/'))             return 'Form Lembur'
  return ROUTE_TITLES[pathname] ?? 'Form Lembur'
}

/* ─── Layout ────────────────────────────────────────────────────── */
function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const shellClassName = [
    'dashboard-shell',
    collapsed ? 'dashboard-shell--sidebar-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClassName}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        activePath={pathname}
        userName={user?.fullName || 'User'}
        userRole={user?.jobPosition || user?.jobLevel || user?.department || 'Staff'}
        primaryItems={[
          ...primaryNavigationItems.filter((item) =>
            item.id !== 'dashboard' || canSeeDashboard(user)
          ),
          ...(canSeeDashboard(user) ? hrNavigationItems : []),
          ...(user?.role === 'admin' ? adminNavigationItems : []),
        ]}
        secondaryItems={secondaryNavigationItems}
        onAction={(action) => { if (action === 'logout') logout() }}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="dashboard-stage">
        <BackgroundMain />
        <Header
          title={getHeaderTitle(pathname)}
          breadcrumb={[{ label: getHeaderTitle(pathname), active: true }]}
          showMenuButton
          onMenuToggle={() => setMobileOpen((m) => !m)}
        />
        <main className="dashboard-main">
          {children}
        </main>
      </div>

      <button
        type="button"
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        aria-label="Close sidebar overlay"
        onClick={() => setMobileOpen(false)}
      />
    </div>
  );
}

const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

function isAdminOrManager(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || isBOD) return true;
  return MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );
}

function canSeeDashboard(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD;
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function DashboardRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canSeeDashboard(user)) return <Navigate to="/approved" replace />;
  return <AppLayout>{children}</AppLayout>;
}

/* ─── App ───────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login"            element={<LoginPage />} />
                <Route path="/"                 element={<DashboardRoute><Dashboard /></DashboardRoute>} />
                <Route path="/dashboard"        element={<DashboardRoute><Dashboard /></DashboardRoute>} />
                <Route path="/approval"         element={<ProtectedRoute><Approval /></ProtectedRoute>} />
                <Route path="/approved"         element={<ProtectedRoute><ApprovedList /></ProtectedRoute>} />
                <Route path="/form/baru"        element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
                <Route path="/form/edit/:id"    element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
                <Route path="/form/:id"         element={<ProtectedRoute><DetailLembur /></ProtectedRoute>} />
                <Route path="/karyawan"         element={<ProtectedRoute><MasterKaryawan /></ProtectedRoute>} />
                <Route path="/admin/employees"  element={<ProtectedRoute><MasterKaryawan /></ProtectedRoute>} />
                <Route path="/admin/departments" element={<ProtectedRoute><Departemen /></ProtectedRoute>} />
                <Route path="/laporan"          element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
                <Route path="*"                 element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
