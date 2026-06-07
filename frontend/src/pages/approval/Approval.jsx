import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CardBigBox from '../../components/ui/CardBigBox';
import CreateButton from '../../components/ui/CreateButton';
import DataTable, { DataTableStatus } from '../../piagam/table/DataTable';
import {
  ChevronDown,
  Check,
  SearchMd,
  XClose,
  ClipboardCheck,
} from '../../components/layout/icons';
import { useAuth } from '../../context/AuthContext';
import {
  ROWS_OPTIONS,
  FORM_TYPE_CHIP_MAP,
  formatKompensasi,
  formatLemburPada,
  getKompensasiSummary,
  isAdminUser as isAdminUserHelper,
  isManagerUser as isManagerUserHelper,
} from './helpers';

const API = '/api/overtime';

const pageSx = {
  height: '100%',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  overflow: 'hidden',
  '& .approval-main-panel': {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};

const selectSx = {
  width: '100%',
  minWidth: '100%',
  '& .MuiOutlinedInput-root': {
    width: '100%',
    height: 44,
    borderRadius: '22px',
    bgcolor: '#eef2f6',
    boxShadow: 'none',
    '& .MuiOutlinedInput-notchedOutline': {
      border: '1.5px solid rgba(26,42,87,0.11)',
      borderRadius: '22px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(42,157,143,0.4)',
    },
    '&.Mui-focused': {
      bgcolor: '#fff',
      boxShadow: '0 0 0 3px rgba(42,157,143,0.14)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(42,157,143,0.6) !important',
      borderWidth: '1.5px !important',
    },
  },
  '& .MuiInputBase-root': { width: '100%' },
  '& .MuiSelect-select': {
    display: 'block', width: '100%', minWidth: 0,
    py: '0 !important', pl: '4px !important', pr: '36px !important',
    height: '44px !important', lineHeight: '44px', boxSizing: 'border-box', textOverflow: 'ellipsis',
  },
  '& .MuiSelect-icon': { color: '#6b7a90', right: 12 },
};

function SelectFilter({ value, onChange, options, icon: Icon, placeholder, forceDown = false }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const wrapRef = useRef(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = 248;
    const openUp = !forceDown && spaceBelow < dropHeight + 8 && rect.top > dropHeight + 8;
    setDropPos({
      top: openUp ? null : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : null,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  };

  useEffect(() => {
    if (!open) return;
    calcPos();
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        wrapRef.current && !wrapRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = () => calcPos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="sf-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={`sf-trigger${open ? ' sf-trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {Icon && <span className="sf-icon-left"><Icon style={{ fontSize: 18 }} /></span>}
        <span className="sf-value">
          {selectedLabel ?? <em>{placeholder}</em>}
        </span>
        <ChevronDown size={16} className="sf-chevron" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={wrapRef}
          className="sf-dropdown"
          role="listbox"
          style={{
            position: 'fixed',
            ...(dropPos.openUp
              ? { bottom: dropPos.bottom, top: 'auto' }
              : { top: dropPos.top, bottom: 'auto' }
            ),
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
          }}
        >
          {placeholder && (
            <button
              type="button"
              className={`sf-option sf-option--placeholder${value === '' ? ' sf-option--active' : ''}`}
              role="option"
              aria-selected={value === ''}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sf-option${value === opt.value ? ' sf-option--active' : ''}`}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
              {value === opt.value && <Check size={14} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function RowsFilter({ rowsPerPage, onChange }) {
  return (
    <div className="approval-desktop-rows">
      <span className="approval-unified-pagination__label">View</span>
      <SelectFilter
        value={String(rowsPerPage)}
        onChange={onChange}
        options={ROWS_OPTIONS.map((r) => ({ value: String(r), label: String(r) }))}
      />
      <span className="approval-unified-pagination__label">rows</span>
    </div>
  );
}

function FormTypeBadge({ jenisForm }) {
  const cfg = FORM_TYPE_CHIP_MAP[jenisForm];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 24, padding: '0 8px', borderRadius: 12,
      fontSize: '0.8125rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      <Icon style={{ fontSize: 14, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

const STATUS_CHIP_MAP = {
  approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Approved L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending: {
    label: 'Pending',
    color: 'default',
    icon: <PendingActionsRoundedIcon fontSize="small" />,
    sx: { bgcolor: 'rgba(234,179,8,0.18)', color: '#92640a', '& .MuiChip-icon': { color: '#b07d0c' } },
  },
  rejected: { label: 'Rejected', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

const ENTRY_FIELD_ORDER = [
  'id',
  'name',
  'employeeId',
  'startTime',
  'endTime',
  'compensation',
  'task',
  'result',
];

const ENTRY_FIELD_LABELS = {
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

function getEntryDetailFields(entry) {
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

function ApprovalStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} sx={config.sx} />;
}

export default function Approval() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────
  const [forms, setForms]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [divisiOptions, setDivisiOptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialog, setDialog]     = useState({ open: false, form: null, action: '', entryIndices: null });
  const [detailForm, setDetailForm] = useState(null);
  const [selectedEntryIndices, setSelectedEntryIndices] = useState(new Set());
  const [catatan, setCatatan]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch]               = useState('');
  const [filterDivisi, setFilterDivisi]   = useState('');
  const [filterJenisForm, setFilterJenisForm] = useState('');
  const [page, setPage]                   = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const successTimerRef = useRef(null);

  // ── Derived ────────────────────────────────────────────────────
  const isAdmin   = isAdminUserHelper(user);
  const isManager = isManagerUserHelper(user);
  const totalForms  = total;
  const totalPages  = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage    = Math.min(page, totalPages);
  const isEmptyState = !loading && forms.length === 0;

  const jenisFormOptions = Object.keys(FORM_TYPE_CHIP_MAP);

  const canUserAct = (form) => {
    if (isAdmin) return true;
    if (form.formType === 'manager') return false;
    if (isManager && form.department === user?.department) return true;
    return form.requestedBy === user?.fullName;
  };

  const getDivisiLabel = (form) => form?.divisi || form?.department || form?.divisionCode || '-';

  // ── Toast timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!success) return;
    successTimerRef.current = setTimeout(() => setSuccess(''), 4500);
    return () => clearTimeout(successTimerRef.current);
  }, [success]);

  // ── Fetch department options once ──────────────────────────────
  useEffect(() => {
    axios.get(`${API}/filter-options?status=pending`)
      .then((r) => setDivisiOptions(r.data.data?.departments || []))
      .catch(() => {});
  }, []);

  // ── Server-side fetch with debounce on search ──────────────────
  useEffect(() => {
    const params = new URLSearchParams({
      status:      'pending',
      page:        String(page),
      rowsPerPage: String(rowsPerPage),
    });
    if (search)          params.set('search',     search);
    if (filterDivisi)    params.set('department', filterDivisi);
    if (filterJenisForm) params.set('formType',   filterJenisForm);

    const delay = search ? 350 : 0;
    const timer = setTimeout(() => {
      setLoading(true);
      axios.get(`${API}?${params}`)
        .then((r) => {
          setForms(r.data.data || []);
          setTotal(r.data.total || 0);
        })
        .catch(() => setError('Failed to load data. Please make sure the backend server is running.'))
        .finally(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, filterDivisi, filterJenisForm, refreshKey]);

  // ── Detail popup: pre-select all entries ──────────────────────
  useEffect(() => {
    if (!detailForm) return;
    setSelectedEntryIndices(new Set(detailForm.entries?.map((_, i) => i) ?? []));
  }, [detailForm]);

  const openDialog = (form, action) => {
    setDialog({ open: true, form, action, entryIndices: null });
    setCatatan('');
  };

  const openDialogFromDetail = (form, action) => {
    const indices = action === 'approve' ? [...selectedEntryIndices] : null;
    setDetailForm(null);
    setDialog({ open: true, form, action, entryIndices: indices });
    setCatatan('');
  };

  const closeDialog = () => setDialog({ open: false, form: null, action: '', entryIndices: null });

  const toggleEntry = (idx) => {
    setSelectedEntryIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    const total = detailForm?.entries?.length ?? 0;
    if (selectedEntryIndices.size === total) {
      setSelectedEntryIndices(new Set());
    } else {
      setSelectedEntryIndices(new Set(Array.from({ length: total }, (_, i) => i)));
    }
  };

  const handleApproval = async () => {
    if (!dialog.form) return;
    setSubmitting(true);
    try {
      const isApproveAction = dialog.action === 'approve';
      const endpoint = `${API}/${dialog.form.id}/${isApproveAction ? 'approve' : 'reject'}`;
      const body = { approvalNotes: catatan, approvedBy: user?.fullName };
      if (isApproveAction && dialog.entryIndices) {
        body.approvedEntryIndices = dialog.entryIndices;
      }
      await axios.post(endpoint, body);
      setSuccess(`Form ${dialog.form.formNumber} - ${isApproveAction ? 'Approved' : 'Rejected'}`);
      closeDialog();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to process approval.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Piagam DataTable: columns ────────────────────────────────────────────
  const tableColumns = [
    {
      key: 'formNumber',
      header: 'No. Form',
      cellStyle: { whiteSpace: 'nowrap' },
      render: (form) => (
        <strong style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.88rem' }}>
          {form.formNumber}
        </strong>
      ),
    },
    {
      key: 'submissionDate',
      header: 'Submit Date',
      accessor: 'submissionDate',
      cellStyle: { whiteSpace: 'nowrap' },
    },
    {
      key: 'department',
      header: 'Department',
      render: (form) => <strong style={{ fontSize: '0.85rem' }}>{form.department || '-'}</strong>,
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      render: (form) => <span style={{ fontSize: '0.85rem' }}>{form.requestedBy || '-'}</span>,
    },
    {
      key: 'jumlahKaryawan',
      header: 'Employees',
      render: (form) => (
        <DataTableStatus variant="app" inline>
          {form.entries?.length || 0}
        </DataTableStatus>
      ),
      cellStyle: { textAlign: 'center', whiteSpace: 'nowrap' },
    },
    {
      key: 'aksi',
      header: 'Actions',
      cellStyle: { whiteSpace: 'nowrap', width: '1%' },
      render: (form) => (
        <div className="users-table__action-group" style={{ display: 'flex', gap: 6 }}>
          <CreateButton
            variant="icon"
            title="Lihat Detail"
            aria-label="Lihat Detail"
            onClick={(e) => { e.stopPropagation(); setDetailForm(form); }}
          >
            <ClipboardCheck size={16} />
          </CreateButton>
          <CreateButton
            variant="icon"
            title="Edit Form"
            aria-label="Edit Form"
            style={{ borderColor: 'rgba(212,136,30,0.35)', color: '#b8750f', background: 'rgba(244,169,64,0.07)' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/form/edit/${form.id}`); }}
          >
            <EditRoundedIcon style={{ fontSize: 16 }} />
          </CreateButton>
        </div>
      ),
    },
  ];

  // ── Piagam DataTable: expandable entri ───────────────────────────────────
  const tableDetail = {
    eyebrow: false,
    title: false,
    columnLabel: 'Entries',
    buttonLabel: 'Entries',
    render: (form) => (
      <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <ApprovalStatusChip status={form.status} />
          <FormTypeBadge jenisForm={form.formType} />
        </div>

        {(form.entries ?? []).length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.88rem', margin: '8px 0 0' }}>No entries found</p>
        ) : (
          <div className="users-table__detail-shell entry-detail-shell" style={{ maxHeight: 320, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {(form.entries ?? []).map((entry, idx) => (
              <div key={idx} className="users-table__detail-section">
                <dl className="users-table__detail-list">
                  {getEntryDetailFields(entry).map((field) => (
                    <div
                      key={field.key}
                      className={`users-table__detail-row${field.wide ? ' users-table__detail-row--stacked' : ''}`}
                    >
                      <dt className="users-table__detail-label">{field.label}</dt>
                      <dd className="users-table__detail-field">
                        <span className="users-table__detail-value" style={field.accent ? { color: '#6d3fa0' } : undefined}>
                          {field.value}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <dl className="users-table__detail-list" style={{ display: 'none' }}>
                  <div className="users-table__detail-row">
                    <dt className="users-table__detail-label">Date</dt>
                    <dd className="users-table__detail-field">
                      <span className="users-table__detail-value">{entry.overtimeDate || '-'}</span>
                    </dd>
                  </div>
                  <div className="users-table__detail-row">
                    <dt className="users-table__detail-label">Time</dt>
                    <dd className="users-table__detail-field">
                      <span className="users-table__detail-value">{entry.startTime} – {entry.endTime}</span>
                    </dd>
                  </div>
                  <div className="users-table__detail-row">
                    <dt className="users-table__detail-label">Compensation</dt>
                    <dd className="users-table__detail-field">
                      <span className="users-table__detail-value" style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.compensation)}</span>
                    </dd>
                  </div>
                  {entry.task && (
                    <div className="users-table__detail-row users-table__detail-row--stacked">
                      <dt className="users-table__detail-label">Task</dt>
                      <dd className="users-table__detail-field">
                        <span className="users-table__detail-value">{entry.task}</span>
                      </dd>
                    </div>
                  )}
                  {entry.result && (
                    <div className="users-table__detail-row users-table__detail-row--stacked">
                      <dt className="users-table__detail-label">Result</dt>
                      <dd className="users-table__detail-field">
                        <span className="users-table__detail-value">{entry.result}</span>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        )}
      </>
    ),
    actions: [
      {
        key: 'approve',
        label: 'Approve',
        hidden: (form) => !canUserAct(form),
        onClick: (form) => openDialog(form, 'approve'),
      },
      {
        key: 'reject',
        label: 'Reject',
        variant: 'danger',
        hidden: (form) => !canUserAct(form),
        onClick: (form) => openDialog(form, 'reject'),
      },
    ],
  };

  // ── Piagam DataTable: pagination ─────────────────────────────────────────
  const buildPaginationItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    if (safePage > 3) items.push('...');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      items.push(i);
    }
    if (safePage < totalPages - 2) items.push('...');
    items.push(totalPages);
    return items;
  };

  const tablePagination = totalForms > 0 ? {
    summary: `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, totalForms)} of ${totalForms}`,
    currentPage: safePage,
    totalPages,
    pageSize: rowsPerPage,
    pageSizeOptions: ROWS_OPTIONS,
    pageSizeLabel: 'Show',
    pageSizeSuffix: 'rows',
    onPageSizeChange: (v) => { setRowsPerPage(Number(v)); setPage(1); },
    onPrevious: () => setPage((p) => Math.max(1, p - 1)),
    onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
    onSelect: (pageNum) => setPage(pageNum),
    previousLabel: 'Previous',
    nextLabel: 'Next',
    items: buildPaginationItems(),
    pageSizeNode: <RowsFilter rowsPerPage={rowsPerPage} onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }} />,
  } : null;

  // ── Empty state ───────────────────────────────────────────────────────────
  const isFiltered = Boolean(search || filterDivisi || filterJenisForm);
  const emptyState = isFiltered
    ? {
      title: 'No results found',
      description: 'No forms match your current search or filter criteria.',
      icon: <SearchOffRoundedIcon className="approval-empty__check" />,
      showReset: true,
    }
    : {
      title: 'All caught up',
      description: 'There are no overtime forms waiting for approval right now.',
      icon: <CheckCircleIcon className="approval-empty__check" />,
      showReset: false,
    };

  // ── Toast accent ──────────────────────────────────────────────────────────
  const isRejectToast = success.includes('Rejected');
  const toastTitle = isRejectToast ? 'Form Rejected' : 'Form Approved';
  const toastAccent = isRejectToast
    ? {
      bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
      soft: 'rgba(254, 226, 226, 0.18)',
      border: 'rgba(255,255,255,0.18)',
      icon: <CancelIcon sx={{ fontSize: 18, color: '#fecaca' }} />,
    }
    : {
      bg: 'linear-gradient(145deg, #059669 0%, #10b981 55%, #34d399 100%)',
      soft: 'rgba(255, 255, 255, 0.16)',
      border: 'rgba(255,255,255,0.18)',
      icon: <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} />,
    };

  const isApprove = dialog.action === 'approve';
  const selectedCount = selectedEntryIndices.size;
  const totalEntries = detailForm?.entries?.length ?? 0;
  const isAllSelected = selectedCount === totalEntries;
  const approveLabel = isAllSelected
    ? 'Approve All'
    : `Approve (${selectedCount}/${totalEntries})`;

  // ── Filter card ───────────────────────────────────────────────────────────
  const filterCard = (
    <CardBigBox>
      <button
        type="button"
        className="approval-filter-card__toggle--icon"
        onClick={() => setMobileFilterOpen((p) => !p)}
        aria-expanded={mobileFilterOpen}
      >
        <span className="approval-filter-card__toggle--icon-label">
          <FilterListRoundedIcon style={{ fontSize: 16 }} />
          Filter & Search
        </span>
        <ChevronDown size={15} style={{ transition: 'transform 0.22s', transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>
      <div className={`approval-filter-card__fields${mobileFilterOpen ? ' approval-filter-card__fields--mobile-open' : ''}`} style={{ padding: '4px 0' }}>
        <div className="approval-filter-card__field approval-filter-card__field--search">
          <span className="approval-filter-card__label">Search</span>
          <div className="approval-filter-card__input-wrap">
            <span className="approval-filter-card__icon"><SearchMd size={18} /></span>
            <input
              type="text"
              className="approval-filter-card__input"
              placeholder="Search form no. or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="approval-filter-card__field" style={{ flex: '1 1 240px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Department</span>
          <SelectFilter
            value={filterDivisi}
            onChange={(v) => { setFilterDivisi(v); setPage(1); }}
            placeholder="All Departments"
            icon={ApartmentRoundedIcon}
            options={divisiOptions.map((d) => ({ value: d, label: d }))}
          />
        </div>

        <div className="approval-filter-card__field" style={{ flex: '1 1 240px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Form Type</span>
          <SelectFilter
            value={filterJenisForm}
            onChange={(v) => { setFilterJenisForm(v); setPage(1); }}
            placeholder="All Form Types"
            icon={AssignmentIndRoundedIcon}
            options={jenisFormOptions.map((j) => ({
              value: j,
              label: FORM_TYPE_CHIP_MAP[j]?.label ?? j,
            }))}
          />
        </div>
      </div>
    </CardBigBox>
  );

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          )}

          {filterCard}

          <CardBigBox
            eyebrow="Form List"
            title="Approval Queue"
            className={`dashboard-panel--scroll approval-main-panel${isEmptyState ? ' approval-main-panel--empty' : ''}`}
            contentClassName={`approval-panel-body${isEmptyState ? ' approval-panel-body--empty' : ''}`}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : forms.length === 0 ? (
              <div className="approval-empty-state">
                <div className="approval-empty">
                  <div className="approval-empty__body">
                    <div className="approval-empty__card">
                      <div className="approval-empty__visual">
                        <div className="approval-empty__ring">
                          <div className="approval-empty__ring-inner">
                            {emptyState.icon}
                          </div>
                        </div>
                      </div>
                      <div className="approval-empty__content">
                        <p className="approval-empty__title">{emptyState.title}</p>
                        <p className="approval-empty__desc">{emptyState.description}</p>
                        {emptyState.showReset && (
                          <button
                            type="button"
                            className="approval-empty__reset"
                            onClick={() => { setSearch(''); setFilterDivisi(''); setFilterJenisForm(''); setPage(1); }}
                          >
                            <XClose size={14} />
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: piagam DataTable */}
                <div className="approval-desktop-table">
                  <DataTable
                    rows={forms}
                    columns={tableColumns}
                    getRowId={(form) => form.id}
                    detail={tableDetail}
                    pagination={tablePagination}
                    tableLabel="Approval Queue"
                  />
                </div>

                {/* Mobile: card layout */}
                <div className="approval-mobile-cards">
                  {forms.map((form) => (
                    <div key={form.id} className="approval-mob-card">
                      <div className="approval-mob-card__top">
                        <div className="approval-mob-card__info">
                          <strong className="approval-mob-card__form-no">{form.formNumber}</strong>
                          <div className="approval-mob-card__badges">
                            <ApprovalStatusChip status={form.status} />
                            <FormTypeBadge jenisForm={form.formType} />
                          </div>
                        </div>
                        <div className="approval-mob-card__actions">
                          <CreateButton
                            variant="icon"
                            title="View Detail"
                            aria-label="View Detail"
                            onClick={() => setDetailForm(form)}
                          >
                            <ClipboardCheck size={16} />
                          </CreateButton>
                          <CreateButton
                            variant="icon"
                            title="Edit Form"
                            aria-label="Edit Form"
                            style={{ borderColor: 'rgba(212,136,30,0.35)', color: '#b8750f', background: 'rgba(244,169,64,0.07)' }}
                            onClick={() => navigate(`/form/edit/${form.id}`)}
                          >
                            <EditRoundedIcon style={{ fontSize: 16 }} />
                          </CreateButton>
                        </div>
                      </div>

                      <div className="approval-mob-card__meta">
                        {[
                          { label: 'Department', value: form.department || '-' },
                          { label: 'Requested By', value: form.requestedBy || '-' },
                          { label: 'Submit Date', value: form.submissionDate || '-' },
                          { label: 'Employees', value: `${form.entries?.length || 0}` },
                        ].map(({ label, value }) => (
                          <div key={label} className="approval-mob-card__meta-item">
                            <span className="approval-mob-card__meta-label">{label}</span>
                            <span className="approval-mob-card__meta-value">{value}</span>
                          </div>
                        ))}
                      </div>

                      {canUserAct(form) && (
                        <div className="approval-mob-card__footer">
                          <CreateButton variant="accordion" onClick={() => openDialog(form, 'approve')}>
                            <CheckCircleIcon style={{ fontSize: 15 }} />
                            Approve
                          </CreateButton>
                          <CreateButton variant="accordion" tone="danger" onClick={() => openDialog(form, 'reject')}>
                            <CancelIcon style={{ fontSize: 15 }} />
                            Reject
                          </CreateButton>
                        </div>
                      )}
                    </div>
                  ))}

                </div>

                {/* Mobile pagination with row selector */}
                {totalForms > 0 && (
                  <div className="approval-mob-pagination">
                    <div className="approval-mob-pagination__rows">
                      <span className="approval-unified-pagination__label">Show</span>
                      <SelectFilter
                        value={String(rowsPerPage)}
                        onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }}
                        options={ROWS_OPTIONS.map((r) => ({ value: String(r), label: String(r) }))}
                      />
                      <span className="approval-unified-pagination__label">rows</span>
                    </div>
                    <div className="approval-mob-pagination__btns">
                      <CreateButton variant="pagination" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                        Previous
                      </CreateButton>
                      <CreateButton variant="pagination" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                        Next
                      </CreateButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>

      {/* Form detail popup */}
      {detailForm && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => setDetailForm(null)}>
          <div
            className="dashboard-popup dashboard-popup--frp-detail"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Overtime Form Detail</p>
                <h2 className="dashboard-popup__title">{detailForm.formNumber}</h2>
              </div>
              <button
                type="button"
                className="dashboard-popup__close"
                aria-label="Close"
                onClick={() => setDetailForm(null)}
              >
                <XClose size={18} />
              </button>
            </div>

            <div className="dashboard-popup__body--frp-detail" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                className="approval-detail-summary"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {[
                  { label: 'Department', value: detailForm.department },
                  { label: 'Requested By', value: detailForm.requestedBy },
                  { label: 'Submit Date', value: detailForm.submissionDate },
                  { label: 'OT Day', value: formatLemburPada(detailForm.overtimeDay) },
                  { label: 'Division', value: getDivisiLabel(detailForm) },
                  { label: 'Compensation', value: getKompensasiSummary(detailForm) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      padding: '10px 14px',
                      border: '1px solid rgba(26,42,87,0.08)',
                      borderRadius: 12,
                      background: 'rgba(248,250,252,0.95)',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7f7f7f', marginBottom: 4 }}>
                      {label}
                    </p>
                    <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem', wordBreak: 'break-word', overflowWrap: 'break-word', display: 'block' }}>{value || '-'}</strong>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
                  <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                    Overtime Entries — {totalEntries} employees
                  </p>
                  {totalEntries > 1 && (
                    <span style={{ fontSize: '0.78rem', color: selectedCount === 0 ? '#ef4444' : '#2a9d8f', fontWeight: 600 }}>
                      {selectedCount === 0 ? 'None selected' : `${selectedCount} selected`}
                    </span>
                  )}
                </div>

                <div className="approval-table-scroll-outer">
                  <div
                    className="approval-detail-table-wrapper"
                    style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
                  >
                  <div className="approval-mobile-sticky-header">
                    <span>Overtime Entries</span>
                    <span className="approval-mobile-sticky-header__count">{totalEntries} employees</span>
                  </div>
                  <table className="users-table approval-mobile-table">
                    <thead>
                      <tr>
                        {totalEntries > 1 && (
                          <th style={{ width: 44, textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isAllSelected && totalEntries > 0}
                              ref={(el) => {
                                if (el) el.indeterminate = selectedCount > 0 && !isAllSelected;
                              }}
                              onChange={handleSelectAll}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                              title="Select all"
                            />
                          </th>
                        )}
                        <th>No</th>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th>OT Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Task</th>
                        <th>Result</th>
                        <th>Compensation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailForm.entries?.map((entry, idx) => {
                        const isChecked = selectedEntryIndices.has(idx);
                        return (
                          <tr
                            key={idx}
                            style={{
                              opacity: totalEntries > 1 && !isChecked ? 0.45 : 1,
                              transition: 'opacity 0.15s',
                              cursor: totalEntries > 1 ? 'pointer' : 'default',
                            }}
                            onClick={totalEntries > 1 ? () => toggleEntry(idx) : undefined}
                          >
                            {totalEntries > 1 && (
                              <td data-label="Select" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEntry(idx)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                              </td>
                            )}
                            <td data-label="No" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{idx + 1}</td>
                            <td data-label="Employee Name"><strong className="users-table__name">{entry.name}</strong></td>
                            <td data-label="Employee ID">
                              <span className="users-table__status users-table__status--inline users-table__status--app">
                                {entry.employeeId}
                              </span>
                            </td>
                            <td data-label="Overtime Date">{entry.overtimeDate}</td>
                            <td data-label="Start Time">{entry.startTime}</td>
                            <td data-label="End Time">{entry.endTime}</td>
                            <td data-label="Task">{entry.task}</td>
                            <td data-label="Result">{entry.result}</td>
                            <td data-label="Compensation">
                              <strong style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.compensation)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-popup__actions" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
              {canUserAct(detailForm) ? (
                <>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--danger"
                    onClick={() => openDialogFromDetail(detailForm, 'reject')}
                  >
                    <CancelIcon sx={{ fontSize: 16 }} />
                    Reject
                  </button>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--primary"
                    onClick={() => openDialogFromDetail(detailForm, 'approve')}
                    disabled={selectedCount === 0}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                    {approveLabel}
                  </button>
                </>
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#7f7f7f', fontStyle: 'italic' }}>
                  You can only view this form
                </span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success toast — animated */}
      {success && (
        <Box sx={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1400, width: 420, minWidth: 420, maxWidth: 420,
          display: { xs: 'none', sm: 'block' },
          '@keyframes certIn':    { '0%': { opacity:0, transform:'translate(-50%,-50%) scale(0.82)' }, '60%': { opacity:1, transform:'translate(-50%,-50%) scale(1.03)' }, '100%': { opacity:1, transform:'translate(-50%,-50%) scale(1)' } },
          '@keyframes certOut':   { from: { opacity:1, transform:'translate(-50%,-50%) scale(1)' }, to: { opacity:0, transform:'translate(-50%,-50%) scale(0.9)' } },
          '@keyframes iconPop':   { '0%': { transform:'scale(0) rotate(-30deg)' }, '55%': { transform:'scale(1.18) rotate(6deg)' }, '75%': { transform:'scale(0.92) rotate(-2deg)' }, '100%': { transform:'scale(1) rotate(0deg)' } },
          '@keyframes iconPulseG':{ '0%,100%': { boxShadow:'0 4px 16px rgba(42,157,143,0.5),0 0 0 0 rgba(42,157,143,0.5)' }, '50%': { boxShadow:'0 4px 16px rgba(42,157,143,0.5),0 0 0 10px rgba(42,157,143,0)' } },
          '@keyframes iconPulseR':{ '0%,100%': { boxShadow:'0 4px 16px rgba(220,38,38,0.5),0 0 0 0 rgba(220,38,38,0.5)' }, '50%': { boxShadow:'0 4px 16px rgba(220,38,38,0.5),0 0 0 10px rgba(220,38,38,0)' } },
          '@keyframes shimmer':   { '0%': { backgroundPosition:'-600px 0' }, '100%': { backgroundPosition:'600px 0' } },
          '@keyframes countDown': { '0%': { width:'100%' }, '100%': { width:'0%' } },
          '@keyframes dotBounce': { '0%,80%,100%': { transform:'scale(1)', opacity:0.35 }, '40%': { transform:'scale(1.6)', opacity:1 } },
          '@keyframes floatUp1':  { '0%': { transform:'translateY(0) scale(1)', opacity:0.7 }, '100%': { transform:'translateY(-22px) scale(0.4)', opacity:0 } },
          '@keyframes floatUp2':  { '0%': { transform:'translateY(0) scale(1)', opacity:0.6 }, '100%': { transform:'translateY(-28px) scale(0.3)', opacity:0 } },
          animation: 'certIn 0.6s cubic-bezier(0.22,1,0.36,1) both, certOut 0.35s ease 4.15s forwards',
        }}>
          <Box sx={{
            borderRadius: '20px', p: '3px',
            background: isRejectToast
              ? 'linear-gradient(135deg,#991b1b 0%,#ef4444 40%,#b91c1c 70%,#dc2626 100%)'
              : 'linear-gradient(135deg,#2a9d8f 0%,#5ec9be 40%,#23857a 70%,#2a9d8f 100%)',
            boxShadow: isRejectToast
              ? '0 24px 64px rgba(15,23,42,0.32),0 4px 20px rgba(220,38,38,0.28)'
              : '0 24px 64px rgba(15,23,42,0.32),0 4px 20px rgba(42,157,143,0.3)',
          }}>
            <Box sx={{ borderRadius: '17px', overflow: 'hidden', background: isRejectToast ? '#fff5f5' : '#f0faf9' }}>

              {/* Header */}
              <Box sx={{
                background: isRejectToast
                  ? 'linear-gradient(135deg,#450a0a 0%,#7f1d1d 50%,#991b1b 100%)'
                  : 'linear-gradient(135deg,#0d3b33 0%,#1a5c54 50%,#1e6b62 100%)',
                px: 2.5, pt: 2, pb: 1.75, display: 'flex', alignItems: 'center', gap: 1.75,
                position: 'relative', overflow: 'hidden',
                '&::after': { content:'""', position:'absolute', inset:0, background: isRejectToast ? 'radial-gradient(ellipse at 80% 50%,rgba(255,255,255,0.08) 0%,transparent 70%)' : 'radial-gradient(ellipse at 80% 50%,rgba(94,201,190,0.15) 0%,transparent 70%)', pointerEvents:'none' },
                '&::before': { content:'""', position:'absolute', inset:0, background: isRejectToast ? 'linear-gradient(90deg,transparent 0%,rgba(255,100,100,0.15) 40%,rgba(255,255,255,0.1) 50%,rgba(255,100,100,0.15) 60%,transparent 100%)' : 'linear-gradient(90deg,transparent 0%,rgba(94,201,190,0.18) 40%,rgba(255,255,255,0.12) 50%,rgba(94,201,190,0.18) 60%,transparent 100%)', backgroundSize:'600px 100%', animation:'shimmer 2.2s linear 0.5s infinite', pointerEvents:'none' },
              }}>
                {/* Icon badge */}
                <Box sx={{
                  width:50, height:50, borderRadius:'50%', flexShrink:0,
                  background: isRejectToast
                    ? 'linear-gradient(135deg,#ef4444 0%,#f87171 60%,#dc2626 100%)'
                    : 'linear-gradient(135deg,#2a9d8f 0%,#5ec9be 60%,#23857a 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:'2px solid rgba(255,255,255,0.25)',
                  animation: isRejectToast
                    ? 'iconPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both, iconPulseR 1.8s ease-in-out 0.9s 2'
                    : 'iconPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both, iconPulseG 1.8s ease-in-out 0.9s 2',
                }}>
                  {isRejectToast
                    ? <CancelIcon style={{ fontSize:26, color:'#fff' }} />
                    : <CheckCircleIcon style={{ fontSize:26, color:'#fff' }} />}
                </Box>
                <Box sx={{ zIndex:1, flex:1, minWidth:0 }}>
                  <Typography sx={{ color: isRejectToast?'#fca5a5':'#5ec9be', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.13em', textTransform:'uppercase', mb:0.4, opacity:0.9 }}>
                    Approval
                  </Typography>
                  <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1.05rem', lineHeight:1.25, letterSpacing:'-0.01em' }}>
                    {toastTitle}
                  </Typography>
                </Box>
              </Box>

              {/* Countdown bar */}
              <Box sx={{ height:3, background: isRejectToast?'rgba(220,38,38,0.15)':'rgba(42,157,143,0.15)', position:'relative', overflow:'hidden' }}>
                <Box sx={{
                  position:'absolute', left:0, top:0, height:'100%',
                  background: isRejectToast
                    ? 'linear-gradient(90deg,#991b1b,#ef4444,#f87171,#ef4444,#991b1b)'
                    : 'linear-gradient(90deg,#23857a,#2a9d8f,#5ec9be,#2a9d8f,#23857a)',
                  animation:'countDown 4.5s linear 0s forwards',
                }} />
              </Box>

              {/* Body */}
              <Box sx={{ px:2.5, py:2, background: isRejectToast?'linear-gradient(180deg,#fff5f5,#fee2e2)':'linear-gradient(180deg,#f0faf9,#e4f5f3)', textAlign:'center' }}>
                {/* Bouncing dots top */}
                <Box sx={{ display:'flex', justifyContent:'center', gap:0.6, mb:1.75 }}>
                  {[0,1,2,3,4].map(i => (
                    <Box key={i} sx={{
                      width:i===2?7:4, height:i===2?7:4, borderRadius:'50%',
                      background: i===2 ? (isRejectToast?'#ef4444':'#2a9d8f') : (isRejectToast?'rgba(239,68,68,0.35)':'rgba(42,157,143,0.35)'),
                      mt: i===2?'-1.5px':0,
                      animation:`dotBounce 1.2s ease-in-out ${0.6+i*0.12}s 3`,
                    }} />
                  ))}
                </Box>

                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.75, px:1.5, py:0.9, borderRadius:'10px', background: isRejectToast?'rgba(239,68,68,0.08)':'rgba(42,157,143,0.12)', border:`1px solid ${isRejectToast?'rgba(239,68,68,0.2)':'rgba(42,157,143,0.25)'}` }}>
                  {isRejectToast
                    ? <CancelIcon style={{ fontSize:15, color:'#dc2626', flexShrink:0 }} />
                    : <CheckCircleIcon style={{ fontSize:15, color:'#2a9d8f', flexShrink:0 }} />}
                  <Typography sx={{ fontSize:'0.79rem', fontWeight:600, color: isRejectToast?'#7f1d1d':'#1a5c54', lineHeight:1.45 }}>
                    {success}
                  </Typography>
                </Box>

                {/* Floating dots bottom */}
                <Box sx={{ display:'flex', justifyContent:'center', gap:0.6, mt:1.75 }}>
                  {[0,1,2,3,4].map(i => (
                    <Box key={i} sx={{
                      width:i===2?7:4, height:i===2?7:4, borderRadius:'50%',
                      background: i===2 ? (isRejectToast?'#ef4444':'#2a9d8f') : (isRejectToast?'rgba(239,68,68,0.35)':'rgba(42,157,143,0.35)'),
                      mt: i===2?'-1.5px':0,
                      animation: i%2===0 ? `floatUp1 1.4s ease-out ${1.4+i*0.2}s 2` : `floatUp2 1.6s ease-out ${1.6+i*0.18}s 2`,
                    }} />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Confirmation dialog */}
      {dialog.open && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={closeDialog}>
          <div
            className="dashboard-popup"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">
                  {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
                </p>
                <h2 className="dashboard-popup__title">
                  {isApprove ? 'Approve Overtime Form' : 'Reject Overtime Form'}
                </h2>
              </div>
              <button
                type="button"
                className="dashboard-popup__close"
                aria-label="Close dialog"
                onClick={closeDialog}
              >
                <XClose size={18} />
              </button>
            </div>

            <div className="dashboard-popup__body">
              {dialog.form && (
                <>
                  <div style={{
                    background: 'rgba(26,42,87,0.04)',
                    border: '1px solid rgba(26,42,87,0.08)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    display: 'grid',
                    gap: 4,
                  }}>
                    <p className="dashboard-popup__text"><strong>Form:</strong> {dialog.form.formNumber}</p>
                    <p className="dashboard-popup__text"><strong>Department:</strong> {dialog.form.department}</p>
                    <p className="dashboard-popup__text"><strong>Requested By:</strong> {dialog.form.requestedBy}</p>
                    <p className="dashboard-popup__text"><strong>Compensation:</strong> {getKompensasiSummary(dialog.form)}</p>
                    {isApprove && dialog.entryIndices ? (
                      <p className="dashboard-popup__text">
                        <strong>Approved employees:</strong>{' '}
                        <span style={{ color: '#2a9d8f', fontWeight: 700 }}>
                          {dialog.entryIndices.length} of {dialog.form.entries?.length} employees
                        </span>
                      </p>
                    ) : (
                      <p className="dashboard-popup__text">
                        <strong>Total Employees:</strong> {dialog.form.entries?.length} employees
                      </p>
                    )}
                  </div>

                  <TextField
                    fullWidth multiline rows={3}
                    label="Notes (optional)"
                    placeholder={
                      isApprove
                        ? 'e.g. Approved based on operational needs...'
                        : 'e.g. Rejected - incomplete documents...'
                    }
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    size="small"
                  />
                </>
              )}
            </div>

            <div className="dashboard-popup__actions" style={{ gap: 8 }}>
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`dashboard-popup__button ${isApprove ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
                onClick={handleApproval}
                disabled={submitting}
              >
                {submitting && (
                  <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />
                )}
                {submitting ? 'Processing...' : isApprove ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Box>
  );
}
