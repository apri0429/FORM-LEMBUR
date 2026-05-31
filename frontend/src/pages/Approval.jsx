import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, Edit03, SearchMd, XClose } from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';

const API = '/api/lembur';
const ROWS_OPTIONS = [10, 25, 50, 100];
const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];
const FORM_TYPE_CHIP_MAP = {
  staff:        { label: 'Staff',        color: '#1a2a57', bg: 'rgba(26,42,87,0.08)',    icon: BadgeRoundedIcon },
  manager:      { label: 'Manager',      color: '#0277bd', bg: 'rgba(2,119,189,0.1)',    icon: ManageAccountsRoundedIcon },
  outsourcing:  { label: 'Outsourcing',  color: '#e65100', bg: 'rgba(230,81,0,0.09)',   icon: WorkRoundedIcon },
  harian_lepas: { label: 'Harian Lepas', color: '#6a1b9a', bg: 'rgba(106,27,154,0.09)', icon: EventNoteRoundedIcon },
};

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
  approved: { label: 'Disetujui', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Disetujui L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending: { label: 'Menunggu', color: 'default', icon: <PendingActionsRoundedIcon fontSize="small" /> },
  rejected: { label: 'Ditolak', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

function formatKompensasi(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function formatLemburPada(value) {
  return String(value ?? '').trim() || '-';
}

function getKompensasiSummary(form) {
  const values = form.entries
    ?.map((entry) => formatKompensasi(entry.kompensasi))
    .filter((value) => value !== '-') || [];

  if (!values.length) return '-';

  const uniqueValues = [...new Set(values)];
  if (uniqueValues.length <= 2) return uniqueValues.join(', ');
  return `${uniqueValues.slice(0, 2).join(', ')} +${uniqueValues.length - 2} lainnya`;
}

function ApprovalStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}

function isBODUser(user) {
  if (!user) return false;
  return (
    BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director'
  );
}

function isAdminUser(user) {
  if (!user) return false;
  return user.role === 'admin' || user.department === 'IT' || isBODUser(user);
}

function isManagerUser(user) {
  if (!user) return false;
  const pos = String(user.jobPosition || '').toLowerCase();
  const lvl = String(user.jobLevel || '').toLowerCase();
  return MANAGER_KEYWORDS.some((k) => pos.includes(k) || lvl.includes(k));
}

export default function Approval() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, form: null, action: '', entryIndices: null });
  const [detailForm, setDetailForm] = useState(null);
  const [selectedEntryIndices, setSelectedEntryIndices] = useState(new Set());
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [filterJenisForm, setFilterJenisForm] = useState('');
  const [divisiOptions, setDivisiOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    if (!success) return;
    successTimerRef.current = setTimeout(() => setSuccess(''), 2200);
    return () => clearTimeout(successTimerRef.current);
  }, [success]);

  const isAdmin = isAdminUser(user);

  // Users who can view this form in the queue
  const canUserSee = (form) => {
    if (form.status !== 'pending') return false;
    if (isAdmin) return true;
    return form.department === user?.department;
  };

  const isManager = isManagerUser(user);

  // Users who can approve/reject this form
  const canUserAct = (form) => {
    if (isAdmin) return true;
    // Form tipe manager hanya bisa di-approve BOD/Admin
    if (form.jenisForm === 'manager') return false;
    // Managers/supervisors can approve staff forms in their department
    if (isManager && form.department === user?.department) return true;
    // Fallback: anyone listed as the requester
    return form.diperintahOleh === user?.fullName;
  };

  const fetchForms = () => {
    setLoading(true);
    axios.get(API)
      .then((r) => setAllForms(r.data.data || []))
      .catch(() => setError('Gagal memuat data. Pastikan server backend sedang berjalan.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForms(); }, []);

  useEffect(() => {
    axios.get(`${API}/filter-options`)
      .then((r) => setDivisiOptions(r.data.data?.departments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!detailForm) return;
    setSelectedEntryIndices(new Set(detailForm.entries?.map((_, i) => i) ?? []));
  }, [detailForm]);

  const getDivisiLabel = (form) => form?.divisi || form?.department || form?.kodeDivisi || '-';

  const jenisFormOptions = [...new Set(allForms.map((f) => f.jenisForm).filter(Boolean))];

  const filteredForms = allForms
    .filter(canUserSee)
    .filter((f) => {
      if (filterDivisi && getDivisiLabel(f) !== filterDivisi) return false;
      if (filterJenisForm && f.jenisForm !== filterJenisForm) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.nomerForm?.toLowerCase().includes(q) ||
          f.department?.toLowerCase().includes(q) ||
          f.diperintahOleh?.toLowerCase().includes(q) ||
          f.entries?.some((e) => e.nama?.toLowerCase().includes(q))
        );
      }
      return true;
    });

  const totalForms = filteredForms.length;
  const totalPages = Math.max(1, Math.ceil(totalForms / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const forms = filteredForms.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const isEmptyState = !loading && forms.length === 0;

  const toggleExpand = (formId) => {
    setExpandedId(expandedId === formId ? null : formId);
  };

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
      const body = {
        status: dialog.action === 'approve' ? 'approved' : 'rejected',
        catatanApproval: catatan,
        approvedBy: user?.fullName,
      };

      if (dialog.action === 'approve' && dialog.entryIndices) {
        body.approvedEntryIndices = dialog.entryIndices;
      }

      await axios.patch(`${API}/${dialog.form.id}/status`, body);

      const labelAction = dialog.action === 'approve' ? 'Disetujui' : 'Ditolak';
      setSuccess(`Form ${dialog.form.nomerForm} - ${labelAction}`);
      closeDialog();
      fetchForms();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memproses persetujuan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filterCard = (
    <div className={`approval-filter-card approved-filter-card${mobileFilterOpen ? ' approval-filter-card--mobile-open' : ''}`}>
      <button
        type="button"
        className="approval-filter-card__toggle"
        onClick={() => setMobileFilterOpen((prev) => !prev)}
        aria-expanded={mobileFilterOpen}
        aria-controls="approval-filter-fields"
      >
        <span className="approval-filter-card__toggle-label">
          <FilterListRoundedIcon sx={{ fontSize: 20 }} />
          Filter & Pencarian
        </span>
        <ChevronDown size={18} style={{ transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div id="approval-filter-fields" className="approval-filter-card__fields">
      {/* Search field */}
      <div className="approval-filter-card__field approval-filter-card__field--search">
        <span className="approval-filter-card__label">Pencarian</span>
        <div className="approval-filter-card__input-wrap">
          <span className="approval-filter-card__icon"><SearchMd size={18} /></span>
          <input
            type="text"
            className="approval-filter-card__input"
            placeholder="Cari no. form atau nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Divisi filter */}
      <div className="approval-filter-card__field" style={{ flex: '1 1 240px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Departemen</span>
          <TextField
            select
            fullWidth
            value={filterDivisi}
            onChange={(e) => { setFilterDivisi(e.target.value); setPage(1); }}
            SelectProps={{ displayEmpty: true }}
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                  <ApartmentRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
              ),
            }}
            sx={{
              width: '100%',
              minWidth: '100%',
              '& .MuiOutlinedInput-root': {
                width: '100%',
                height: 44,
                borderRadius: '11px',
                bgcolor: '#eef2f6',
                boxShadow: 'none',
                '& fieldset': {
                  border: '1.5px solid rgba(26, 42, 87, 0.11)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(26, 42, 87, 0.16)',
                },
                '&.Mui-focused': {
                  bgcolor: '#fff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 0 0 3.5px rgba(37, 99, 168, 0.1)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(37, 99, 168, 0.4)',
                },
              },
              '& .MuiInputBase-root': {
                width: '100%',
              },
              '& .MuiSelect-select': {
                display: 'block',
                width: '100%',
                minWidth: 0,
                py: '0 !important',
                pl: '4px !important',
                pr: '36px !important',
                height: '44px !important',
                lineHeight: '44px',
                boxSizing: 'border-box',
                textOverflow: 'ellipsis',
              },
              '& .MuiSelect-icon': {
                color: '#6b7a90',
                right: 12,
              },
            }}
          >
            <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua Departemen</em></MenuItem>
            {divisiOptions.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>
        </div>

      {/* Jenis form filter */}
      <div className="approval-filter-card__field" style={{ flex: '1 1 240px', minWidth: 0 }}>
        <span className="approval-filter-card__label">Jenis Form</span>
        <TextField
          select
          fullWidth
          value={filterJenisForm}
          onChange={(e) => { setFilterJenisForm(e.target.value); setPage(1); }}
          SelectProps={{ displayEmpty: true }}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                <AssignmentIndRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            ),
          }}
          sx={{
            width: '100%',
            minWidth: '100%',
            '& .MuiOutlinedInput-root': {
              width: '100%',
              height: 44,
              borderRadius: '11px',
              bgcolor: '#eef2f6',
              boxShadow: 'none',
              '& fieldset': {
                border: '1.5px solid rgba(26, 42, 87, 0.11)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(26, 42, 87, 0.16)',
              },
              '&.Mui-focused': {
                bgcolor: '#fff',
                transform: 'translateY(-1px)',
                boxShadow: '0 0 0 3.5px rgba(37, 99, 168, 0.1)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(37, 99, 168, 0.4)',
              },
            },
            '& .MuiInputBase-root': {
              width: '100%',
            },
            '& .MuiSelect-select': {
              display: 'block',
              width: '100%',
              minWidth: 0,
              py: '0 !important',
              pl: '4px !important',
              pr: '36px !important',
              height: '44px !important',
              lineHeight: '44px',
              boxSizing: 'border-box',
              textOverflow: 'ellipsis',
            },
            '& .MuiSelect-icon': {
              color: '#6b7a90',
              right: 12,
            },
          }}
        >
          <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua Jenis Form</em></MenuItem>
          {jenisFormOptions.map((jenis) => (
            <MenuItem key={jenis} value={jenis}>
              {FORM_TYPE_CHIP_MAP[jenis]?.label ?? jenis}
            </MenuItem>
          ))}
        </TextField>
      </div>
      </div>
    </div>
  );

  const isApprove = dialog.action === 'approve';

  const selectedCount = selectedEntryIndices.size;
  const totalEntries = detailForm?.entries?.length ?? 0;
  const isAllSelected = selectedCount === totalEntries;
  const approveLabel = isAllSelected
    ? 'Setujui Semua'
    : `Setujui (${selectedCount}/${totalEntries})`;
  const isRejectToast = success.includes('Ditolak');
  const toastTitle = isRejectToast ? 'Penolakan Berhasil' : 'Persetujuan Berhasil';
  const toastAccent = isRejectToast
    ? {
      bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
      soft: 'rgba(254, 226, 226, 0.18)',
      border: 'rgba(255,255,255,0.18)',
      icon: <CancelIcon sx={{ fontSize: 18, color: '#fecaca' }} />,
      pill: 'rgba(254, 226, 226, 0.16)',
      progress: 'linear-gradient(90deg, #f87171, #dc2626)',
    }
    : {
      bg: 'linear-gradient(145deg, #059669 0%, #10b981 55%, #34d399 100%)',
      soft: 'rgba(255, 255, 255, 0.16)',
      border: 'rgba(255,255,255,0.18)',
      icon: <CheckCircleIcon sx={{ fontSize: 18, color: '#ffffff' }} />,
      pill: 'rgba(255, 255, 255, 0.16)',
      progress: 'linear-gradient(90deg, #6ee7b7, #10b981)',
    };
  const emptyState = search || filterDivisi || filterJenisForm
    ? {
      title: 'Data tidak ditemukan',
      description: 'Tidak ada form yang cocok dengan pencarian atau filter yang dipilih.',
      icon: <SearchOffRoundedIcon className="approval-empty__check" />,
      showReset: true,
    }
    : {
      title: 'Semua sudah diproses',
      description: 'Belum ada form lembur yang menunggu persetujuan saat ini.',
      icon: <CheckCircleIcon className="approval-empty__check" />,
      showReset: false,
    };

  return (
    <Box sx={{ height: '100dvh', minHeight: 0, width: '100%', overflow: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%', overflow: 'hidden' }}>
        <div className="dashboard-content" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          )}

          {filterCard}

          <CardBigBox
            eyebrow="Daftar Form"
            title="Antrean Persetujuan"
            className={`dashboard-panel--scroll approval-main-panel${isEmptyState ? ' approval-main-panel--empty' : ''}`}
            contentClassName={`approval-panel-body${isEmptyState ? ' approval-panel-body--empty' : ''}`}
            footer={totalForms > 0 && !loading ? (
              <div className={`approval-pagination${totalForms > 0 && !loading ? '' : ' approval-pagination--placeholder'}`}>
                <>
                    <div className="approval-pagination__rows">
                      <span className="approval-pagination__rows-text">Tampilkan</span>
                      <TextField
                        select
                        size="small"
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                        sx={{ width: 72 }}
                      >
                        {ROWS_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </TextField>
                      <span className="approval-pagination__rows-text">baris</span>
                    </div>
                    <div className="approval-pagination__nav">
                      <span className="approval-pagination__info">
                    {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, totalForms)} dari {totalForms}
                      </span>
                      <button
                        type="button"
                        className="approval-pagination__btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                      >
                        <KeyboardArrowLeftIcon sx={{ fontSize: 16 }} />
                        <span className="approval-pagination__btn-label">Previous</span>
                      </button>
                      <button
                        type="button"
                        className="approval-pagination__btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                      >
                        <span className="approval-pagination__btn-label">Next</span>
                        <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
                      </button>
                    </div>
                </>
              </div>
            ) : null}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                <div className="approval-scroll-surface">
                  <div className="dashboard-stack approval-content-stack">
                    {forms.map((form, formIdx) => {
                      const isExpanded = expandedId === form.id;
                      return (
                        <div key={form.id} className="dashboard-stack__item approval-card" onClick={() => toggleExpand(form.id)} style={{ cursor: 'pointer' }}>
                          <div className="approval-card__header">
                            <div className="approval-card__info">
                              <div className="approval-card__topline">
                                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.92rem' }}>{form.nomerForm}</Typography>
                                <ApprovalStatusChip status={form.status} />
                                <FormTypeBadge jenisForm={form.jenisForm} />
                              </div>
                              <div className="approval-card__meta">
                                <span className="approval-card__meta-item"><span className="approval-card__meta-label">Departemen</span><strong>{form.department}</strong></span>
                                <span className="approval-card__meta-separator" aria-hidden="true" />
                                <span className="approval-card__meta-item"><span className="approval-card__meta-label">Diminta oleh</span><strong>{form.diperintahOleh}</strong></span>
                                <span className="approval-card__meta-separator" aria-hidden="true" />
                                <span className="approval-card__meta-item"><span className="approval-card__meta-label">Tanggal</span><strong>{form.tanggalPengajuan}</strong></span>
                              </div>
                              <div className="approval-card__summary approval-card__summary--simple">
                                <div className="approval-card__summary-item approval-card__summary-item--muted">
                                  <Typography variant="caption" color="text.secondary">{form.entries?.length || 0} karyawan</Typography>
                                </div>
                              </div>
                            </div>
                            <div className="approval-card__actions" onClick={e => e.stopPropagation()}>
                              <CreateButton variant="accordion" onClick={() => setDetailForm(form)}>
                                <FactCheckRoundedIcon sx={{ fontSize: 15 }} />
                                Detail
                              </CreateButton>
                              <CreateButton variant="accordion" className="approval-card__edit-btn" onClick={() => navigate(`/form/edit/${form.id}`)}>
                                <Edit03 size={15} />
                                Edit
                              </CreateButton>
                            </div>
                            <div className={`approval-entry-toggle ${isExpanded ? 'approval-entry-toggle--open' : ''}`} aria-hidden="true">
                              {isExpanded ? <ExpandLessIcon sx={{ fontSize: 20, display: 'block' }} /> : <ExpandMoreIcon sx={{ fontSize: 20, display: 'block' }} />}
                            </div>
                          </div>
                          <Collapse in={isExpanded} onClick={e => e.stopPropagation()}>
                            <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid rgba(26,42,87,0.08)' }} />
                            <p style={{ margin: '0 0 10px', color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>Detail Entri Lembur</p>
                            <div className="users-table-wrapper approval-entry-table-wrapper">
                              <table className="users-table approval-mobile-table">
                                <thead><tr>
                                  <th>Nama</th><th>ID Karyawan</th><th>Tgl. Lembur</th>
                                  <th>Mulai</th><th>Selesai</th><th>Tugas</th><th>Hasil</th><th>Kompensasi</th>
                                </tr></thead>
                                <tbody>
                                  {form.entries?.map((entry, idx) => (
                                    <tr key={idx}>
                                      <td data-label="Nama"><strong className="users-table__name">{entry.nama}</strong></td>
                                      <td data-label="ID Karyawan"><span className="users-table__status users-table__status--inline users-table__status--app">{entry.idKaryawan}</span></td>
                                      <td data-label="Tgl. Lembur">{entry.tanggalLembur}</td>
                                      <td data-label="Mulai">{entry.jamMulai}</td>
                                      <td data-label="Selesai">{entry.jamSelesai}</td>
                                      <td data-label="Tugas" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.tugas}</td>
                                      <td data-label="Hasil" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.hasil}</td>
                                      <td data-label="Kompensasi"><strong style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.kompensasi)}</strong></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Collapse>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Box>
            )}
          </CardBigBox>

        </div>
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
            {/* Frozen header */}
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Detail Form Lembur</p>
                <h2 className="dashboard-popup__title">{detailForm.nomerForm}</h2>
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

            {/* Body: pinned info cards, only table rows scroll */}
            <div className="dashboard-popup__body--frp-detail" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Info summary: pinned, never scrolls */}
              <div
                className="approval-detail-summary"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {[
                  { label: 'Departemen', value: detailForm.department },
                  { label: 'Diminta Oleh', value: detailForm.diperintahOleh },
                  { label: 'Tanggal Pengajuan', value: detailForm.tanggalPengajuan },
                  { label: 'Hari Lembur', value: formatLemburPada(detailForm.lemburPada) },
                  { label: 'Divisi', value: getDivisiLabel(detailForm) },
                  { label: 'Kompensasi', value: getKompensasiSummary(detailForm) },
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
                    <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '-'}</strong>
                  </div>
                ))}
              </div>

              {/* Table section: takes remaining height */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Table title row: pinned above the table */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
                  <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                    Entri Lembur — {totalEntries} karyawan
                  </p>
                  {totalEntries > 1 && (
                    <span style={{ fontSize: '0.78rem', color: selectedCount === 0 ? '#ef4444' : '#2a9d8f', fontWeight: 600 }}>
                      {selectedCount === 0 ? 'Belum ada yang dipilih' : `${selectedCount} dipilih`}
                    </span>
                  )}
                </div>

                {/* Only the table rows scroll; thead stays fixed at top */}
                <div
                  className="approval-detail-table-wrapper"
                  style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
                >
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
                              title="Pilih semua"
                            />
                          </th>
                        )}
                        <th>No</th>
                        <th>Nama</th>
                        <th>ID Karyawan</th>
                        <th>Tanggal Lembur</th>
                        <th>Mulai</th>
                        <th>Selesai</th>
                        <th>Tugas</th>
                        <th>Hasil</th>
                        <th>Kompensasi</th>
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
                            <td data-label="Name"><strong className="users-table__name">{entry.nama}</strong></td>
                            <td data-label="Employee ID">
                              <span className="users-table__status users-table__status--inline users-table__status--app">
                                {entry.idKaryawan}
                              </span>
                            </td>
                            <td data-label="Overtime Date">{entry.tanggalLembur}</td>
                            <td data-label="Start">{entry.jamMulai}</td>
                            <td data-label="End">{entry.jamSelesai}</td>
                            <td data-label="Task">{entry.tugas}</td>
                            <td data-label="Result">{entry.hasil}</td>
                            <td data-label="Compensation">
                              <strong style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.kompensasi)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            {/* Frozen actions */}
            <div className="dashboard-popup__actions" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
              {canUserAct(detailForm) ? (
                <>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--danger"
                    onClick={() => openDialogFromDetail(detailForm, 'reject')}
                  >
                    <CancelIcon sx={{ fontSize: 16 }} />
                    Tolak
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
                  Anda hanya dapat melihat form ini
                </span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success toast */}
      {success && (
        <Box sx={{
          position: 'fixed',
          top: { xs: '50%', sm: '50%' },
          left: { xs: 12, sm: '50%' },
          right: { xs: 12, sm: 'auto' },
          transform: { xs: 'translateY(-50%)', sm: 'translate(-50%, -50%)' },
          zIndex: 1400,
          width: { xs: 'calc(100% - 24px)', sm: 400 },
          minWidth: { xs: 0, sm: 400 },
          maxWidth: { xs: 'calc(100% - 24px)', sm: 400 },
          '@keyframes toastFloatIn': {
            '0%': { opacity: 0, transform: 'translateY(-50%) scale(0.94)' },
            '60%': { opacity: 1, transform: 'translateY(-50%) scale(1.01)' },
            '100%': { opacity: 1, transform: 'translateY(-50%) scale(1)' },
          },
          '@keyframes toastFadeOut': {
            from: { opacity: 1 },
            to: { opacity: 0 },
          },
          animation: 'toastFloatIn 0.5s cubic-bezier(0.22,1,0.36,1) both, toastFadeOut 0.3s ease 4.2s forwards',
        }}>
          <Box sx={{
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 16px 44px rgba(15,23,42,0.22), 0 4px 14px rgba(15,23,42,0.12)',
            border: `1px solid ${toastAccent.border}`,
            backdropFilter: 'blur(12px)',
          }}>
            <Box sx={{
              background: toastAccent.bg,
              position: 'relative',
              px: 2.25,
              py: 1.75,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0))',
                pointerEvents: 'none',
              },
            }}>
              <Box sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                flexShrink: 0,
                background: toastAccent.soft,
                border: `1px solid ${toastAccent.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                '@keyframes toastIconLift': {
                  from: { transform: 'translateY(6px) scale(0.9)', opacity: 0 },
                  to: { transform: 'translateY(0) scale(1)', opacity: 1 },
                },
                animation: 'toastIconLift 0.35s cubic-bezier(0.22,1,0.36,1) 0.08s both',
              }}>
                {toastAccent.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.15,
                  py: 0.45,
                  mb: 0.8,
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.22)',
                  border: `1px solid rgba(255,255,255,0.28)`,
                }}>
                  <Typography sx={{
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  }}>
                    Proses Approval
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.2, fontSize: { xs: '1.08rem', sm: '1.02rem' }, textShadow: '0 2px 10px rgba(0,0,0,0.16)' }}>
                  {toastTitle}
                </Typography>
                <Typography variant="caption" sx={{
                  color: '#f8fffc',
                  display: 'block',
                  mt: 0.75,
                  px: 1.1,
                  py: 0.8,
                  borderRadius: '12px',
                  background: 'rgba(7,59,46,0.18)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  fontSize: { xs: '0.82rem', sm: '0.78rem' },
                  fontWeight: 600,
                  lineHeight: 1.6,
                  textShadow: '0 1px 2px rgba(0,0,0,0.14)',
                }}>
                  {success}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Approval/rejection confirmation dialog */}
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
                  {isApprove ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                </p>
                <h2 className="dashboard-popup__title">
                  {isApprove ? 'Setujui Form Lembur' : 'Tolak Form Lembur'}
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
                    <p className="dashboard-popup__text"><strong>Form:</strong> {dialog.form.nomerForm}</p>
                    <p className="dashboard-popup__text"><strong>Departemen:</strong> {dialog.form.department}</p>
                    <p className="dashboard-popup__text"><strong>Diminta Oleh:</strong> {dialog.form.diperintahOleh}</p>
                    <p className="dashboard-popup__text"><strong>Kompensasi:</strong> {getKompensasiSummary(dialog.form)}</p>
                    {isApprove && dialog.entryIndices ? (
                      <p className="dashboard-popup__text">
                        <strong>Karyawan disetujui:</strong>{' '}
                        <span style={{ color: '#2a9d8f', fontWeight: 700 }}>
                          {dialog.entryIndices.length} dari {dialog.form.entries?.length} karyawan
                        </span>
                      </p>
                    ) : (
                      <p className="dashboard-popup__text"><strong>Jumlah Karyawan:</strong> {dialog.form.entries?.length} karyawan</p>
                    )}
                  </div>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Catatan (opsional)"
                    placeholder={
                      isApprove
                        ? 'Contoh: Disetujui sesuai kebutuhan operasional...'
                        : 'Contoh: Ditolak - dokumen tidak lengkap...'
                    }
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    size="small"
                  />
                </>
              )}
            </div>

            <div className="dashboard-popup__actions">
              <button
                type="button"
                className={`dashboard-popup__button ${isApprove ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
                onClick={handleApproval}
                disabled={submitting}
              >
                {submitting && (
                  <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />
                )}
                {submitting ? 'Memproses...' : isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Box>
  );
}
