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
  if (!canSeeDashboard(user)) return <Navigate to="/approved" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/"                   element={<DashboardRoute><Dashboard /></DashboardRoute>} />
        <Route path="/dashboard"          element={<DashboardRoute><Dashboard /></DashboardRoute>} />
        <Route path="/approval"           element={<ProtectedRoute><Approval /></ProtectedRoute>} />
        <Route path="/approved"           element={<ProtectedRoute><ApprovedList /></ProtectedRoute>} />
        <Route path="/form/baru"          element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
        <Route path="/form/edit/:id"      element={<ProtectedRoute><FormLembur /></ProtectedRoute>} />
        <Route path="/form/:id"           element={<ProtectedRoute><DetailLembur /></ProtectedRoute>} />
        <Route path="/karyawan"           element={<ProtectedRoute><MasterKaryawan /></ProtectedRoute>} />
        <Route path="/admin/employees"    element={<ProtectedRoute><MasterKaryawan /></ProtectedRoute>} />
        <Route path="/admin/departments"  element={<ProtectedRoute><Departemen /></ProtectedRoute>} />
        <Route path="/laporan"            element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
