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
  '/':                     'Dashboard',
  '/dashboard':            'Dashboard',
  '/overtime/new':         'New Overtime Request',
  '/overtime/approvals':   'Overtime Approvals',
  '/overtime/history':     'Overtime History',
  '/reports':              'Overtime Report',
  '/reports/entered':      'Entered in Talenta',
};

function getHeaderTitle(pathname) {
  if (pathname.startsWith('/admin/employees'))                        return 'Employee Master Data';
  if (pathname.startsWith('/admin/departments'))                      return 'Department Master Data';
  if (pathname.startsWith('/admin'))                                  return 'Master Data';
  if (pathname.startsWith('/overtime/') && pathname.endsWith('/edit')) return 'Edit Overtime Request';
  if (pathname.startsWith('/overtime/') && pathname !== '/overtime/new'
    && pathname !== '/overtime/approvals' && pathname !== '/overtime/history')
                                                                      return 'Overtime Request Detail';
  return ROUTE_TITLES[pathname] ?? 'Overtime Management';
}

export function canSeeDashboard(user) {
  if (!user) return false;
  return Boolean(user.canSeeDashboard);
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
          ...(user?.canSeeReports ? hrNavigationItems : []),
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
