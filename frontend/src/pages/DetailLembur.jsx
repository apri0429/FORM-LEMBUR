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
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { Check, ChevronLeft, Printer, XClose } from '../components/template/TemplateIcons';
import PrintPreviewModal from '../components/PrintPreviewModal';

const API = '/api/lembur';
const STATUS_CHIP_MAP = {
  approved: { label: 'Disetujui', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Disetujui L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending: { label: 'Menunggu', color: 'default', icon: <HourglassEmptyIcon fontSize="small" /> },
  rejected: { label: 'Ditolak', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

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

function formatLemburPada(value) {
  const text = String(value ?? '').trim();
  if (text === 'Hari Libur') return 'Holiday';
  if (text === 'Hari Kerja') return 'Workday';
  return text || '-';
}

function getKompensasiSummary(form) {
  const values = form.entries
    ?.map((entry) => formatKompensasi(entry.kompensasi))
    .filter((value) => value !== '-') || [];

  if (!values.length) return '-';

  const uniqueValues = [...new Set(values)];
  if (uniqueValues.length <= 2) return uniqueValues.join(', ');
  return `${uniqueValues.slice(0, 2).join(', ')} +${uniqueValues.length - 2} others`;
}

function DetailStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}

function ApprovalBadge({ value }) {
  if (value === 2 || value === 1) return <Chip label="Disetujui" color="success" size="small" icon={<CheckCircleIcon fontSize="small" />} />;
  return <Chip label="Menunggu" color="default" size="small" variant="outlined" icon={<HourglassEmptyIcon fontSize="small" />} />;
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
      .catch(() => setError('Failed to load form data.'))
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
      setSuccess(`Form successfully ${dialog.status === 'approved' ? 'approved' : 'rejected'}.`);
      setDialog({ open: false, status: '', level: 2 });
      fetchForm();
    } catch {
      setError('Failed to update status.');
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
    return <Alert severity="error">Form not found.</Alert>;
  }

  const kompensasiSummary = getKompensasiSummary(form);
  const entries = form.entries ?? [];

  const processedBy = form.status === 'rejected'
    ? (form.rejectedBy || '-')
    : (form.approvedBy || '-');

  const infoItems = [
    { label: 'Departemen', value: form.department },
    { label: 'Kelas', value: form.class },
    { label: 'Diminta Oleh', value: form.diperintahOleh },
    { label: 'Email', value: form.email },
    { label: 'Tgl. Form Dibuat', value: form.tanggalFormDibuat },
    { label: 'Tgl. Pengajuan', value: form.tanggalPengajuan },
    { label: 'Hari Lembur', value: form.lemburPada || '-' },
    { label: 'Kode Divisi', value: form.kodeDivisi },
    { label: 'Kompensasi', value: kompensasiSummary },
    { label: 'Jumlah Karyawan', value: `${entries.length} karyawan` },
    { label: 'No. Urut Form', value: String(form.noUrutForm || '-') },
    { label: 'Diproses Oleh', value: processedBy },
  ];

  const approvalDialog = dialog.open && (
    <div
      className="dashboard-popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setDialog({ ...dialog, open: false }); }}
    >
      <div className="dashboard-popup" style={{ width: 'min(100%, 480px)' }}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Confirmation</p>
            <h3 className="dashboard-popup__title">
              {dialog.status === 'approved' ? 'Approve Overtime Form' : 'Reject Overtime Form'}
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
            <Typography variant="body2"><strong>Requested By:</strong> {form.diperintahOleh}</Typography>
            <Typography variant="body2"><strong>Compensation:</strong> {kompensasiSummary}</Typography>
          </div>

          {dialog.status === 'approved' && (
            <div className="register-user-popup__field" style={{ marginBottom: 14 }}>
              <label className="register-user-popup__label">Approval Level</label>
              <select
                className="register-user-popup__select"
                value={dialog.level}
                onChange={(e) => setDialog((prev) => ({ ...prev, level: Number(e.target.value) }))}
              >
                <option value={1}>Level 1 (First Approval)</option>
                <option value={2}>Level 2 (Final Approval)</option>
              </select>
            </div>
          )}

          <div className="register-user-popup__field">
            <label className="register-user-popup__label">Notes / Remarks</label>
            <textarea
              className="register-user-popup__input"
              rows={3}
              placeholder={dialog.status === 'approved'
                ? 'Example: Approved according to operational needs...'
                : 'Example: Rejected - does not meet the procedure...'}
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
            Cancel
          </button>
          <button
            type="button"
            className={`dashboard-popup__button ${dialog.status === 'approved' ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
            onClick={handleApproval}
          >
            {dialog.status === 'approved' ? 'Yes, Approve' : 'Yes, Reject'}
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
            <strong>Approval Notes:</strong> {form.catatanApproval}
          </Alert>
        )}

        <div className="approval-detail-summary">
          {infoItems.map(({ label, value }) => (
            <div
              key={label}
              style={{ padding: '10px 14px', border: '1px solid rgba(26,42,87,0.08)', borderRadius: 12, background: 'rgba(248,250,252,0.95)' }}
            >
              <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7f7f7f', marginBottom: 4 }}>
                {label}
              </p>
              <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '-'}</strong>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
              Employee Details - {entries.length} employees
            </p>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FactCheckRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={800} color="secondary.main">{kompensasiSummary}</Typography>
            </Box>
          </div>
          <div className="users-table-wrapper approval-entry-table-wrapper" style={{ maxHeight: 280, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="users-table approval-mobile-table">
              <thead>
                <tr>
                  <th>Internal ID</th>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Overtime Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Task</th>
                  <th>Result</th>
                  <th>Compensation</th>
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
                    <td data-label="Name"><strong className="users-table__name">{entry.nama}</strong></td>
                    <td data-label="Employee ID">
                      <span className="users-table__status users-table__status--inline users-table__status--app">
                        {entry.idKaryawan || '-'}
                      </span>
                    </td>
                    <td data-label="Overtime Date">{entry.tanggalLembur}</td>
                    <td data-label="Start">{entry.jamMulai}</td>
                    <td data-label="End">{entry.jamSelesai}</td>
                    <td data-label="Task" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {entry.tugas || '-'}
                    </td>
                    <td data-label="Result" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {entry.hasil || '-'}
                    </td>
                    <td data-label="Compensation">
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
            <strong>Approval Notes:</strong> {form.catatanApproval}
          </Alert>
        )}

        <CardBigBox
          eyebrow="Form Details"
          title={form.nomerForm}
          className="detail-form-card"
          description={`${form.department || '-'} - ${form.tanggalPengajuan || '-'}`}
          headerAction={(
            <div className="detail-card-actions">
              {onClose && (
                <CreateButton
                  variant="accordion"
                  className="users-table__accordion-button--neutral"
                  onClick={onClose}
                >
                  <ChevronLeft size={15} />
                  Back
                </CreateButton>
              )}
              <CreateButton variant="detail" onClick={() => setPrintPreview(true)}>
                <Printer size={15} />
                Print
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
                    Approve
                  </button>
                  <button
                    type="button"
                    className="dashboard-popup__button dashboard-popup__button--danger"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.875rem', minWidth: 0 }}
                    onClick={() => { setDialog({ open: true, status: 'rejected', level: 0 }); setCatatan(''); }}
                  >
                    <XClose size={15} />
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginBottom: 16,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(26,42,87,0.10)',
            background: '#fff',
            boxShadow: '0 1px 6px rgba(26,42,87,0.07)',
            flexWrap: 'wrap',
            maxWidth: '100%',
          }}>
            <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center' }}>
              <DetailStatusChip status={form.status} />
            </Box>
            {form.kodeDivisi && (
              <>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(26,42,87,0.09)', flexShrink: 0 }} />
                <span style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1a2a57',
                  background: 'rgba(26,42,87,0.04)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}>
                  {form.kodeDivisi}
                </span>
              </>
            )}
            {form.lemburPada && (
              <>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(26,42,87,0.09)', flexShrink: 0 }} />
                <span style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  color: form.lemburPada === 'Hari Libur' ? '#dc2626' : '#475569',
                  background: form.lemburPada === 'Hari Libur' ? 'rgba(220,38,38,0.05)' : 'transparent',
                }}>
                  {form.lemburPada}
                </span>
              </>
            )}
          </div>

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
                <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem' }}>{value || '-'}</strong>
              </div>
            ))}
          </div>
        </CardBigBox>

        <CardBigBox
          eyebrow="Overtime Details"
          title={`Employees (${entries.length} entries)`}
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
            sx={{
              overflowX: 'auto',
              '@media (max-width: 768px)': { display: 'none' },
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 900,
                '& .MuiTableCell-root': { px: 1.25, py: 0.85, fontSize: '0.82rem' },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  fontWeight: 800, fontSize: '0.74rem', color: '#607089',
                  background: 'rgba(241,245,249,0.98)',
                  borderBottom: '1px solid rgba(26,42,87,0.10)',
                  whiteSpace: 'nowrap',
                },
                '& .MuiTableBody-root .MuiTableRow-root:hover td': {
                  background: 'rgba(237,242,250,0.7)',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 110 }}>Internal ID</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Name</TableCell>
                  <TableCell sx={{ width: 110 }}>Employee ID</TableCell>
                  <TableCell sx={{ width: 115, whiteSpace: 'nowrap' }}>Overtime Date</TableCell>
                  <TableCell sx={{ width: 70 }}>Start</TableCell>
                  <TableCell sx={{ width: 70 }}>End</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell sx={{ width: 110 }}>Compensation</TableCell>
                  <TableCell sx={{ width: 95 }}>Approval</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index} hover sx={{ bgcolor: index % 2 === 0 ? 'rgba(248,250,252,0.7)' : 'white', transition: 'background .15s' }}>
                    <TableCell>
                      <span className="users-table__status users-table__status--inline users-table__status--pending" style={{ fontSize: '0.75rem' }}>
                        {entry.internalId || '-'}
                      </span>
                    </TableCell>
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
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{entry.tugas || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{entry.hasil || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="secondary.main" noWrap>
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
                    <th>Internal ID</th><th>Name</th><th>Employee ID</th>
                    <th>Overtime Date</th><th>Start</th><th>End</th>
                    <th>Task</th><th>Result</th><th>Compensation</th><th>Approval</th>
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
                      <td data-label="Name">
                        <strong className="users-table__name">{entry.nama}</strong>
                      </td>
                      <td data-label="Employee ID">
                        <span className="users-table__status users-table__status--inline users-table__status--app">
                          {entry.idKaryawan || '-'}
                        </span>
                      </td>
                      <td data-label="Overtime Date">{entry.tanggalLembur}</td>
                      <td data-label="Start">{entry.jamMulai}</td>
                      <td data-label="End">{entry.jamSelesai}</td>
                      <td data-label="Task" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {entry.tugas || '-'}
                      </td>
                      <td data-label="Result" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {entry.hasil || '-'}
                      </td>
                      <td data-label="Compensation">
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
                <p className="dashboard-popup__eyebrow">Confirmation</p>
                <h3 className="dashboard-popup__title">
                  {dialog.status === 'approved' ? 'Approve Overtime Form' : 'Reject Overtime Form'}
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
                <Typography variant="body2"><strong>Requested By:</strong> {form.diperintahOleh}</Typography>
                <Typography variant="body2"><strong>Compensation:</strong> {kompensasiSummary}</Typography>
              </div>

              {dialog.status === 'approved' && (
                <div className="register-user-popup__field" style={{ marginBottom: 14 }}>
                  <label className="register-user-popup__label">Approval Level</label>
                  <select
                    className="register-user-popup__select"
                    value={dialog.level}
                    onChange={(e) => setDialog((prev) => ({ ...prev, level: Number(e.target.value) }))}
                  >
                    <option value={1}>Level 1 (First Approval)</option>
                    <option value={2}>Level 2 (Final Approval)</option>
                  </select>
                </div>
              )}

              <div className="register-user-popup__field">
                <label className="register-user-popup__label">Notes / Remarks</label>
                <textarea
                  className="register-user-popup__input"
                  rows={3}
                  placeholder={dialog.status === 'approved'
                    ? 'Example: Approved according to operational needs...'
                    : 'Example: Rejected - does not meet the procedure...'}
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
                Cancel
              </button>
              <button
                type="button"
                className={`dashboard-popup__button ${dialog.status === 'approved' ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
                onClick={handleApproval}
              >
                {dialog.status === 'approved' ? 'Yes, Approve' : 'Yes, Reject'}
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
