import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import axios from 'axios';

import CardBigBox from '../../components/ui/CardBigBox';
import CreateButton from '../../components/ui/CreateButton';
import DataTable, { DataTableStatus } from '../../piagam/table/DataTable';
import { ChevronDown, Check, SearchMd, XClose, Printer } from '../../components/layout/icons';
import { useAuth } from '../../context/AuthContext';
import { DetailLemburContent } from './DetailLembur';
import PrintPreviewModal from '../../components/ui/PrintPreviewModal';
import {
  ROWS_OPTIONS,
  BOD_KEYWORDS,
  MANAGER_KEYWORDS,
  FORM_TYPE_CHIP_MAP,
  formatKompensasi,
  formatLemburPada,
} from '../approval/helpers';

const API = '/api/overtime';

const STATUS_CHIP_MAP = {
  approved:           { label: 'Approved',          color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Partially Approved', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  rejected:           { label: 'Rejected',           color: 'error',   icon: <CancelIcon fontSize="small" /> },
};

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
      <span className="approval-unified-pagination__label">Show</span>
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

function ApprovedStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}

function getProcessedBy(form) {
  if (!form) return '-';
  if (form.status === 'rejected') return form.rejectedBy || '-';
  return form.approvedBy || '-';
}

function isAdminUser(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD;
}

function canRevertForm(user, form) {
  if (!user || !form) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || isBOD) return true;
  const isManager = MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );
  return isManager && form.department === user.department;
}

