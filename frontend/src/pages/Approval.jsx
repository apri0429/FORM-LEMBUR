import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, Edit03, SearchMd, XClose } from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';
import StatusChip from '../components/StatusChip';

const API = '/api/lembur';
const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

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

  const isAdmin = isAdminUser(user);

  // Siapa yang bisa MELIHAT form ini di antrian
  const canUserSee = (form) => {
    if (form.status !== 'pending') return false;
    if (isAdmin) return true;
    return form.department === user?.department;
  };

  const isManager = isManagerUser(user);

  // Siapa yang bisa APPROVE/REJECT form ini
  const canUserAct = (form) => {
    if (isAdmin) return true;
    // Manager/supervisor bisa approve semua form di divisinya
    if (isManager && form.department === user?.department) return true;
    // Fallback: siapapun yang namanya ada di diperintahOleh
    return form.diperintahOleh === user?.fullName;
  };

  const fetchForms = () => {
    setLoading(true);
    axios.get(API)
      .then((r) => setAllForms(r.data.data || []))
      .catch(() => setError('Gagal memuat data. Pastikan server backend berjalan.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForms(); }, []);

  useEffect(() => {
    if (!detailForm) return;
    setSelectedEntryIndices(new Set(detailForm.entries?.map((_, i) => i) ?? []));
  }, [detailForm]);

  const divisiOptions = [...new Set(
    allForms.filter((f) => f.status === 'pending').map((f) => f.kodeDivisi).filter(Boolean)
  )].sort();

  const forms = allForms
    .filter(canUserSee)
    .filter((f) => {
      if (filterDivisi && f.kodeDivisi !== filterDivisi) return false;
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
      setSuccess(`Form ${dialog.form.nomerForm} — ${labelAction}`);
      closeDialog();
      fetchForms();
    } catch {
      setError('Gagal memproses approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const headerAction = (
    <div className="approval-filter-bar">
      {/* Pencarian */}
      <div className="approval-filter-bar__field">
        <span className="approval-filter-bar__field-icon">
          <SearchMd size={15} />
        </span>
        <input
          type="text"
          className="approval-filter-bar__input approval-filter-bar__input--search"
          placeholder="Cari no. form, dept, nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Divisi */}
      {divisiOptions.length > 1 && (
        <div className="approval-filter-bar__field">
          <select
            className="approval-filter-bar__select"
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
          >
            <option value="">Semua Divisi</option>
            {divisiOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span className="approval-filter-bar__field-icon approval-filter-bar__field-icon--right">
            <ChevronDown size={14} />
          </span>
        </div>
      )}
    </div>
  );

  const isApprove = dialog.action === 'approve';

  const selectedCount = selectedEntryIndices.size;
  const totalEntries = detailForm?.entries?.length ?? 0;
  const isAllSelected = selectedCount === totalEntries;
  const approveLabel = isAllSelected
    ? 'Setujui Semua'
    : `Setujui (${selectedCount}/${totalEntries})`;

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <div className="dashboard-content" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
          )}

          <CardBigBox
            eyebrow="Daftar Form"
            title="Antrian Persetujuan"
            headerAction={headerAction}
            className="dashboard-panel--scroll"
            contentClassName="dashboard-panel--scroll-body"
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : forms.length === 0 ? (
              <div className="dashboard-empty-state">
                <CheckCircleIcon sx={{ fontSize: 52, color: 'success.light', mb: 1.5 }} />
                <p className="dashboard-empty-state__title">
                  Tidak ada form yang perlu Anda setujui
                </p>
                <p className="dashboard-empty-state__detail">
                  Semua antrian approval sudah bersih.
                </p>
              </div>
            ) : (
              <div className="dashboard-stack">
                {forms.map((form) => {
                  const kompensasiSummary = getKompensasiSummary(form);
                  const isExpanded = expandedId === form.id;

                  return (
                    <div key={form.id} className="dashboard-stack__item approval-card">
                      <div className="approval-card__header">
                        <div className="approval-card__info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                              {form.nomerForm}
                            </Typography>
                            <StatusChip status={form.status} />
                            <Chip label={form.kodeDivisi} color="primary" size="small" />
                            <Chip
                              label={form.lemburPada}
                              size="small"
                              color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </div>

                          <Typography variant="body2" color="text.secondary">
                            <strong>{form.department}</strong>
                            {' — '}Diperintah oleh: <strong>{form.diperintahOleh}</strong>
                            {' — '}Tgl: {form.tanggalPengajuan}
                          </Typography>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <FactCheckRoundedIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">Kompensasi:</Typography>
                            <Typography variant="body2" fontWeight={800} color="secondary.main">
                              {kompensasiSummary}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {form.entries?.length || 0} karyawan
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
                          <CreateButton
                            variant="accordion"
                            className="approval-card__edit-btn"
                            onClick={() => navigate(`/form/edit/${form.id}`)}
                          >
                            <Edit03 size={15} />
                            Edit
                          </CreateButton>
                        </div>

                        <button
                          type="button"
                          className={`approval-entry-toggle ${isExpanded ? 'approval-entry-toggle--open' : ''}`}
                          onClick={() => toggleExpand(form.id)}
                          aria-label={isExpanded ? 'Sembunyikan entri lembur' : 'Tampilkan entri lembur'}
                          aria-expanded={isExpanded}
                          aria-controls={`approval-entries-${form.id}`}
                        >
                          {isExpanded
                            ? <ExpandLessIcon sx={{ fontSize: 20, display: 'block' }} />
                            : <ExpandMoreIcon sx={{ fontSize: 20, display: 'block' }} />}
                        </button>
                      </div>

                      <Collapse in={isExpanded} id={`approval-entries-${form.id}`}>
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
                              {form.entries?.map((entry, idx) => (
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
                                      {entry.idKaryawan}
                                    </span>
                                  </td>
                                  <td data-label="Tgl Lembur">{entry.tanggalLembur}</td>
                                  <td data-label="Mulai">{entry.jamMulai}</td>
                                  <td data-label="Selesai">{entry.jamSelesai}</td>
                                  <td data-label="Tugas" className="approval-entry-cell--compact">
                                    <span title={entry.tugas} className="approval-entry-text">{entry.tugas}</span>
                                  </td>
                                  <td data-label="Hasil" className="approval-entry-cell--compact">
                                    <span title={entry.hasil} className="approval-entry-text">{entry.hasil}</span>
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
            )}
          </CardBigBox>
        </div>
      </Container>

      {/* Popup detail form */}
      {detailForm && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => setDetailForm(null)}>
          <div
            className="dashboard-popup dashboard-popup--frp-detail"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — frozen */}
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Detail Form Lembur</p>
                <h2 className="dashboard-popup__title">{detailForm.nomerForm}</h2>
              </div>
              <button
                type="button"
                className="dashboard-popup__close"
                aria-label="Tutup"
                onClick={() => setDetailForm(null)}
              >
                <XClose size={18} />
              </button>
            </div>

            {/* Body — info cards pinned, only table rows scroll */}
            <div className="dashboard-popup__body--frp-detail" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Info summary — pinned, never scrolls */}
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
                  { label: 'Department', value: detailForm.department },
                  { label: 'Diperintah Oleh', value: detailForm.diperintahOleh },
                  { label: 'Tanggal Pengajuan', value: detailForm.tanggalPengajuan },
                  { label: 'Lembur Pada', value: detailForm.lemburPada },
                  { label: 'Kode Divisi', value: detailForm.kodeDivisi },
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
                    <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '—'}</strong>
                  </div>
                ))}
              </div>

              {/* Table section — takes remaining height */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Table title row — pinned above the table */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
                  <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                    Entri Lembur — {totalEntries} karyawan
                  </p>
                  {totalEntries > 1 && (
                    <span style={{ fontSize: '0.78rem', color: selectedCount === 0 ? '#ef4444' : '#2a9d8f', fontWeight: 600 }}>
                      {selectedCount === 0 ? 'Tidak ada yang dipilih' : `${selectedCount} dipilih`}
                    </span>
                  )}
                </div>

                {/* Only the table rows scroll — thead stays fixed at top */}
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
                        <th>Tgl Lembur</th>
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
                              <td data-label="Pilih" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleEntry(idx)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                              </td>
                            )}
                            <td data-label="No" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{idx + 1}</td>
                            <td data-label="Nama"><strong className="users-table__name">{entry.nama}</strong></td>
                            <td data-label="ID Karyawan">
                              <span className="users-table__status users-table__status--inline users-table__status--app">
                                {entry.idKaryawan}
                              </span>
                            </td>
                            <td data-label="Tgl Lembur">{entry.tanggalLembur}</td>
                            <td data-label="Mulai">{entry.jamMulai}</td>
                            <td data-label="Selesai">{entry.jamSelesai}</td>
                            <td data-label="Tugas">{entry.tugas}</td>
                            <td data-label="Hasil">{entry.hasil}</td>
                            <td data-label="Kompensasi">
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

            {/* Actions — frozen */}
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

      {/* Dialog konfirmasi approval / reject */}
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
                aria-label="Tutup dialog"
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
                    <p className="dashboard-popup__text"><strong>Department:</strong> {dialog.form.department}</p>
                    <p className="dashboard-popup__text"><strong>Diperintah:</strong> {dialog.form.diperintahOleh}</p>
                    <p className="dashboard-popup__text"><strong>Kompensasi:</strong> {getKompensasiSummary(dialog.form)}</p>
                    {isApprove && dialog.entryIndices ? (
                      <p className="dashboard-popup__text">
                        <strong>Karyawan disetujui:</strong>{' '}
                        <span style={{ color: '#2a9d8f', fontWeight: 700 }}>
                          {dialog.entryIndices.length} dari {dialog.form.entries?.length} orang
                        </span>
                      </p>
                    ) : (
                      <p className="dashboard-popup__text"><strong>Jumlah Karyawan:</strong> {dialog.form.entries?.length} orang</p>
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
                        : 'Contoh: Ditolak - berkas tidak lengkap...'
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
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={closeDialog}
                disabled={submitting}
              >
                Batal
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
