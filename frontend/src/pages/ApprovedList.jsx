import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';

import axios from 'axios';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, Printer, SearchMd, XClose } from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';
import { DetailLemburContent } from './DetailLembur';
import PrintPreviewModal from '../components/PrintPreviewModal';

const API = '/api/lembur';
const ROWS_OPTIONS = [10, 25, 50, 100];
const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];
const STATUS_CHIP_MAP = {
  approved: { label: 'Disetujui', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  rejected:  { label: 'Ditolak',   color: 'error',   icon: <CancelIcon fontSize="small" /> },
};

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

const pageSx = {
  height: '100%',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  overflow: 'hidden',
  '& .approved-main-panel': {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '& .approved-main-panel__body': {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};


function getProcessedBy(form) {
  if (!form) return '-';
  if (form.status === 'rejected') return form.rejectedBy || '-';
  return form.approvedBy || '-';
}

function formatKompensasi(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function formatLemburPada(value) {
  return String(value ?? '').trim() || '-';
}

function ApprovedStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}

function isAdminUser(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((keyword) => String(user.jobLevel || '').toLowerCase().includes(keyword))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD;
}

function canRevertForm(user, form) {
  if (!user || !form) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || isBOD) return true;

  const isHCGA = user.department === 'HCGA';
  const isManager = MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );

  if (!isHCGA && !isManager) return false;
  return form.department === user.department;
}

export default function ApprovedList() {
  const { user } = useAuth();

  const [forms, setForms] = useState([]);
  const [total, setTotal] = useState(0);
  const [divisiOptions, setDivisiOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [filterJenisForm, setFilterJenisForm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [revertId, setRevertId] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [detailForm, setDetailForm] = useState(null);
  const [printForm, setPrintForm] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = isAdminUser(user);

  // Fetch divisi options once on mount
  useEffect(() => {
    axios.get(`${API}/filter-options`)
      .then((r) => setDivisiOptions(r.data.data?.departments || []))
      .catch(() => {});
  }, []);

  // Fetch data from server whenever filters/sort/page change
  useEffect(() => {
    setLoading(true);
    const params = {
      excludePending: 'true',
      page,
      rowsPerPage,
    };
    if (filterStatus) params.statuses = filterStatus;
    if (search) params.search = search;
    if (filterDivisi) params.department = filterDivisi;
    else if (!isAdmin && user?.department) params.department = user.department;
    if (filterJenisForm) params.jenisForm = filterJenisForm;

    axios.get(API, { params })
      .then((r) => { setForms(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => setError('Gagal memuat data. Pastikan server backend sedang berjalan.'))
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterDivisi, filterJenisForm, page, rowsPerPage, isAdmin, user?.department, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const isFiltered = Boolean(search || filterStatus || filterDivisi || filterJenisForm);
  const isEmptyState = !loading && forms.length === 0;

  const handleRevert = () => {
    if (!revertId) return;
    setReverting(true);
    axios.patch(`${API}/${revertId}/status`, { status: 'pending' })
      .then(() => { setRevertId(null); setRefreshKey((k) => k + 1); })
      .catch(() => setError('Gagal mengembalikan form. Coba lagi.'))
      .finally(() => setReverting(false));
  };

  const handleSearch = (value) => { setSearch(value); setPage(1); };
  const handleFilterStatus = (value) => { setFilterStatus(value); setPage(1); };
  const handleFilterDivisi = (value) => { setFilterDivisi(value); setPage(1); };
  const handleFilterJenisForm = (value) => { setFilterJenisForm(value); setPage(1); };
  const handleRowsPerPage = (value) => { setRowsPerPage(Number(value)); setPage(1); };

  const selectSx = {
    width: '100%',
    minWidth: '100%',
    '& .MuiOutlinedInput-root': {
      width: '100%',
      height: 44,
      borderRadius: '11px',
      bgcolor: '#eef2f6',
      boxShadow: 'none',
      '& fieldset': { border: '1.5px solid rgba(26,42,87,0.11)' },
      '&:hover fieldset': { borderColor: 'rgba(26,42,87,0.16)' },
      '&.Mui-focused': { bgcolor: '#fff', transform: 'translateY(-1px)', boxShadow: '0 0 0 3.5px rgba(37,99,168,0.1)' },
      '&.Mui-focused fieldset': { borderColor: 'rgba(37,99,168,0.4)' },
    },
    '& .MuiInputBase-root': { width: '100%' },
    '& .MuiSelect-select': {
      display: 'block', width: '100%', minWidth: 0,
      py: '0 !important', pl: '4px !important', pr: '36px !important',
      height: '44px !important', lineHeight: '44px', boxSizing: 'border-box', textOverflow: 'ellipsis',
    },
    '& .MuiSelect-icon': { color: '#6b7a90', right: 12 },
  };

  const filterCard = (
    <div className={`approval-filter-card approved-filter-card${mobileFilterOpen ? ' approval-filter-card--mobile-open' : ''}`}>
      <button
        type="button"
        className="approval-filter-card__toggle"
        onClick={() => setMobileFilterOpen((prev) => !prev)}
        aria-expanded={mobileFilterOpen}
        aria-controls="approved-filter-fields"
      >
        <span className="approval-filter-card__toggle-label">
          <FilterListRoundedIcon sx={{ fontSize: 20 }} />
          Filter & Pencarian
        </span>
        <ChevronDown size={18} style={{ transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)', transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      <div id="approved-filter-fields" className="approval-filter-card__fields">
        {/* Search */}
        <div className="approval-filter-card__field approval-filter-card__field--search">
          <span className="approval-filter-card__label">Pencarian</span>
          <div className="approval-filter-card__input-wrap">
            <span className="approval-filter-card__icon"><SearchMd size={18} /></span>
            <input
              type="text"
              className="approval-filter-card__input"
              placeholder="Cari form atau nama..."
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
            />
          </div>
        </div>

        {/* Departemen */}
        <div className="approval-filter-card__field" style={{ flex: '1 1 220px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Departemen</span>
          <TextField
            select fullWidth value={filterDivisi}
            onChange={(e) => handleFilterDivisi(e.target.value)}
            SelectProps={{ displayEmpty: true }}
            InputProps={{ startAdornment: (
              <Box sx={{ display:'flex', alignItems:'center', color:'#6b7a90', mr:0.75, ml:0.25 }}>
                <ApartmentRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            )}}
            sx={selectSx}
          >
            <MenuItem value=""><em style={{ color:'#94a3b8' }}>Semua Departemen</em></MenuItem>
            {divisiOptions.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
        </div>

        {/* Jenis Form */}
        <div className="approval-filter-card__field" style={{ flex: '1 1 220px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Jenis Form</span>
          <TextField
            select fullWidth value={filterJenisForm}
            onChange={(e) => handleFilterJenisForm(e.target.value)}
            SelectProps={{ displayEmpty: true }}
            InputProps={{ startAdornment: (
              <Box sx={{ display:'flex', alignItems:'center', color:'#6b7a90', mr:0.75, ml:0.25 }}>
                <AssignmentIndRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            )}}
            sx={selectSx}
          >
            <MenuItem value=""><em style={{ color:'#94a3b8' }}>Semua Jenis</em></MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="outsourcing">Outsourcing</MenuItem>
            <MenuItem value="harian_lepas">Harian Lepas</MenuItem>
          </TextField>
        </div>

        {/* Status */}
        <div className="approval-filter-card__field" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <span className="approval-filter-card__label">Status</span>
          <TextField
            select fullWidth value={filterStatus}
            onChange={(e) => handleFilterStatus(e.target.value)}
            SelectProps={{ displayEmpty: true }}
            InputProps={{ startAdornment: (
              <Box sx={{ display:'flex', alignItems:'center', color:'#6b7a90', mr:0.75, ml:0.25 }}>
                <LocalOfferRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            )}}
            sx={selectSx}
          >
            <MenuItem value=""><em style={{ color:'#94a3b8' }}>Semua Status</em></MenuItem>
            <MenuItem value="approved">Disetujui</MenuItem>
            <MenuItem value="rejected">Ditolak</MenuItem>
          </TextField>
        </div>
      </div>
    </div>
  );

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}

          {filterCard}

          <CardBigBox
            eyebrow="Daftar Form"
            title="Form Diproses"
            className={`approved-main-panel${isEmptyState ? ' approval-main-panel--empty' : ''}`}
            contentClassName={`approved-main-panel__body${isEmptyState ? ' approval-panel-body--empty' : ''}`}
            footer={total > 0 && !loading ? (
              <div className="approval-pagination">
                <div className="approval-pagination__rows">
                  <span className="approval-pagination__rows-text">Tampilkan</span>
                  <TextField
                    select size="small" value={rowsPerPage}
                    onChange={(e) => handleRowsPerPage(e.target.value)}
                    sx={{ width: 72 }}
                  >
                    {ROWS_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                  <span className="approval-pagination__rows-text">baris</span>
                </div>
                <div className="approval-pagination__nav">
                  <span className="approval-pagination__info">
                    {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, total)} dari {total}
                  </span>
                  <button type="button" className="approval-pagination__btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                    <KeyboardArrowLeftIcon sx={{ fontSize: 16 }} />
                    <span className="approval-pagination__btn-label">Previous</span>
                  </button>
                  <button type="button" className="approval-pagination__btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                    <span className="approval-pagination__btn-label">Next</span>
                    <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
                  </button>
                </div>
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
                            {isFiltered
                              ? <SearchOffRoundedIcon className="approval-empty__check" />
                              : <FactCheckRoundedIcon className="approval-empty__check" />}
                          </div>
                        </div>
                      </div>
                      <div className="approval-empty__content">
                        <p className="approval-empty__title">
                          {isFiltered ? 'Data tidak ditemukan' : 'Belum ada form diproses'}
                        </p>
                        <p className="approval-empty__desc">
                          {isFiltered
                            ? 'Coba ubah filter atau kata kunci pencarian yang digunakan.'
                            : 'Belum ada form lembur yang masuk ke daftar disetujui atau ditolak.'}
                        </p>
                        {isFiltered && (
                          <button
                            type="button"
                            className="approval-empty__reset"
                            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDivisi(''); setFilterJenisForm(''); setPage(1); }}
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
                {/* ── Desktop: collapsible datatable ── */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    flex: 1, minHeight: 0, overflowY: 'auto',
                    overscrollBehavior: 'contain', scrollbarGutter: 'stable',
                    border: '1px solid', borderColor: 'divider', borderRadius: 2,
                    background: 'linear-gradient(180deg,rgba(248,250,252,0.9) 0%,rgba(255,255,255,0.96) 100%)',
                    '@media (max-width: 768px)': { display: 'none' },
                  }}
                >
                  <Table size="small" stickyHeader sx={{
                    '& .MuiTableCell-root': { px: 1.25, py: 0.75, fontSize: '0.82rem', transition: 'background .15s' },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontSize: '0.74rem', fontWeight: 800, color: '#607089',
                      backgroundColor: '#f3f6fa',
                      borderBottom: '1px solid rgba(26,42,87,0.1)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                    },
                    '& .MuiTableBody-root .form-summary-row:hover td': { background: 'rgba(237,242,250,0.85)' },
                    '& .MuiTableBody-root .form-summary-row td': { transition: 'background .15s' },
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 36 }} />
                        <TableCell sx={{ width: 160 }}>No. Form</TableCell>
                        <TableCell sx={{ width: 110 }}>Jenis</TableCell>
                        <TableCell sx={{ width: 110, whiteSpace: 'nowrap' }}>Tgl. Pengajuan</TableCell>
                        <TableCell>Departemen</TableCell>
                        <TableCell>Diperintah</TableCell>
                        <TableCell sx={{ width: 80, whiteSpace: 'nowrap' }}>Jml. Org</TableCell>
                        <TableCell sx={{ width: 115 }}>Status</TableCell>
                        <TableCell sx={{ width: 140 }}>Diproses Oleh</TableCell>
                        <TableCell sx={{ width: 150 }} align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {forms.map((form, formIdx) => {
                        const entries = form.entries ?? [];
                        const isOpen = expandedId === form.id;
                        return (
                          <React.Fragment key={form.id}>
                            <TableRow
                              className="form-summary-row"
                              hover
                              onClick={() => setExpandedId(isOpen ? null : form.id)}
                              sx={{
                                cursor: 'pointer',
                                borderBottom: isOpen ? 'none' : undefined,
                                animation: 'cardSlideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
                                animationDelay: `${Math.min(formIdx * 0.03, 0.15)}s`,
                              }}
                            >
                              <TableCell sx={{ color: '#94a3b8', textAlign: 'center', pr: 0 }}>
                                {isOpen
                                  ? <ExpandLessIcon sx={{ fontSize: 18, display: 'block', mx: 'auto' }} />
                                  : <ExpandMoreIcon sx={{ fontSize: 18, display: 'block', mx: 'auto' }} />}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={800} color="primary.main">{form.nomerForm}</Typography>
                              </TableCell>
                              <TableCell><FormTypeBadge jenisForm={form.jenisForm} /></TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">{form.tanggalPengajuan || '-'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{form.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{form.diperintahOleh || '-'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" fontSize="0.78rem">{entries.length} org</Typography>
                              </TableCell>
                              <TableCell><ApprovedStatusChip status={form.status} /></TableCell>
                              <TableCell>
                                <Typography variant="body2" noWrap title={getProcessedBy(form)} sx={{ maxWidth: 130 }}>
                                  {getProcessedBy(form)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                                  <CreateButton variant="accordion" onClick={() => setDetailForm(form)}>
                                    <FactCheckRoundedIcon sx={{ fontSize: 15 }} />
                                    Detail
                                  </CreateButton>
                                  {canRevertForm(user, form) && (
                                    <CreateButton variant="accordion" className="approval-card__edit-btn" onClick={() => setRevertId(form.id)}>
                                      <RestoreRoundedIcon sx={{ fontSize: 15 }} />
                                      Revert
                                    </CreateButton>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell colSpan={10} sx={{ py: 0, border: isOpen ? undefined : 'none !important' }}>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                  <Box sx={{
                                    mx: 2, my: 1.5,
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(26,42,87,0.08)',
                                    background: 'rgba(248,250,252,0.7)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                  }}>
                                    <Typography variant="caption" fontWeight={800} color="primary.main"
                                      sx={{ display: 'block', px: 1.5, pt: 1.25, pb: 0.75, borderBottom: '1px solid rgba(26,42,87,0.07)', letterSpacing: '0.03em' }}>
                                      DETAIL ENTRI LEMBUR
                                    </Typography>
                                    <TableContainer sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 260 }}>
                                    <Table size="small" sx={{
                                      '& .MuiTableCell-root': { px: 1.25, py: 0.6, fontSize: '0.8rem' },
                                      '& .MuiTableHead-root .MuiTableCell-root': {
                                        fontSize: '0.72rem', fontWeight: 700, color: '#7a8fa6',
                                        background: 'rgba(241,245,249,0.5)',
                                        borderBottom: '1px solid rgba(26,42,87,0.08)',
                                        position: 'sticky', top: 0, zIndex: 1,
                                      },
                                    }}>
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ width: 34 }}>No</TableCell>
                                          <TableCell sx={{ width: 140 }}>Nama</TableCell>
                                          <TableCell sx={{ width: 110 }}>ID Karyawan</TableCell>
                                          <TableCell sx={{ width: 105, whiteSpace: 'nowrap' }}>Tgl. Lembur</TableCell>
                                          <TableCell sx={{ width: 68 }}>Mulai</TableCell>
                                          <TableCell sx={{ width: 68 }}>Selesai</TableCell>
                                          <TableCell>Tugas</TableCell>
                                          <TableCell>Hasil</TableCell>
                                          <TableCell sx={{ width: 100 }}>Kompensasi</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {entries.length === 0 ? (
                                          <TableRow>
                                            <TableCell colSpan={9} sx={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                                              Tidak ada entri
                                            </TableCell>
                                          </TableRow>
                                        ) : entries.map((entry, idx) => (
                                          <TableRow key={idx} hover>
                                            <TableCell sx={{ color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>{idx + 1}</TableCell>
                                            <TableCell>
                                              <Typography variant="body2" fontWeight={700} noWrap title={entry.nama}>{entry.nama}</Typography>
                                            </TableCell>
                                            <TableCell>
                                              <span className="users-table__status users-table__status--inline users-table__status--app" style={{ fontSize: '0.75rem' }}>
                                                {entry.idKaryawan || '-'}
                                              </span>
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.tanggalLembur}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.jamMulai}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.jamSelesai}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.tugas || '-'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.hasil || '-'}</TableCell>
                                            <TableCell>
                                              <Typography variant="body2" fontWeight={800} color="secondary.main" noWrap>
                                                {formatKompensasi(entry.kompensasi)}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    </TableContainer>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* ── Mobile: cards ── */}
                <Box sx={{
                  display: 'none',
                  '@media (max-width: 768px)': {
                    display: 'flex', flexDirection: 'column',
                    flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
                  },
                }}>
                  <div className="approval-scroll-surface">
                    <div className="dashboard-stack approval-content-stack">
                      {forms.map((form) => {
                        const isOpen = expandedId === form.id;
                        const entries = form.entries ?? [];
                        return (
                          <div
                            key={form.id}
                            className="dashboard-stack__item approval-card"
                            onClick={() => setExpandedId(isOpen ? null : form.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="approval-card__header">
                              <div className="approval-card__info">
                                <div className="approval-card__topline">
                                  <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.92rem' }}>
                                    {form.nomerForm}
                                  </Typography>
                                  <ApprovedStatusChip status={form.status} />
                                  <FormTypeBadge jenisForm={form.jenisForm} />
                                </div>
                                <div className="approval-card__meta">
                                  <span className="approval-card__meta-item">
                                    <span className="approval-card__meta-label">Departemen</span>
                                    <strong>{form.department}</strong>
                                  </span>
                                  <span className="approval-card__meta-separator" aria-hidden="true" />
                                  <span className="approval-card__meta-item">
                                    <span className="approval-card__meta-label">Diminta oleh</span>
                                    <strong>{form.diperintahOleh}</strong>
                                  </span>
                                  <span className="approval-card__meta-separator" aria-hidden="true" />
                                  <span className="approval-card__meta-item">
                                    <span className="approval-card__meta-label">Diproses oleh</span>
                                    <strong>{getProcessedBy(form)}</strong>
                                  </span>
                                  <span className="approval-card__meta-separator" aria-hidden="true" />
                                  <span className="approval-card__meta-item">
                                    <span className="approval-card__meta-label">Tanggal</span>
                                    <strong>{form.tanggalPengajuan}</strong>
                                  </span>
                                </div>
                                <div className="approval-card__summary approval-card__summary--simple">
                                  <div className="approval-card__summary-item approval-card__summary-item--muted">
                                    <Typography variant="caption" color="text.secondary">{entries.length} karyawan</Typography>
                                  </div>
                                </div>
                              </div>
                              <div className="approval-card__actions" onClick={(e) => e.stopPropagation()}>
                                <CreateButton variant="accordion" onClick={() => setDetailForm(form)}>
                                  <FactCheckRoundedIcon sx={{ fontSize: 15 }} />
                                  Detail
                                </CreateButton>
                                {canRevertForm(user, form) && (
                                  <CreateButton variant="accordion" className="approval-card__edit-btn" onClick={() => setRevertId(form.id)}>
                                    <RestoreRoundedIcon sx={{ fontSize: 15 }} />
                                    Revert
                                  </CreateButton>
                                )}
                              </div>
                              <div className={`approval-entry-toggle${isOpen ? ' approval-entry-toggle--open' : ''}`} aria-hidden="true">
                                {isOpen ? <ExpandLessIcon sx={{ fontSize: 20, display: 'block' }} /> : <ExpandMoreIcon sx={{ fontSize: 20, display: 'block' }} />}
                              </div>
                            </div>

                            <Collapse in={isOpen} onClick={(e) => e.stopPropagation()}>
                              <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid rgba(26,42,87,0.08)' }} />
                              <p style={{ margin: '0 0 10px', color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>Detail Entri Lembur</p>
                              <div className="users-table-wrapper approval-entry-table-wrapper">
                                <table className="users-table approval-mobile-table">
                                  <thead><tr>
                                    <th>ID Internal</th><th>Nama</th><th>ID Karyawan</th>
                                    <th>Tgl. Lembur</th><th>Hari Lembur</th><th>Mulai</th>
                                    <th>Selesai</th><th>Tugas</th><th>Hasil</th><th>Kompensasi</th>
                                  </tr></thead>
                                  <tbody>
                                    {entries.map((entry, idx) => (
                                      <tr key={idx}>
                                        <td data-label="ID Internal"><span className="users-table__status users-table__status--inline users-table__status--pending">{entry.internalId || '-'}</span></td>
                                        <td data-label="Nama"><strong className="users-table__name">{entry.nama}</strong></td>
                                        <td data-label="ID Karyawan"><span className="users-table__status users-table__status--inline users-table__status--app">{entry.idKaryawan || '-'}</span></td>
                                        <td data-label="Tgl. Lembur">{entry.tanggalLembur}</td>
                                        <td data-label="Hari Lembur"><strong style={{ color: form.lemburPada === 'Hari Libur' ? '#d32f2f' : undefined }}>{formatLemburPada(form.lemburPada)}</strong></td>
                                        <td data-label="Mulai">{entry.jamMulai}</td>
                                        <td data-label="Selesai">{entry.jamSelesai}</td>
                                        <td data-label="Tugas" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.tugas || '-'}</td>
                                        <td data-label="Hasil" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.hasil || '-'}</td>
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
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>

      {/* Detail popup via portal so it is not covered by the sidebar/header */}
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
                <p className="dashboard-popup__eyebrow">Detail Form Lembur</p>
                <h2 className="dashboard-popup__title">{detailForm.nomerForm}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <ApprovedStatusChip status={detailForm.status} />
                <button
                  type="button"
                  className="dashboard-popup__close"
                  aria-label="Close"
                  onClick={() => setDetailForm(null)}
                >
                  <XClose size={18} />
                </button>
              </div>
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

      {/* Return confirmation dialog */}
      {!!revertId && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => !reverting && setRevertId(null)}>
          <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Konfirmasi</p>
                <h2 className="dashboard-popup__title">Revert ke Antrean?</h2>
              </div>
              <button type="button" className="dashboard-popup__close" aria-label="Close" onClick={() => !reverting && setRevertId(null)}>
                <XClose size={18} />
              </button>
            </div>
            <div className="dashboard-popup__body">
              <p className="dashboard-popup__text">
                Form ini akan dikembalikan ke status <strong>Menunggu Persetujuan</strong>. Persetujuan sebelumnya akan direset dan form harus disetujui kembali.
              </p>
            </div>
            <div className="dashboard-popup__actions">
              <button type="button" className="dashboard-popup__button dashboard-popup__button--primary" onClick={handleRevert} disabled={reverting}>
                {reverting && <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />}
                {reverting ? 'Memproses...' : 'Ya, Revert'}
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
