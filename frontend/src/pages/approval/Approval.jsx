import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from '@mui/material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import CardBigBox from '../../components/ui/CardBigBox';
import CreateButton from '../../components/ui/CreateButton';
import DataTable, { DataTableStatus } from '../../components/ui/DataTable';
import FormTypeBadge from '../../components/ui/FormTypeBadge';
import { SelectFilter, RowsFilter } from '../../components/ui/SelectFilter';
import { ChevronDown, ClipboardCheck, SearchMd, XClose } from '../../components/layout/icons';
import { useAuth } from '../../context/AuthContext';
import {
  ROWS_OPTIONS,
  FORM_TYPE_CHIP_MAP,
  formatKompensasi,
  getEntryDetailFields,
  isAdminUser as isAdminUserHelper,
  isManagerUser as isManagerUserHelper,
} from './helpers';
import ApprovalDetailPopup from './ApprovalDetailPopup';
import ApprovalConfirmDialog from './ApprovalConfirmDialog';
import ApprovalSuccessToast from './ApprovalSuccessToast';

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
    if (user?.canApprove === false && user?.canSeeReports) return false;
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
    const totalE = detailForm?.entries?.length ?? 0;
    if (selectedEntryIndices.size === totalE) {
      setSelectedEntryIndices(new Set());
    } else {
      setSelectedEntryIndices(new Set(Array.from({ length: totalE }, (_, i) => i)));
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

  // ── DataTable columns ─────────────────────────────────────────
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
            onClick={(e) => { e.stopPropagation(); navigate(`/overtime/${form.id}/edit`); }}
          >
            <EditRoundedIcon style={{ fontSize: 16 }} />
          </CreateButton>
        </div>
      ),
    },
  ];

  // ── DataTable expandable entries ──────────────────────────────
  const tableDetail = {
    eyebrow: false,
    title: false,
    columnLabel: 'Entries',
    buttonLabel: 'Entries',
    render: (form) => (
      <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
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

  // ── Pagination ────────────────────────────────────────────────
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

  // ── Empty state ───────────────────────────────────────────────
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

  const isRejectToast = success.includes('Rejected');

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          )}

          {/* ── Filter card ── */}
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

          {/* ── Main table card ── */}
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
                {/* Desktop DataTable */}
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

                {/* Mobile cards */}
                <div className="approval-mobile-cards">
                  {forms.map((form) => (
                    <div key={form.id} className="approval-mob-card">
                      <div className="approval-mob-card__top">
                        <div className="approval-mob-card__info">
                          <strong className="approval-mob-card__form-no">{form.formNumber}</strong>
                          <div className="approval-mob-card__badges">
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
                            onClick={() => navigate(`/overtime/${form.id}/edit`)}
                          >
                            <EditRoundedIcon style={{ fontSize: 16 }} />
                          </CreateButton>
                        </div>
                      </div>

                      <div className="approval-mob-card__meta">
                        {[
                          { label: 'Department',   value: form.department || '-' },
                          { label: 'Requested By', value: form.requestedBy || '-' },
                          { label: 'Submit Date',  value: form.submissionDate || '-' },
                          { label: 'Employees',    value: `${form.entries?.length || 0}` },
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

                {/* Mobile pagination */}
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

      <ApprovalDetailPopup
        detailForm={detailForm}
        selectedEntryIndices={selectedEntryIndices}
        onToggleEntry={toggleEntry}
        onSelectAll={handleSelectAll}
        canUserAct={canUserAct}
        getDivisiLabel={getDivisiLabel}
        onApprove={(form) => openDialogFromDetail(form, 'approve')}
        onReject={(form) => openDialogFromDetail(form, 'reject')}
        onClose={() => setDetailForm(null)}
      />

      <ApprovalSuccessToast success={success} isRejectToast={isRejectToast} />

      <ApprovalConfirmDialog
        dialog={dialog}
        catatan={catatan}
        onCatatanChange={setCatatan}
        submitting={submitting}
        onClose={closeDialog}
        onConfirm={handleApproval}
      />
    </Box>
  );
}
