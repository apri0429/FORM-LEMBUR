import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
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
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import {
  Check, Edit03, FileText01, RefreshCw05, XClose,
} from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';
import StatusChip from '../components/StatusChip';
import { DetailLemburContent } from './DetailLembur';

const API = '/api/lembur';
const BOD_KEYWORDS = ['director', 'commissioner', 'president director'];
const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

function isAdminUser(user) {
  if (!user) return false;
  const isBOD = BOD_KEYWORDS.some((k) => String(user.jobLevel || '').toLowerCase().includes(k))
    || user.department === 'Board Of Director';
  return user.role === 'admin' || user.department === 'IT' || isBOD;
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
  if (!isManager) return false;
  return form.department === user.department;
}

const cellSx = { px: 1.25, py: 0.75, whiteSpace: 'normal', wordBreak: 'break-word' };

const pageSx = {
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  paddingBottom: '28px',
  '@media (max-width: 768px)': {
    gap: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
    paddingBottom: '24px',
  },
};

function getRejectedCount(stats) {
  if (!stats) return null;
  if (stats.rejected != null) return stats.rejected;
  return (stats.total ?? 0) - (stats.approved ?? 0) - (stats.pending ?? 0) - (stats.partially_approved ?? 0);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle, gap) {
  const sa = startAngle + gap;
  const ea = endAngle - gap;
  if (ea - sa < 0.1) return null;
  const oS = polarToCartesian(cx, cy, outerR, sa);
  const oE = polarToCartesian(cx, cy, outerR, ea);
  const iE = polarToCartesian(cx, cy, innerR, ea);
  const iS = polarToCartesian(cx, cy, innerR, sa);
  const lg = ea - sa > 180 ? 1 : 0;
  return [
    `M ${oS.x},${oS.y}`,
    `A ${outerR},${outerR} 0 ${lg},1 ${oE.x},${oE.y}`,
    `L ${iE.x},${iE.y}`,
    `A ${innerR},${innerR} 0 ${lg},0 ${iS.x},${iS.y}`,
    'Z',
  ].join(' ');
}

