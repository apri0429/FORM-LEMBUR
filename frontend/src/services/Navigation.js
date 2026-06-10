import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  ClipboardCheck,
  Users01,
  Table01,
  Settings01,
  Chart01,
  LogOut01,
} from '../components/layout/icons.jsx'

export const defaultNavigationPath = '/dashboard'

export const implementedNavigationPaths = [
  '/',
  '/dashboard',
  '/overtime/new',
  '/overtime/approvals',
  '/overtime/history',
  '/reports',
  '/reports/entered',
  '/admin/employees',
  '/admin/departments',
]

export const primaryNavigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'buat-form',
    label: 'Create Form',
    href: '/overtime/new',
    icon: FilePlus,
  },
  {
    id: 'approval',
    label: 'Approval',
    href: '/overtime/approvals',
    icon: ClipboardList,
  },
  {
    id: 'approved',
    label: 'Approved',
    href: '/overtime/history',
    icon: ClipboardCheck,
  },
]

export const hrNavigationItems = [
  {
    id: 'laporan',
    label: 'Reports',
    icon: Chart01,
    children: [
      { id: 'laporan-pending',  label: 'Overtime Report',      href: '/reports' },
      { id: 'laporan-entered',  label: 'Entered in Talenta',   href: '/reports/entered' },
    ],
  },
]

export const adminNavigationItems = [
  {
    id: 'master-data',
    label: 'Master Data',
    icon: Settings01,
    children: [
      { id: 'karyawan', label: 'Employees', href: '/admin/employees', icon: Users01 },
      { id: 'departemen', label: 'Departments', href: '/admin/departments', icon: Table01 },
    ],
  },
]

export const secondaryNavigationItems = [
  {
    id: 'logout',
    label: 'Logout',
    action: 'logout',
    icon: LogOut01,
    variant: 'danger',
  },
]
