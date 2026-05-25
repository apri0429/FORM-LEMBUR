import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, Printer, SearchMd, XClose } from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';
import StatusChip from '../components/StatusChip';
import { DetailLemburContent } from './DetailLembur';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { printLemburForm } from '../utils/printLembur';

const API = '/api/lembur';
const APPROVED_STATUSES = ['approved', 'partially_approved', 'rejected'];
const ROWS_OPTIONS = [10, 25, 50, 100];
const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

const pageSx = {
  height: '100%',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  '& .approved-main-panel': {
    flex: 1,
    height: '100%',
    minHeight: 0,
    maxHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '& .approved-main-panel .dashboard-panel__header': {
    flexShrink: 0,
  },
  '& .approved-main-panel .dashboard-panel__header--split': {
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: 2,
  },
  '& .approved-main-panel .dashboard-panel__action': {
    justifySelf: 'end',
  },
  '& .approved-main-panel__body': {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  '& .approved-list-pagination': {
    flexShrink: 0,
  },
  '@media (max-width: 768px)': {
    '& .approved-main-panel': {
      padding: '16px',
      borderRadius: '18px',
    },
    '& .approved-main-panel .dashboard-panel__header--split': {
      gridTemplateColumns: '1fr',
      gap: 1.25,
      paddingBottom: '12px',
      borderBottom: '1px solid rgba(26, 42, 87, 0.07)',
    },
    '& .approved-main-panel .dashboard-panel__action': {
      justifySelf: 'stretch',
      width: '100%',
    },
    '& .approved-main-panel .approval-filter-bar': {
      width: '100%',
      justifyContent: 'stretch',
    },
    '& .approved-main-panel .approval-filter-bar__field, & .approved-main-panel .approval-filter-bar__input--search, & .approved-main-panel .approval-filter-bar__select': {
      width: '100%',
    },
    '& .approved-list-pagination': {
      alignItems: 'stretch',
      gap: 1,
    },
    '& .approved-list-pagination > .MuiBox-root': {
      justifyContent: 'space-between',
    },
  },
};

const cellSx = {
  px: 1.25,
  py: 0.75,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

function formatKompensasi(value) {
  const text = String(value ?? '').trim();
  return text || '-';
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

function isAdminUser(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((keyword) => String(user.jobLevel || '').toLowerCase().includes(keyword))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD;
}

function canRevertAny(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD) return true;
  return MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );
}

function canRevertForm(user, form) {
  if (!user || !form) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  if (user.role === 'admin' || user.department === 'IT' || user.department === 'HCGA' || isBOD) return true;
  
  const isManager = MANAGER_KEYWORDS.some((k) =>
    String(user.jobPosition || '').toLowerCase().includes(k) ||
    String(user.jobLevel || '').toLowerCase().includes(k)
  );
  
  if (!isManager) return false;
  return form.department === user.department;
}

export default function ApprovedList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allForms, setAllForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [revertId, setRevertId] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [detailForm, setDetailForm] = useState(null);
  const [printForm, setPrintForm] = useState(null);
  const [loadedDetailForm, setLoadedDetailForm] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'desc' });

  useEffect(() => {
    setLoading(true);
    axios.get(API)
      .then((response) => setAllForms(response.data.data || []))
      .catch(() => setError('Gagal memuat data. Pastikan server backend berjalan.'))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = isAdminUser(user);
  const userCanRevertAny = canRevertAny(user);
  const actionColumnWidth = userCanRevertAny ? 220 : 120;
  const tableMinWidth = userCanRevertAny ? 1040 : 880;

  // Unique departemen options derived from all approved forms
  const divisiOptions = [...new Set(
    allForms
      .filter((form) => APPROVED_STATUSES.includes(form.status))
      .map((form) => form.department)
      .filter(Boolean)
  )].sort();

  const handleRevert = () => {
    if (!revertId) return;
    setReverting(true);
    axios.patch(`${API}/${revertId}/status`, { status: 'pending' })
      .then(() => axios.get(API))
      .then((response) => {
        setAllForms(response.data.data || []);
        setRevertId(null);
      })
      .catch(() => setError('Gagal mengembalikan form. Coba lagi.'))
      .finally(() => setReverting(false));
  };

  const forms = allForms
    .filter((form) => APPROVED_STATUSES.includes(form.status))
    .filter((form) => isAdmin || form.department === user?.department)
    .filter((form) => {
      if (filterStatus && form.status !== filterStatus) return false;
      if (filterDivisi && form.department !== filterDivisi) return false;

      if (filterDate) {
        const [y, m, d] = filterDate.split('-');
        const dateVariations = [
          filterDate,
          `${d}-${m}-${y}`,
          `${d}/${m}/${y}`,
        ];
        const match = dateVariations.some(dateStr => 
          form.tanggalPengajuan?.includes(dateStr) || form.lemburPada?.includes(dateStr)
        );
        if (!match) return false;
      }

      if (search) {
        const query = search.toLowerCase();
        return (
          form.nomerForm?.toLowerCase().includes(query) ||
          form.department?.toLowerCase().includes(query) ||
          form.diperintahOleh?.toLowerCase().includes(query) ||
          form.kodeDivisi?.toLowerCase().includes(query) ||
          form.entries?.some((entry) => entry.nama?.toLowerCase().includes(query))
        );
      }

      return true;
    });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedForms = [...forms].reverse().sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = String(a[sortConfig.key] || '');
    const bValue = String(b[sortConfig.key] || '');
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedForms.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedForms = sortedForms.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterStatus = (value) => {
    setFilterStatus(value);
    setPage(1);
  };

  const handleFilterDivisi = (value) => {
    setFilterDivisi(value);
    setPage(1);
  };

  const handleRowsPerPage = (value) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  const headerAction = (
    <div className="approval-filter-bar">
      <div className="approval-filter-bar__field">
        <span className="approval-filter-bar__field-icon">
          <SearchMd size={15} />
        </span>
        <input
          type="text"
          className="approval-filter-bar__input approval-filter-bar__input--search"
          placeholder="Cari no. form, dept, nama..."
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
        />
      </div>

      <div
        className="approval-filter-bar__field"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          const input = e.currentTarget.querySelector('input[type="date"]');
          if (input && typeof input.showPicker === 'function') {
            try { input.showPicker(); } catch (_) {}
          }
        }}
      >
        <span className="approval-filter-bar__field-icon" style={{ left: 5 }}>
          <span style={{
            width: 26,
            height: 26,
            borderRadius: 4,
            background: '#e7eef7',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CalendarMonthRoundedIcon style={{ fontSize: 16 }} />
          </span>
        </span>
        <input
          type="text"
          readOnly
          placeholder="Filter Tanggal"
          className="approval-filter-bar__input approval-filter-bar__input--date"
          style={{ cursor: 'pointer', paddingLeft: 38, paddingRight: filterDate ? '28px' : undefined }}
          value={filterDate ? filterDate.split('-').reverse().join('/') : ''}
        />
        <input
          type="date"
          value={filterDate}
          onChange={(event) => { setFilterDate(event.target.value); setPage(1); }}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, bottom: 0, left: '50%', pointerEvents: 'none' }}
          tabIndex={-1}
        />
        {filterDate && (
          <span
            className="approval-filter-bar__field-icon approval-filter-bar__field-icon--right"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setFilterDate(''); setPage(1); }}
          >
            <XClose size={13} />
          </span>
        )}
      </div>

      <div className="approval-filter-bar__field">
        <select
          className="approval-filter-bar__select"
          value={filterDivisi}
          onChange={(event) => handleFilterDivisi(event.target.value)}
        >
          <option value="">Semua Departemen</option>
          {divisiOptions.map((divisi) => (
            <option key={divisi} value={divisi}>{divisi}</option>
          ))}
        </select>
        <span className="approval-filter-bar__field-icon approval-filter-bar__field-icon--right">
          <ChevronDown size={14} />
        </span>
      </div>

      <div className="approval-filter-bar__field">
        <select
          className="approval-filter-bar__select"
          value={filterStatus}
          onChange={(event) => handleFilterStatus(event.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
        <span className="approval-filter-bar__field-icon approval-filter-bar__field-icon--right">
          <ChevronDown size={14} />
        </span>
      </div>
    </div>
  );

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>{error}</Alert>}

          <CardBigBox
            className="approved-main-panel"
            contentClassName="approved-main-panel__body"
            eyebrow="Daftar Form"
            title="Form Diproses"
            headerAction={headerAction}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : forms.length === 0 ? (
              <Box className="dashboard-empty-state">
                <CheckCircleIcon sx={{ fontSize: 52, color: 'success.light', mb: 1.5 }} />
                <p className="dashboard-empty-state__title">Tidak ada data ditemukan</p>
                <p className="dashboard-empty-state__detail">Coba ubah filter atau kata pencarian.</p>
              </Box>
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowX: 'auto',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    scrollbarGutter: 'stable',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    width: '100%',
                    '@media (max-width: 768px)': { display: 'none' },
                  }}
                >
                  <Table
                    size="small"
                    stickyHeader
                    sx={{
                      minWidth: tableMinWidth,
                      tableLayout: 'fixed',
                      '& .MuiTableCell-root': cellSx,
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '18%' }}>
                          <TableSortLabel active={sortConfig.key === 'nomerForm'} direction={sortConfig.key === 'nomerForm' ? sortConfig.direction : 'asc'} onClick={() => handleSort('nomerForm')}>No. Form</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '18%' }}>
                          <TableSortLabel active={sortConfig.key === 'department'} direction={sortConfig.key === 'department' ? sortConfig.direction : 'asc'} onClick={() => handleSort('department')}>Department</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '15%' }}>
                          <TableSortLabel active={sortConfig.key === 'diperintahOleh'} direction={sortConfig.key === 'diperintahOleh' ? sortConfig.direction : 'asc'} onClick={() => handleSort('diperintahOleh')}>Diperintah Oleh</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '13%' }}>
                          <TableSortLabel active={sortConfig.key === 'tanggalPengajuan'} direction={sortConfig.key === 'tanggalPengajuan' ? sortConfig.direction : 'asc'} onClick={() => handleSort('tanggalPengajuan')}>Tgl Pengajuan</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '12%' }}>
                          <TableSortLabel active={sortConfig.key === 'lemburPada'} direction={sortConfig.key === 'lemburPada' ? sortConfig.direction : 'asc'} onClick={() => handleSort('lemburPada')}>Lembur Pada</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: '12%' }}>
                          <TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ width: actionColumnWidth }} align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedForms.map((form) => {
                        const isOpen = expandedId === form.id;

                        return (
                          <React.Fragment key={form.id}>
                            <TableRow
                              hover
                              sx={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => setExpandedId(isOpen ? null : form.id)}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                                  <IconButton size="small" sx={{ p: 0.25, flexShrink: 0 }}>
                                    {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  </IconButton>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={800} color="primary.main">
                                      {form.nomerForm}
                                    </Typography>
                                    <Chip label={form.kodeDivisi} color="primary" size="small" sx={{ mt: 0.25 }} />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>{form.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{form.diperintahOleh}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{form.tanggalPengajuan}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={form.lemburPada}
                                  size="small"
                                  color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <StatusChip status={form.status} />
                              </TableCell>
                              <TableCell align="center" onClick={(event) => event.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                                <Box className="approved-list-actions">
                                  <CreateButton
                                    variant="accordion"
                                    className="approved-list-action-button"
                                    onClick={() => setDetailForm(form)}
                                  >
                                    <FactCheckRoundedIcon sx={{ fontSize: 15 }} />
                                    Detail
                                  </CreateButton>
                                  {canRevertForm(user, form) && form.status !== 'pending' && (
                                    <CreateButton
                                      variant="accordion"
                                      className="approved-list-action-button approved-list-action-button--revert"
                                      onClick={() => setRevertId(form.id)}
                                    >
                                      <RestoreRoundedIcon sx={{ fontSize: 15 }} />
                                      Kembalikan
                                    </CreateButton>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>

                            <TableRow sx={{ bgcolor: 'rgba(248,250,252,0.9)' }}>
                              <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                  <Box sx={{ px: 2, py: 1.5, overflowX: 'auto' }}>
                                    <Table
                                      size="small"
                                      sx={{
                                        minWidth: 860,
                                        tableLayout: 'auto',
                                        '& .MuiTableCell-root': {
                                          px: 1.25,
                                          py: 0.75,
                                          fontSize: '0.8rem',
                                          verticalAlign: 'top',
                                        },
                                      }}
                                    >
                                      <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Internal ID</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 140 }}>Nama</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>ID Karyawan</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Tgl Lembur</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Mulai</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Selesai</TableCell>
                                          <TableCell sx={{ fontWeight: 700, minWidth: 200, whiteSpace: 'normal' }}>Tugas</TableCell>
                                          <TableCell sx={{ fontWeight: 700, minWidth: 180, whiteSpace: 'normal' }}>Hasil</TableCell>
                                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Kompensasi</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {(form.entries ?? []).map((entry, idx) => (
                                          <TableRow key={idx} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.internalId || '-'}</TableCell>
                                            <TableCell>
                                              <Typography variant="body2" fontWeight={700}>{entry.nama}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.idKaryawan || '-'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.tanggalLembur}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.jamMulai}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.jamSelesai}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 200 }}>{entry.tugas || '-'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: 180 }}>{entry.hasil || '-'}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                              <Typography variant="body2" fontWeight={800} color="secondary.main">
                                                {formatKompensasi(entry.kompensasi)}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
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

                {/* Mobile card view */}
                <Box
                  sx={{
                    display: 'none',
                    '@media (max-width: 768px)': {
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      overscrollBehavior: 'contain',
                      gap: '12px',
                      pb: '8px',
                    },
                  }}
                >
                  <div className="dashboard-stack">
                    {paginatedForms.map((form) => {
                      const isOpen = expandedId === form.id;
                      const entries = form.entries ?? [];
                      const entriesCount = entries.length;

                      return (
                        <div key={form.id} className="dashboard-stack__item approval-card">
                          <div className="approval-card__header">
                            <div className="approval-card__info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                  {form.nomerForm}
                                </Typography>
                                <StatusChip status={form.status} />
                                {form.kodeDivisi && <Chip label={form.kodeDivisi} color="primary" size="small" />}
                                {form.lemburPada && (
                                  <Chip
                                    label={form.lemburPada}
                                    size="small"
                                    color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                                    variant="outlined"
                                  />
                                )}
                              </div>
                              <Typography variant="body2" color="text.secondary">
                                <strong>{form.department}</strong>
                                {' — '}Diperintah oleh: <strong>{form.diperintahOleh}</strong>
                                {' — '}Tgl: {form.tanggalPengajuan}
                              </Typography>
                              <div style={{ marginTop: 6 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {entriesCount} karyawan
                                </Typography>
                              </div>
                            </div>

                            <div className="approval-card__actions">
                              <CreateButton
                                variant="accordion"
                                onClick={() => setDetailForm(form)}
                              >
                                <FactCheckRoundedIcon sx={{ fontSize: 15 }} />
                                Detail
                              </CreateButton>
                              {canRevertForm(user, form) && form.status !== 'pending' && (
                                <CreateButton
                                  variant="accordion"
                                  className="approval-card__edit-btn"
                                  onClick={() => setRevertId(form.id)}
                                >
                                  <RestoreRoundedIcon sx={{ fontSize: 15 }} />
                                  Kembalikan
                                </CreateButton>
                              )}
                            </div>

                            <button
                              type="button"
                              className={`approval-entry-toggle${isOpen ? ' approval-entry-toggle--open' : ''}`}
                              onClick={() => setExpandedId(isOpen ? null : form.id)}
                              aria-label={isOpen ? 'Sembunyikan entri lembur' : 'Tampilkan entri lembur'}
                              aria-expanded={isOpen}
                              disabled={entriesCount === 0}
                            >
                              {isOpen
                                ? <ExpandLessIcon sx={{ fontSize: 20, display: 'block' }} />
                                : <ExpandMoreIcon sx={{ fontSize: 20, display: 'block' }} />}
                            </button>
                          </div>

                          <Collapse in={isOpen && entriesCount > 0}>
                            <hr style={{ margin: '14px 0', border: 'none', borderTop: '1px solid rgba(26,42,87,0.08)' }} />
                            <p style={{ margin: '0 0 10px', color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                              Detail Entri Lembur
                            </p>
                            <div className="users-table-wrapper approval-entry-table-wrapper">
                              <table className="users-table approval-mobile-table">
                                <thead>
                                  <tr>
                                    <th>Internal ID</th>
                                    <th>Nama</th>
                                    <th>ID Karyawan</th>
                                    <th>Tgl Lembur</th>
                                    <th>Mulai</th>
                                    <th>Selesai</th>
                                    <th>Tugas</th>
                                    <th>Hasil</th>
                                    <th>Kompensasi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entries.map((entry, idx) => (
                                    <tr key={idx}>
                                      <td data-label="Internal ID">
                                        <span className="users-table__status users-table__status--inline users-table__status--pending">
                                          {entry.internalId || '-'}
                                        </span>
                                      </td>
                                      <td data-label="Nama">
                                        <strong className="users-table__name">{entry.nama}</strong>
                                      </td>
                                      <td data-label="ID Karyawan">
                                        <span className="users-table__status users-table__status--inline users-table__status--app">
                                          {entry.idKaryawan || '-'}
                                        </span>
                                      </td>
                                      <td data-label="Tgl Lembur">{entry.tanggalLembur}</td>
                                      <td data-label="Mulai">{entry.jamMulai}</td>
                                      <td data-label="Selesai">{entry.jamSelesai}</td>
                                      <td data-label="Tugas" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        {entry.tugas || '-'}
                                      </td>
                                      <td data-label="Hasil" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                        {entry.hasil || '-'}
                                      </td>
                                      <td data-label="Kompensasi">
                                        <strong style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.kompensasi)}</strong>
                                      </td>
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
                </Box>

                <Box
                  className="approved-list-pagination"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    pt: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Tampilkan</Typography>
                    <TextField
                      select
                      size="small"
                      value={rowsPerPage}
                      onChange={(event) => handleRowsPerPage(event.target.value)}
                      sx={{ width: 80 }}
                    >
                      {ROWS_OPTIONS.map((rows) => (
                        <MenuItem key={rows} value={rows}>{rows}</MenuItem>
                      ))}
                    </TextField>
                    <Typography variant="body2" color="text.secondary">baris</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {(safePage - 1) * rowsPerPage + 1}-{Math.min(safePage * rowsPerPage, forms.length)} dari {forms.length}
                    </Typography>
                    <IconButton size="small" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>
                      <KeyboardArrowLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages}>
                      <KeyboardArrowRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>

      {/* Detail popup — rendered via portal so sidebar/header don't overlap it */}
      {detailForm && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => { setDetailForm(null); setLoadedDetailForm(null); }}>
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
              <button
                type="button"
                className="dashboard-popup__close"
                aria-label="Tutup"
                onClick={() => { setDetailForm(null); setLoadedDetailForm(null); }}
              >
                <XClose size={18} />
              </button>
            </div>

            <div className="dashboard-popup__body--frp-detail">
              <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DetailLemburContent formId={detailForm.id} onClose={null} inPopup={true} onFormLoaded={setLoadedDetailForm} />
              </div>
            </div>

            <div className="dashboard-popup__actions" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={() => setPrintForm(detailForm)}
              >
                <Printer size={15} />
                Cetak
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm revert dialog */}
      {!!revertId && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => !reverting && setRevertId(null)}>
          <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Konfirmasi</p>
                <h2 className="dashboard-popup__title">Kembalikan ke Approval?</h2>
              </div>
              <button type="button" className="dashboard-popup__close" aria-label="Tutup" onClick={() => !reverting && setRevertId(null)}>
                <XClose size={18} />
              </button>
            </div>
            <div className="dashboard-popup__body">
              <p className="dashboard-popup__text">
                Form ini akan dikembalikan ke status <strong>Menunggu Approval</strong>. Approval sebelumnya akan direset dan form perlu disetujui ulang.
              </p>
            </div>
            <div className="dashboard-popup__actions">
              <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary" onClick={() => setRevertId(null)} disabled={reverting}>
                Batal
              </button>
              <button type="button" className="dashboard-popup__button dashboard-popup__button--primary" onClick={handleRevert} disabled={reverting}>
                {reverting && <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />}
                {reverting ? 'Memproses...' : 'Ya, Kembalikan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Print Preview Modal */}
      {printForm && <PrintPreviewModal form={printForm} onClose={() => setPrintForm(null)} />}
    </Box>
  );
}
