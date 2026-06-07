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

// ── Entry detail helpers ──────────────────────────────────────────────────────

export const ENTRY_FIELD_ORDER = [
  'id', 'name', 'employeeId', 'startTime', 'endTime', 'compensation', 'task', 'result',
];

export const ENTRY_FIELD_LABELS = {
  id: 'Entry ID',
  sequence: 'Sequence',
  name: 'Employee Name',
  employeeId: 'Employee ID',
  overtimeDate: 'Overtime Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  task: 'Task',
  result: 'Result',
  compensation: 'Compensation',
  approval: 'Approval',
};

const WIDE_ENTRY_FIELDS = new Set(['task', 'result']);
const HIDDEN_ENTRY_FIELDS = new Set(['sequence', 'overtimeDate', 'approval']);

function labelizeEntryKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEntryValue(key, value) {
  if (key === 'compensation') return formatKompensasi(value);
  if (key === 'approval') {
    if (value === 1 || value === true || value === '1') return 'Approved';
    if (value === 0 || value === false || value === '0') return 'Pending';
  }
  return value ?? '-';
}

export function getEntryDetailFields(entry) {
  const keys = [
    ...ENTRY_FIELD_ORDER,
    ...Object.keys(entry ?? {}).filter((key) => !ENTRY_FIELD_ORDER.includes(key)),
  ];
  return keys
    .filter((key, index, arr) => arr.indexOf(key) === index)
    .filter((key) => !HIDDEN_ENTRY_FIELDS.has(key))
    .filter((key) => Object.prototype.hasOwnProperty.call(entry ?? {}, key))
    .map((key) => ({
      key,
      label: ENTRY_FIELD_LABELS[key] ?? labelizeEntryKey(key),
      value: formatEntryValue(key, entry?.[key]),
      wide: WIDE_ENTRY_FIELDS.has(key),
      accent: key === 'compensation',
    }));
}
