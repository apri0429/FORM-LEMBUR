import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from '../context/AuthContext';
import AppLayout, { canSeeDashboard } from '../components/layout/AppLayout';

import LoginPage from '../pages/auth/LoginPage';

const Dashboard      = lazy(() => import('../pages/dashboard/Dashboard'));
const FormLembur     = lazy(() => import('../pages/lembur/FormLembur'));
const Approval       = lazy(() => import('../pages/approval/Approval'));
const ApprovedList   = lazy(() => import('../pages/lembur/ApprovedList'));
const DetailLembur   = lazy(() => import('../pages/lembur/DetailLembur'));
const MasterKaryawan = lazy(() => import('../pages/admin/MasterKaryawan'));
const Departemen     = lazy(() => import('../pages/admin/Departemen'));
const Laporan        = lazy(() => import('../pages/laporan/Laporan'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress size={32} />
  </Box>
);

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function DashboardRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canSeeDashboard(user)) return <Navigate to="/overtime/history" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"                    element={<LoginPage />} />
        <Route path="/"                         element={<DashboardRoute><Dashboard /></DashboardRoute>} />
        <Route path="/dashboard"                element={<DashboardRoute><Dashboard /></DashboardRoute>} />

        {/* Overtime module */}
        <Route path="/overtime/new"             element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
        <Route path="/overtime/:id/edit"        element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
        <Route path="/overtime/:id"             element={<ProtectedRoute><DetailLembur /></ProtectedRoute>} />
        <Route path="/overtime/approvals"       element={<ProtectedRoute><Approval /></ProtectedRoute>} />
        <Route path="/overtime/history"         element={<ProtectedRoute><ApprovedList /></ProtectedRoute>} />

        {/* Reports module */}
        <Route path="/reports"                  element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
        <Route path="/reports/entered"          element={<ProtectedRoute><Laporan /></ProtectedRoute>} />

        {/* Admin module */}
        <Route path="/admin/employees"          element={<ProtectedRoute><MasterKaryawan /></ProtectedRoute>} />
        <Route path="/admin/departments"        element={<ProtectedRoute><Departemen /></ProtectedRoute>} />

        {/* Legacy redirects */}
        <Route path="/overtime/forms/new"           element={<Navigate to="/overtime/new" replace />} />
        <Route path="/overtime/forms/:id/edit"      element={<Navigate to="/overtime/:id/edit" replace />} />
        <Route path="/overtime/forms/:id"           element={<Navigate to="/overtime/:id" replace />} />
        <Route path="/overtime/approval"            element={<Navigate to="/overtime/approvals" replace />} />
        <Route path="/overtime/approved"            element={<Navigate to="/overtime/history" replace />} />
        <Route path="/reports/overtime"             element={<Navigate to="/reports" replace />} />
        <Route path="/reports/overtime/entered"     element={<Navigate to="/reports/entered" replace />} />
        <Route path="/approval"                     element={<Navigate to="/overtime/approvals" replace />} />
        <Route path="/approved"                     element={<Navigate to="/overtime/history" replace />} />
        <Route path="/laporan"                      element={<Navigate to="/reports" replace />} />
        <Route path="/laporan/entered"              element={<Navigate to="/reports/entered" replace />} />
        <Route path="/form/baru"                    element={<Navigate to="/overtime/new" replace />} />
        <Route path="/form/edit/:id"                element={<Navigate to="/overtime/new" replace />} />
        <Route path="/form/:id"                     element={<Navigate to="/overtime/:id" replace />} />
        <Route path="/karyawan"                     element={<Navigate to="/admin/employees" replace />} />

        <Route path="*"                             element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
