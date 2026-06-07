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
  '/form/baru',
  '/approval',
  '/approved',
  '/laporan',
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
    href: '/form/baru',
    icon: FilePlus,
  },
  {
    id: 'approval',
    label: 'Approval',
    href: '/approval',
    icon: ClipboardList,
  },
  {
    id: 'approved',
    label: 'Approved',
    href: '/approved',
    icon: ClipboardCheck,
  },
]

export const hrNavigationItems = [
  {
    id: 'laporan',
    label: 'Reports',
    href: '/laporan',
    icon: Chart01,
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