function DonutChart({ segments, total, size = 180, outerR = 76, innerR = 50, gap = 1.8 }) {
  const cx = size / 2;
  const cy = size / 2;
  let currentAngle = 0;
  const paths = segments.map((seg) => {
    const startAngle = currentAngle;
    const sweep = total > 0 ? (seg.value / total) * 360 : 0;
    currentAngle += sweep;
    return { ...seg, d: donutSegmentPath(cx, cy, outerR, innerR, startAngle, currentAngle, gap) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      <circle
        cx={cx} cy={cy} r={(outerR + innerR) / 2}
        fill="none" stroke="rgba(26,42,87,0.07)"
        strokeWidth={outerR - innerR}
      />
      {paths.map((p, i) => p.d && <path key={i} d={p.d} fill={p.color} />)}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="26" fontWeight="800" fill="#1a2a57" fontFamily="Manrope, sans-serif">
        {total > 0 ? total : '—'}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11" fill="rgba(26,42,87,0.5)" fontFamily="Manrope, sans-serif">
        Total
      </text>
    </svg>
  );
}

const RANK_COLORS = ['#e9c46a', '#2a9d8f', '#4a7fc1', '#e76f51', '#9b59b6'];

function DivisionRanking({ forms }) {
  const counts = {};
  forms.forEach((f) => {
    if (f.department) counts[f.department] = (counts[f.department] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;
  return (
    <div className="dashboard-card" style={{ flex: 1, minWidth: 0 }}>
      <p className="dashboard-card__label" style={{ marginBottom: 14 }}>Top Divisi Pengaju Lembur</p>
      {sorted.length === 0 ? (
        <p style={{ color: 'rgba(26,42,87,0.35)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0', margin: 0 }}>
          Belum ada data
        </p>
      ) : (
        <div className="dash-ranking-list">
          {sorted.map(([dept, count], i) => (
            <div key={dept} className="dash-ranking-item">
              <div className="dash-ranking-item__header">
                <span className="dash-ranking-rank">{i + 1}</span>
                <span className="dash-ranking-name">{dept}</span>
                <span className="dash-ranking-count">{count} form</span>
              </div>
              <div className="dash-ranking-track">
                <div
                  className="dash-ranking-fill"
                  style={{ width: `${(count / max) * 100}%`, background: RANK_COLORS[i] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, detail, iconColor, icon, accentColor }) {
  return (
    <div className="dashboard-card" style={{ gap: 0 }}>
      <div className="dashboard-card__meta">
        <p className="dashboard-card__label">{label}</p>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          {icon}
        </div>
      </div>
      <strong className="dashboard-card__value" style={{ fontSize: '2.1rem', marginTop: 10 }}>
        {value ?? <span style={{ opacity: 0.3 }}>—</span>}
      </strong>
      <p className="dashboard-card__detail" style={{ marginTop: 4, fontSize: '0.82rem' }}>{detail}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);

  const [allForms, setAllForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revertId, setRevertId] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [detailForm, setDetailForm] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get(API),
      axios.get(`${API}/stats`),
    ])
      .then(([formsRes, statsRes]) => {
        setAllForms(formsRes.data.data || []);
        setStats(statsRes.data.data || null);
      })
      .catch(() => setError('Gagal memuat data. Pastikan server backend berjalan.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRevert = () => {
    if (!revertId) return;
    setReverting(true);
    axios.patch(`${API}/${revertId}/status`, { status: 'pending' })
      .then(() => fetchData())
      .then(() => setRevertId(null))
      .catch(() => setError('Gagal mengembalikan form. Coba lagi.'))
      .finally(() => setReverting(false));
  };

  const recentForms = [...allForms]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10);

  const headerAction = (
    <button
      type="button"
      className="add-board-button"
      onClick={() => navigate('/form/baru')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Buat Form Baru
    </button>
  );

  return (
    <Box sx={{ height: '100%', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ width: '100%' }}>
        <Box sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ flexShrink: 0 }}>{error}</Alert>}

          {/* Stat Cards — top row */}
          <div
            className="dash-stat-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14, flexShrink: 0 }}
          >
            <StatCard
              label="Total Form"
              value={stats?.total}
              detail="Semua pengajuan"
              iconColor="var(--primary-blue)"
              accentColor="#1a2a57"
              icon={<FileText01 size={18} />}
            />
            <StatCard
              label="Disetujui"
              value={stats?.approved}
              detail="Form selesai diproses"
              iconColor="#2a9d8f"
              accentColor="#2a9d8f"
              icon={<Check size={18} />}
            />
            <StatCard
              label="Menunggu Approval"
              value={stats?.pending}
              detail="Perlu ditindaklanjuti"
              iconColor="#c08b00"
              accentColor="#e9c46a"
              icon={<RefreshCw05 size={18} />}
            />
            <StatCard
              label="Ditolak"
              value={getRejectedCount(stats)}
              detail="Tidak disetujui"
              iconColor="#c0392b"
              accentColor="#e76f51"
              icon={<XClose size={18} />}
            />
          </div>

          {/* Analytics Row: Donut + Division Ranking */}
          <div className="dash-analytics-row">
            {/* Donut Chart */}
            <div className="dashboard-card dash-chart-card">
              <p className="dashboard-card__label" style={{ marginBottom: 14 }}>Distribusi Status Form</p>
              <div className="dash-chart-card__inner">
                <DonutChart
                  segments={[
                    { label: 'Disetujui', value: stats?.approved ?? 0, color: '#2a9d8f' },
                    { label: 'Menunggu', value: stats?.pending ?? 0, color: '#e9c46a' },
                    { label: 'Ditolak', value: getRejectedCount(stats) ?? 0, color: '#e76f51' },
                  ]}
                  total={stats?.total ?? 0}
                  size={170}
                  outerR={72}
                  innerR={47}
                />
                <div className="dash-chart-legend">
                  {[
                    { label: 'Disetujui', value: stats?.approved, color: '#2a9d8f' },
                    { label: 'Menunggu', value: stats?.pending, color: '#e9c46a' },
                    { label: 'Ditolak', value: getRejectedCount(stats), color: '#e76f51' },
                  ].map((item) => (
                    <div key={item.label} className="dash-legend-item">
                      <span className="dash-legend-dot" style={{ background: item.color }} />
                      <span className="dash-legend-label">{item.label}</span>
                      <span className="dash-legend-value">
                        {item.value != null ? item.value : <span style={{ opacity: 0.3 }}>—</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Division Ranking */}
            <DivisionRanking forms={allForms} />
          </div>

          {/* 10 Data Terbaru */}
          <CardBigBox
            eyebrow="10 Form Terakhir"
            title="Data Terbaru"
            headerAction={headerAction}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : recentForms.length === 0 ? (
              <Box className="dashboard-empty-state">
                <FileText01 size={48} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <p className="dashboard-empty-state__title">Belum ada form</p>
                <p className="dashboard-empty-state__detail">Buat form baru untuk memulai.</p>
              </Box>
            ) : (
              <>
                {/* Desktop table */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: 295,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '@media (max-width: 768px)': { display: 'none' },
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 680, '& .MuiTableCell-root': cellSx }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>No. Form</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Tgl Pengajuan</TableCell>
                        <TableCell>Lembur Pada</TableCell>
                        <TableCell align="center">Entri</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentForms.map((form) => (
                        <TableRow key={form.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="primary.main">{form.nomerForm}</Typography>
                            {form.kodeDivisi && <Chip label={form.kodeDivisi} color="primary" size="small" sx={{ mt: 0.25 }} />}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{form.department}</Typography>
                            <Typography variant="caption" color="text.secondary">{form.diperintahOleh}</Typography>
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
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700}>{form.entries?.length ?? 0}</Typography>
                          </TableCell>
                          <TableCell><StatusChip status={form.status} /></TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <CreateButton variant="accordion" onClick={() => setDetailForm(form)}>
                                <FactCheckRoundedIcon sx={{ fontSize: 14 }} />
                                Detail
                              </CreateButton>
                              {canRevertForm(user, form) && form.status !== 'pending' && (
                                <CreateButton variant="accordion" onClick={() => setRevertId(form.id)}>
                                  <RestoreRoundedIcon sx={{ fontSize: 14 }} />
                                  Kembalikan
                                </CreateButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile cards */}
                <Box sx={{
                  display: 'none',
                  '@media (max-width: 768px)': { display: 'flex', flexDirection: 'column', gap: '10px' },
                }}>
                  {recentForms.map((form) => (
                    <div key={form.id} className="approval-card approval-card--dashboard">
                      <div className="approval-card__header">
                        <div className="approval-card__info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                            <Typography variant="body2" fontWeight={800} color="primary.main">{form.nomerForm}</Typography>
                            <StatusChip status={form.status} />
                            {form.kodeDivisi && <Chip label={form.kodeDivisi} color="primary" size="small" />}
                          </div>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', mb: 0.5 }}>
                            <strong>{form.department}</strong>
                            {form.diperintahOleh && <> · {form.diperintahOleh}</>}
                          </Typography>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary">{form.tanggalPengajuan}</Typography>
                            {form.lemburPada && (
                              <Chip
                                label={form.lemburPada}
                                size="small"
                                color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                                variant="outlined"
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {form.entries?.length ?? 0} karyawan
                            </Typography>
                          </div>
                        </div>
                        <div className="approval-card__actions">
                          <CreateButton variant="accordion" onClick={() => setDetailForm(form)}>
                            <FactCheckRoundedIcon sx={{ fontSize: 14 }} />
                            Detail
                          </CreateButton>
                          {canRevertForm(user, form) && form.status !== 'pending' && (
                            <CreateButton variant="accordion" onClick={() => setRevertId(form.id)}>
                              <RestoreRoundedIcon sx={{ fontSize: 14 }} />
                              Kembalikan
                            </CreateButton>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </Box>
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
            role="dialog" aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Detail Form Lembur</p>
                <h2 className="dashboard-popup__title">{detailForm.nomerForm}</h2>
              </div>
              <button type="button" className="dashboard-popup__close" aria-label="Tutup" onClick={() => setDetailForm(null)}>
                <XClose size={18} />
              </button>
            </div>
            <div className="dashboard-popup__body--frp-detail">
              <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DetailLemburContent formId={detailForm.id} onClose={null} inPopup={true} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Revert confirmation popup */}
      {!!revertId && typeof document !== 'undefined' && createPortal(
        <div className="dashboard-popup-overlay" role="presentation" onClick={() => !reverting && setRevertId(null)}>
          <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-popup__header">
              <div>
                <p className="dashboard-popup__eyebrow">Konfirmasi Kembalikan</p>
                <h2 className="dashboard-popup__title">Kembalikan Form Ini?</h2>
              </div>
              <button type="button" className="dashboard-popup__close" aria-label="Tutup" onClick={() => !reverting && setRevertId(null)}>
                <XClose size={18} />
              </button>
            </div>
            <div className="dashboard-popup__body">
              <p className="dashboard-popup__text">
                Form ini akan dikembalikan ke status <strong>Menunggu Approval</strong> dan perlu diproses ulang.
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
    </Box>
  );
}
