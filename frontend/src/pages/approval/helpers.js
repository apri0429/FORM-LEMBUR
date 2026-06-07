import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';

export const ROWS_OPTIONS = [10, 25, 50, 100];
export const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
export const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

export const FORM_TYPE_CHIP_MAP = {
  staff:        { label: 'Staff',        color: '#1a2a57', bg: 'rgba(26,42,87,0.13)',    icon: BadgeRoundedIcon },
  manager:      { label: 'Manager',      color: '#0163a0', bg: 'rgba(2,119,189,0.28)',   icon: ManageAccountsRoundedIcon },
  outsourcing:  { label: 'Outsourcing',  color: '#bf4300', bg: 'rgba(230,81,0,0.22)',    icon: WorkRoundedIcon },
  harian_lepas: { label: 'Daily Worker', color: '#5a1488', bg: 'rgba(106,27,154,0.22)', icon: EventNoteRoundedIcon },
};

export function formatKompensasi(value) {
  return String(value ?? '').trim() || '-';
}

export function formatLemburPada(value) {
  return String(value ?? '').trim() || '-';
}

export function getKompensasiSummary(form) {
  const values = form.entries
    ?.map((e) => formatKompensasi(e.compensation))
    .filter((v) => v !== '-') || [];
  if (!values.length) return '-';
  const unique = [...new Set(values)];
  if (unique.length <= 2) return unique.join(', ');
  return `${unique.slice(0, 2).join(', ')} +${unique.length - 2} lainnya`;
}

export function isBODUser(user) {
  if (!user) return false;
  return BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
}

export function isAdminUser(user) {
  if (!user) return false;
  return user.role === 'admin' || user.department === 'IT' || isBODUser(user);
}

export function isManagerUser(user) {
  if (!user) return false;
  const pos = String(user.jobPosition || '').toLowerCase();
  const lvl = String(user.jobLevel || '').toLowerCase();
  return MANAGER_KEYWORDS.some((k) => pos.includes(k) || lvl.includes(k));
}
