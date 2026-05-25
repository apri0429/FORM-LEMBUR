import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { Check, ChevronLeft, Printer, XClose } from '../components/template/TemplateIcons';
import StatusChip from '../components/StatusChip';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { printLemburForm } from '../utils/printLembur';

const API = '/api/lembur';

const detailPageSx = {
  '& .detail-info-summary': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '8px',
  },
  '& .detail-table': {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },
  '& .detail-form-card .dashboard-panel__header--split': {
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: '16px',
    paddingBottom: '16px',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(26, 42, 87, 0.07)',
  },
  '& .detail-form-card .dashboard-panel__action': {
    justifySelf: 'end',
    minWidth: 0,
  },
  '& .detail-card-actions': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '8px',
  },
  '@media (max-width: 640px)': {
    '& .detail-info-summary': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '& .detail-form-card .dashboard-panel__header--split': {
      gridTemplateColumns: '1fr',
    },
    '& .detail-form-card .dashboard-panel__action': {
      justifySelf: 'stretch',
      width: '100%',
    },
    '& .detail-card-actions': {
      alignItems: 'stretch',
      flexDirection: 'column',
      width: '100%',
    },
  },
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

function ApprovalBadge({ value }) {
  if (value === 2 || value === 1) return <Chip label="Disetujui" color="success" size="small" />;
  return <Chip label="Belum" color="default" size="small" variant="outlined" />;
}

