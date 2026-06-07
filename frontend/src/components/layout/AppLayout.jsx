import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';
import BackgroundMain from './BackgroundMain';
import { useAuth } from '../../context/AuthContext';
import {
  primaryNavigationItems,
  adminNavigationItems,
  hrNavigationItems,
  secondaryNavigationItems,
} from '../../services/navigation';

const ROUTE_TITLES = {
  '/':          'Dashboard',
  '/form/baru': 'Buat Form Lembur',
  '/approval':  'Approval Form Lembur',
  '/approved':  'Approved Form Lembur',
  '/laporan':   'Laporan Lembur',
};

function getHeaderTitle(pathname) {
  if (pathname.startsWith('/admin/employees'))   return 'Master Data Karyawan';
  if (pathname.startsWith('/admin/departments')) return 'Master Data Departemen';
  if (pathname.startsWith('/admin'))             return 'Master Data';
  if (pathname.startsWith('/form/edit/'))        return 'Edit Form Lembur';
  if (pathname.startsWith('/form/'))             return 'Form Lembur';
  return ROUTE_TITLES[pathname] ?? 'Form Lembur';
}

const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

export function isAdminOrManager(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || isBOD) return true;
  return MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );
}

export function canSeeDashboard(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD;
}

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const shellClassName = ['dashboard-shell', collapsed ? 'dashboard-shell--sidebar-collapsed' : '']
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
        onAction={(action) => { if (action === 'logout') logout(); }}
        onToggleCollapse={() => setCollapsed((c) => !c)}
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
