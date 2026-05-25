import {
  LayoutDashboard,
  Edit03,
  FileText01,
  Calendar01,
  Users01,
  Table01,
  Settings01,
  LogOut01,
} from '../components/template/TemplateIcons.jsx'

export const defaultNavigationPath = '/dashboard'

export const implementedNavigationPaths = [
  '/',
  '/dashboard',
  '/form/baru',
  '/approval',
  '/approved',
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
    label: 'Buat Form',
    href: '/form/baru',
    icon: Edit03,
  },
  {
    id: 'approval',
    label: 'Approval',
    href: '/approval',
    icon: FileText01,
  },
  {
    id: 'approved',
    label: 'Approved',
    href: '/approved',
    icon: Calendar01,
  },
]

export const adminNavigationItems = [
  {
    id: 'master-data',
    label: 'Master Data',
    icon: Settings01,
    children: [
      { id: 'karyawan', label: 'Karyawan', href: '/admin/employees', icon: Users01 },
      { id: 'departemen', label: 'Departemen', href: '/admin/departments', icon: Table01 },
    ],
  },
]

export const secondaryNavigationItems = [
  {
    id: 'logout',
    label: 'Keluar',
    action: 'logout',
    icon: LogOut01,
    variant: 'danger',
  },
]