export function DetailLemburContent({ formId, onClose, inPopup = false, onFormLoaded }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialog, setDialog] = useState({ open: false, status: '', level: 2 });
  const [catatan, setCatatan] = useState('');
  const [printPreview, setPrintPreview] = useState(false);

  const fetchForm = () => {
    setLoading(true);
    axios.get(`${API}/${formId}`)
      .then((response) => {
        const data = response.data.data;
        setForm(data);
        onFormLoaded?.(data);
      })
      .catch(() => setError('Gagal memuat data form.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForm(); }, [formId]);

  const handleApproval = async () => {
    try {
      await axios.patch(`${API}/${formId}/status`, {
        status: dialog.status,
        approvalLevel: dialog.level,
        catatanApproval: catatan,
      });
      setSuccess(`Form berhasil ${dialog.status === 'approved' ? 'disetujui' : 'ditolak'}.`);
      setDialog({ open: false, status: '', level: 2 });
      fetchForm();
    } catch {
      setError('Gagal mengubah status.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return <Alert severity="error">Form tidak ditemukan.</Alert>;
  }

  const kompensasiSummary = getKompensasiSummary(form);
  const entries = form.entries ?? [];

  const infoItems = [
    { label: 'Department', value: form.department },
    { label: 'Class', value: form.class },
    { label: 'Diperintah Oleh', value: form.diperintahOleh },
    { label: 'Email', value: form.email },
    { label: 'Tgl Form Dibuat', value: form.tanggalFormDibuat },
    { label: 'Tgl Pengajuan', value: form.tanggalPengajuan },
    { label: 'Lembur Pada', value: form.lemburPada },
    { label: 'Kode Divisi', value: form.kodeDivisi },
    { label: 'Kompensasi', value: kompensasiSummary },
    { label: 'Jumlah Karyawan', value: `${entries.length} orang` },
    { label: 'No. Urut Form', value: String(form.noUrutForm || '-') },
  ];

  const approvalDialog = dialog.open && (
    <div
      className="dashboard-popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setDialog({ ...dialog, open: false }); }}
    >
      <div className="dashboard-popup" style={{ width: 'min(100%, 480px)' }}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Konfirmasi</p>
            <h3 className="dashboard-popup__title">
              {dialog.status === 'approved' ? 'Setujui Form Lembur' : 'Tolak Form Lembur'}
            </h3>
          </div>
          <button
            type="button"
            className="dashboard-popup__close"
            onClick={() => setDialog({ ...dialog, open: false })}
          >
            <XClose size={16} />
          </button>
        </div>

        <div className="dashboard-popup__body">
          <div style={{ background: 'rgba(248,249,250,0.95)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'grid', gap: 4 }}>
            <Typography variant="body2"><strong>Form:</strong> {form.nomerForm}</Typography>
            <Typography variant="body2"><strong>Department:</strong> {form.department}</Typography>
            <Typography variant="body2"><strong>Diperintah Oleh:</strong> {form.diperintahOleh}</Typography>
            <Typography variant="body2"><strong>Kompensasi:</strong> {kompensasiSummary}</Typography>
          </div>

          {dialog.status === 'approved' && (
            <div className="register-user-popup__field" style={{ marginBottom: 14 }}>
              <label className="register-user-popup__label">Level Approval</label>
              <select
                className="register-user-popup__select"
                value={dialog.level}
                onChange={(e) => setDialog((prev) => ({ ...prev, level: Number(e.target.value) }))}
              >
                <option value={1}>Level 1 (Approval Pertama)</option>
                <option value={2}>Level 2 (Approval Final)</option>
              </select>
            </div>
          )}

          <div className="register-user-popup__field">
            <label className="register-user-popup__label">Catatan / Keterangan</label>
            <textarea
              className="register-user-popup__input"
              rows={3}
              placeholder={dialog.status === 'approved'
                ? 'Contoh: Disetujui sesuai kebutuhan operasional...'
                : 'Contoh: Ditolak - tidak memenuhi prosedur...'}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={() => setDialog({ ...dialog, open: false })}
          >
            Batal
          </button>
          <button
            type="button"
            className={`dashboard-popup__button ${dialog.status === 'approved' ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
            onClick={handleApproval}
          >
            {dialog.status === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Popup mode: flat clean layout matching approval popup style ── */
  if (inPopup) {
    return (
      <>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
        {form.catatanApproval && (
          <Alert severity={form.status === 'approved' ? 'success' : 'error'}>
            <strong>Catatan Approval:</strong> {form.catatanApproval}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
        </Box>

        <div
          className="approval-detail-summary"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}
        >
          {infoItems.map(({ label, value }) => (
            <div
              key={label}
              style={{ padding: '10px 14px', border: '1px solid rgba(26,42,87,0.08)', borderRadius: 12, background: 'rgba(248,250,252,0.95)' }}
            >
              <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7f7f7f', marginBottom: 4 }}>
                {label}
              </p>
              <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '—'}</strong>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
              Detail Karyawan — {entries.length} orang
            </p>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FactCheckRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={800} color="secondary.main">{kompensasiSummary}</Typography>
            </Box>
          </div>
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
                  <th>Approval</th>
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
                    <td data-label="Nama"><strong className="users-table__name">{entry.nama}</strong></td>
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
                    <td data-label="Approval"><ApprovalBadge value={entry.approval} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {approvalDialog}
      </>
    );
  }

  /* ── Page mode: full CardBigBox layout ─────────────────────────── */
  return (
    <>
      <Box className="dashboard-content" sx={detailPageSx}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

        {form.catatanApproval && (
          <Alert severity={form.status === 'approved' ? 'success' : 'error'}>
            <strong>Catatan Approval:</strong> {form.catatanApproval}
          </Alert>
        )}

        <CardBigBox
          eyebrow="Detail Form"
          title={form.nomerForm}
          className="detail-form-card"
          description={`${form.department || '-'} — ${form.tanggalPengajuan || '-'}`}
          headerAction={(
            <div className="detail-card-actions">
              {onClose && (
                <CreateButton
                  variant="accordion"
                  className="users-table__accordion-button--neutral"
                  onClick={onClose}
                >
                  <ChevronLeft size={15} />
                  Kembali
                </CreateButton>
              )}
              <CreateButton variant="detail" onClick={() => setPrintPreview(true)}>
                <Printer size={15} />
                Cetak
              </CreateButton>
              {form.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--primary"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', minWidth: 0 }}
                    onClick={() => { setDialog({ open: true, status: 'approved', level: 2 }); setCatatan(''); }}
                  >
                    <Check size={15} />
                    Setujui
                  </button>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--danger"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', minWidth: 0 }}
                    onClick={() => { setDialog({ open: true, status: 'rejected', level: 0 }); setCatatan(''); }}
                  >
                    <XClose size={15} />
                    Tolak
                  </button>
                </>
              )}
            </div>
          )}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
          </Box>

          <div className="detail-info-summary">
            {infoItems.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '10px 14px',
                  border: '1px solid rgba(26,42,87,0.08)',
                  borderRadius: 12,
                  background: 'rgba(248,250,252,0.95)',
                }}
              >
                <p style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  fontFamily: 'IBM Plex Mono, monospace',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#7f7f7f',
                  marginBottom: 4,
                }}>
                  {label}
                </p>
                <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '—'}</strong>
              </div>
            ))}
          </div>
        </CardBigBox>

        <CardBigBox
          eyebrow="Detail Lembur"
          title={`Karyawan (${entries.length} entri)`}
          headerAction={(
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FactCheckRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={800} color="secondary.main">
                {kompensasiSummary}
              </Typography>
            </Box>
          )}
        >
          <TableContainer
            component={Paper}
            elevation={0}
            className="detail-table"
            sx={{ '@media (max-width: 768px)': { display: 'none' } }}
          >
            <Table
              size="small"
              sx={{
                width: '100%',
                tableLayout: 'fixed',
                '& .MuiTableCell-root': { px: 1, whiteSpace: 'normal', wordBreak: 'break-word' },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Internal Id</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>ID Karyawan</TableCell>
                  <TableCell>Tanggal Lembur</TableCell>
                  <TableCell>Jam Mulai</TableCell>
                  <TableCell>Jam Selesai</TableCell>
                  <TableCell>Tugas</TableCell>
                  <TableCell>Hasil</TableCell>
                  <TableCell>Kompensasi</TableCell>
                  <TableCell>Approval</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index} hover sx={{ bgcolor: index % 2 === 0 ? 'grey.50' : 'white' }}>
                    <TableCell>
                      <Chip label={entry.internalId || '-'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{entry.nama}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={entry.idKaryawan || '-'} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell>{entry.tanggalLembur}</TableCell>
                    <TableCell>{entry.jamMulai}</TableCell>
                    <TableCell>{entry.jamSelesai}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.tugas || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.hasil || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="secondary.main">
                        {formatKompensasi(entry.kompensasi)}
                      </Typography>
                    </TableCell>
                    <TableCell><ApprovalBadge value={entry.approval} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'none', '@media (max-width: 768px)': { display: 'block' } }}>
            <div className="users-table-wrapper approval-entry-table-wrapper">
              <table className="users-table approval-mobile-table">
                <thead>
                  <tr>
                    <th>Internal ID</th><th>Nama</th><th>ID Karyawan</th>
                    <th>Tgl Lembur</th><th>Mulai</th><th>Selesai</th>
                    <th>Tugas</th><th>Hasil</th><th>Kompensasi</th><th>Approval</th>
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
                      <td data-label="Approval"><ApprovalBadge value={entry.approval} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Box>
        </CardBigBox>
      </Box>

      {dialog.open && (
        <div
          className="dashboard-popup-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDialog({ ...dialog, open: false }); }}
        >
          <div className="dashboard-popup" style={{ width: 'min(100%, 480px)' }}>
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Konfirmasi</p>
                <h3 className="dashboard-popup__title">
                  {dialog.status === 'approved' ? 'Setujui Form Lembur' : 'Tolak Form Lembur'}
                </h3>
              </div>
              <button
                type="button"
                className="dashboard-popup__close"
                onClick={() => setDialog({ ...dialog, open: false })}
              >
                <XClose size={16} />
              </button>
            </div>

            <div className="dashboard-popup__body">
              <div style={{ background: 'rgba(248,249,250,0.95)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'grid', gap: 4 }}>
                <Typography variant="body2"><strong>Form:</strong> {form.nomerForm}</Typography>
                <Typography variant="body2"><strong>Department:</strong> {form.department}</Typography>
                <Typography variant="body2"><strong>Diperintah Oleh:</strong> {form.diperintahOleh}</Typography>
                <Typography variant="body2"><strong>Kompensasi:</strong> {kompensasiSummary}</Typography>
              </div>

              {dialog.status === 'approved' && (
                <div className="register-user-popup__field" style={{ marginBottom: 14 }}>
                  <label className="register-user-popup__label">Level Approval</label>
                  <select
                    className="register-user-popup__select"
                    value={dialog.level}
                    onChange={(e) => setDialog((prev) => ({ ...prev, level: Number(e.target.value) }))}
                  >
                    <option value={1}>Level 1 (Approval Pertama)</option>
                    <option value={2}>Level 2 (Approval Final)</option>
                  </select>
                </div>
              )}

              <div className="register-user-popup__field">
                <label className="register-user-popup__label">Catatan / Keterangan</label>
                <textarea
                  className="register-user-popup__input"
                  rows={3}
                  placeholder={dialog.status === 'approved'
                    ? 'Contoh: Disetujui sesuai kebutuhan operasional...'
                    : 'Contoh: Ditolak - tidak memenuhi prosedur...'}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>

            <div className="dashboard-popup__actions">
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={() => setDialog({ ...dialog, open: false })}
              >
                Batal
              </button>
              <button
                type="button"
                className={`dashboard-popup__button ${dialog.status === 'approved' ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
                onClick={handleApproval}
              >
                {dialog.status === 'approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {printPreview && <PrintPreviewModal form={form} onClose={() => setPrintPreview(false)} />}
    </>
  );
}

export default function DetailLembur() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100%' }}>
      <DetailLemburContent formId={id} onClose={() => navigate(-1)} />
    </Box>
  );
}