export default function ApprovedList() {
  const { user } = useAuth();

  const [forms, setForms]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [divisiOptions, setDivisiOptions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterDivisi, setFilterDivisi]       = useState('');
  const [filterJenisForm, setFilterJenisForm] = useState('');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [revertId, setRevertId]       = useState(null);
  const [reverting, setReverting]     = useState(false);
  const [detailForm, setDetailForm]   = useState(null);
  const [printForm, setPrintForm]     = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);

  const totalPages  = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage    = Math.min(page, totalPages);
  const isFiltered  = Boolean(search || filterStatus || filterDivisi || filterJenisForm);
  const isEmptyState = !loading && forms.length === 0;

  useEffect(() => {
    axios.get(`${API}/filter-options`)
      .then((r) => setDivisiOptions(r.data.data?.departments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({
      statuses:    filterStatus || 'approved,rejected,partially_approved',
      page:        String(page),
      rowsPerPage: String(rowsPerPage),
    });
    if (search)        params.set('search',     search);
    if (filterDivisi)  params.set('department', filterDivisi);
    if (filterJenisForm) params.set('formType', filterJenisForm);

    const delay = search ? 350 : 0;
    const timer = setTimeout(() => {
      setLoading(true);
      axios.get(`${API}?${params}`)
        .then((r) => { setForms(r.data.data || []); setTotal(r.data.total || 0); })
        .catch(() => setError('Failed to load data. Please make sure the backend server is running.'))
        .finally(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timer);
  }, [search, filterStatus, filterDivisi, filterJenisForm, page, rowsPerPage, refreshKey]);

  const handleRevert = () => {
    if (!revertId) return;
    setReverting(true);
    axios.post(`${API}/${revertId}/revert`)
      .then(() => { setRevertId(null); setRefreshKey((k) => k + 1); })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to revert form. Please try again.'))
      .finally(() => setReverting(false));
  };

  // ── DataTable columns ─────────────────────────────────────────────
  const tableColumns = [
    {
      key: 'formNumber',
      header: 'Form No.',
      cellStyle: { whiteSpace: 'nowrap' },
      render: (form) => (
        <strong style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.88rem' }}>
          {form.formNumber}
        </strong>
      ),
    },
    {
      key: 'formType',
      header: 'Form Type',
      render: (form) => <FormTypeBadge jenisForm={form.formType} />,
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
      key: 'status',
      header: 'Status',
      render: (form) => <ApprovedStatusChip status={form.status} />,
      cellStyle: { whiteSpace: 'nowrap' },
    },
    {
      key: 'processedBy',
      header: 'Processed By',
      render: (form) => (
        <span
          style={{ fontSize: '0.85rem', display: 'block', wordBreak: 'break-word', overflowWrap: 'break-word' }}
        >
          {getProcessedBy(form)}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Actions',
      cellStyle: { whiteSpace: 'nowrap', width: '1%' },
      render: (form) => (
        <div className="users-table__action-group" style={{ display: 'flex', gap: 6 }}>
          <CreateButton
            variant="icon"
            title="View Detail"
            aria-label="View Detail"
            onClick={(e) => { e.stopPropagation(); setDetailForm(form); }}
          >
            <FactCheckRoundedIcon style={{ fontSize: 16 }} />
          </CreateButton>
          {canRevertForm(user, form) && (
            <CreateButton
              variant="icon"
              title="Revert to Queue"
              aria-label="Revert to Queue"
              style={{ borderColor: 'rgba(212,136,30,0.35)', color: '#b8750f', background: 'rgba(244,169,64,0.07)' }}
              onClick={(e) => { e.stopPropagation(); setRevertId(form.id); }}
            >
              <RestoreRoundedIcon style={{ fontSize: 16 }} />
            </CreateButton>
          )}
        </div>
      ),
    },
  ];

  // ── DataTable expandable detail ────────────────────────────────────
  const tableDetail = {
    eyebrow: false,
    title: false,
    columnLabel: 'Entries',
    buttonLabel: 'Entries',
    render: (form) => (
      <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <ApprovedStatusChip status={form.status} />
          <FormTypeBadge jenisForm={form.formType} />
        </div>
        {(form.entries ?? []).length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.88rem', margin: '8px 0 0' }}>
            No entries found
          </p>
        ) : (
          <div className="users-table__detail-shell entry-detail-shell" style={{ maxHeight: 320, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {(form.entries ?? []).map((entry, idx) => (
              <div key={idx} className="users-table__detail-section">
                <dl className="users-table__detail-list">
                  {[
                    { label: 'Name',         value: entry.name },
                    { label: 'Employee ID',  value: entry.employeeId },
                    { label: 'Overtime Date', value: entry.overtimeDate },
                    { label: 'Start Time',   value: entry.startTime },
                    { label: 'End Time',     value: entry.endTime },
                    { label: 'Compensation', value: formatKompensasi(entry.compensation), accent: true },
                    { label: 'Task',         value: entry.task || '-', wide: true },
                    { label: 'Result',       value: entry.result || '-', wide: true },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className={`users-table__detail-row${field.wide ? ' users-table__detail-row--stacked' : ''}`}
                    >
                      <dt className="users-table__detail-label">{field.label}</dt>
                      <dd className="users-table__detail-field">
                        <span
                          className="users-table__detail-value"
                          style={field.accent ? { color: '#6d3fa0' } : undefined}
                        >
                          {field.value || '-'}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}
      </>
    ),
    actions: [
      {
        key: 'revert',
        label: 'Revert to Queue',
        hidden: (form) => !canRevertForm(user, form),
        onClick: (form) => setRevertId(form.id),
      },
    ],
  };

  // ── Pagination ─────────────────────────────────────────────────────
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

  const tablePagination = total > 0 ? {
    summary: `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, total)} of ${total}`,
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

  // ── Empty state ────────────────────────────────────────────────────
  const emptyState = isFiltered
    ? {
      title: 'No results found',
      description: 'Try adjusting your search or filter criteria.',
      icon: <SearchOffRoundedIcon className="approval-empty__check" />,
      showReset: true,
    }
    : {
      title: 'No processed forms',
      description: 'No overtime forms have been approved or rejected yet.',
      icon: <FactCheckRoundedIcon className="approval-empty__check" />,
      showReset: false,
    };

  const statusOptions = [
    { value: 'approved',           label: 'Approved' },
    { value: 'rejected',           label: 'Rejected' },
    { value: 'partially_approved', label: 'Partially Approved' },
  ];

  const jenisFormOptions = Object.keys(FORM_TYPE_CHIP_MAP).map((j) => ({
    value: j,
    label: FORM_TYPE_CHIP_MAP[j]?.label ?? j,
  }));

  // ── Filter card ────────────────────────────────────────────────────
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
            options={jenisFormOptions}
          />
        </div>

        <div className="approval-filter-card__field" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Status</span>
          <SelectFilter
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            placeholder="All Statuses"
            icon={LocalOfferRoundedIcon}
            options={statusOptions}
          />
        </div>
      </div>
    </CardBigBox>
  );

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          {filterCard}

          <CardBigBox
            eyebrow="Form List"
            title="Processed Forms"
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
                            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDivisi(''); setFilterJenisForm(''); setPage(1); }}
                          >
                            <XClose size={14} />
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: DataTable */}
                <div className="approval-desktop-table">
                  <DataTable
                    rows={forms}
                    columns={tableColumns}
                    getRowId={(form) => form.id}
                    detail={tableDetail}
                    pagination={tablePagination}
                    tableLabel="Processed Forms"
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
                            <ApprovedStatusChip status={form.status} />
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
                            <FactCheckRoundedIcon style={{ fontSize: 16 }} />
                          </CreateButton>
                          {canRevertForm(user, form) && (
                            <CreateButton
                              variant="icon"
                              title="Revert to Queue"
                              aria-label="Revert to Queue"
                              style={{ borderColor: 'rgba(212,136,30,0.35)', color: '#b8750f', background: 'rgba(244,169,64,0.07)' }}
                              onClick={() => setRevertId(form.id)}
                            >
                              <RestoreRoundedIcon style={{ fontSize: 16 }} />
                            </CreateButton>
                          )}
                        </div>
                      </div>

                      <div className="approval-mob-card__meta">
                        {[
                          { label: 'Department',    value: form.department || '-' },
                          { label: 'Requested By',  value: form.requestedBy || '-' },
                          { label: 'Submit Date',   value: form.submissionDate || '-' },
                          { label: 'Employees',     value: `${form.entries?.length || 0}` },
                          { label: 'Processed By',  value: getProcessedBy(form) },
                        ].map(({ label, value }) => (
                          <div key={label} className="approval-mob-card__meta-item">
                            <span className="approval-mob-card__meta-label">{label}</span>
                            <span className="approval-mob-card__meta-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile pagination */}
                {total > 0 && (
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

      {/* Detail popup */}
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

            <div className="dashboard-popup__body--frp-detail">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DetailLemburContent formId={detailForm.id} onClose={null} inPopup={true} />
              </div>
            </div>

            <div className="dashboard-popup__actions" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={() => setPrintForm(detailForm)}
              >
                <Printer size={15} />
                Print
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Revert confirmation dialog */}
      {!!revertId && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => !reverting && setRevertId(null)}>
          <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Confirmation</p>
                <h2 className="dashboard-popup__title">Revert to Queue?</h2>
              </div>
              <button
                type="button"
                className="dashboard-popup__close"
                aria-label="Close"
                onClick={() => !reverting && setRevertId(null)}
              >
                <XClose size={18} />
              </button>
            </div>
            <div className="dashboard-popup__body">
              <p className="dashboard-popup__text">
                This form will be returned to <strong>Pending Approval</strong> status. Previous approvals will be reset and the form must be re-approved.
              </p>
            </div>
            <div className="dashboard-popup__actions">
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={() => !reverting && setRevertId(null)}
                disabled={reverting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--primary"
                onClick={handleRevert}
                disabled={reverting}
              >
                {reverting && <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />}
                {reverting ? 'Processing...' : 'Yes, Revert'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Print preview modal */}
      {printForm && <PrintPreviewModal form={printForm} onClose={() => setPrintForm(null)} />}
    </Box>
  );
}
