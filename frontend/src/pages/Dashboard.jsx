import React, { useEffect, useState } from 'react';
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
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CardBigBox from '../components/cardbox/CardBigBox';
import {
  Check, FileText01, RefreshCw05, XClose,
} from '../components/template/TemplateIcons.jsx';
import { useAuth } from '../context/AuthContext';
import StatusChip from '../components/StatusChip';

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

const cellSx = { px: 1.25, py: 0.75, fontSize: '0.82rem' };

const stickyLeftSx = { ...cellSx };

const pageSx = {
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  '& > *': { minWidth: 0 },
  '@media (max-width: 768px)': {
    gap: '12px',
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
      <p className="dashboard-card__label" style={{ marginBottom: 14 }}>Departemen Lembur Tertinggi</p>
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
    <div className="dashboard-card" style={{ gap: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Garis warna di atas label */}
      <div style={{
        height: 3, borderRadius: 2,
        background: accentColor,
        marginBottom: 14,
        flexShrink: 0,
      }} />

      {/* Label */}
      <p className="dashboard-card__label" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
        {label}
      </p>

      {/* Angka besar */}
      <strong style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: 6, display: 'block', color: iconColor, lineHeight: 1.1 }}>
        {value ?? <span style={{ opacity: 0.25, color: '#1a2a57' }}>—</span>}
      </strong>

      {/* Detail + Icon di bawah */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        <p className="dashboard-card__detail" style={{ margin: 0, fontSize: '0.79rem', color: 'rgba(26,42,87,0.45)' }}>{detail}</p>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `${accentColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          {icon}
        </div>
      </div>
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
      .catch(() => setError('Failed to load data. Make sure the backend server is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const recentForms = [...allForms].sort((a, b) => b.id - a.id).slice(0, 10);

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
    <Box sx={{ width: '100%' }}>
      <Container disableGutters maxWidth={false} sx={{ width: '100%' }}>
        <Box sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ flexShrink: 0 }}>{error}</Alert>}

          {/* Stat Cards — top row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(4, minmax(0,1fr))' },
            gap: { xs: '10px', sm: '14px' },
            '@keyframes fadeSlideUp': {
              from: { opacity: 0, transform: 'translateY(16px)' },
              to:   { opacity: 1, transform: 'translateY(0)' },
            },
            '& > *': {
              animation: 'fadeSlideUp 0.42s cubic-bezier(0.22,1,0.36,1) both',
            },
            '& > *:nth-of-type(1)': { animationDelay: '0.04s' },
            '& > *:nth-of-type(2)': { animationDelay: '0.09s' },
            '& > *:nth-of-type(3)': { animationDelay: '0.14s' },
            '& > *:nth-of-type(4)': { animationDelay: '0.19s' },
          }}>
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
              label="Menunggu"
              value={stats?.pending}
              detail="Perlu tindakan"
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
          </Box>

          {/* Analytics Row: Donut + Division Ranking */}
          <div className="dash-analytics-row" style={{
            animation: 'fadeSlideUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.22s both',
          }}>
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

          {/* Semua Data */}
          <CardBigBox
            eyebrow={`${recentForms.length} form tersimpan`}
            title="Data Terkini"
            headerAction={headerAction}
            style={{ animation: 'fadeSlideUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.30s both' }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : recentForms.length === 0 ? (
              <Box className="dashboard-empty-state">
                <FileText01 size={48} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <p className="dashboard-empty-state__title">Belum ada form</p>
                <p className="dashboard-empty-state__detail">Buat form baru untuk memulai pengajuan lembur.</p>
              </Box>
            ) : (
              <>
                {/* Desktop table */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    maxHeight: 228,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '@media (max-width: 768px)': { display: 'none' },
                  }}
                >
                  <Table size="small" stickyHeader sx={{
                    minWidth: 820,
                    '& .MuiTableCell-root': cellSx,
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontSize: '0.74rem', fontWeight: 800, color: '#607089',
                      backgroundColor: '#f3f6fa',
                      borderBottom: '1px solid rgba(26,42,87,0.1)',
                      position: 'sticky', top: 0, zIndex: 2,
                    },
                    '& .MuiTableBody-root .MuiTableRow-root:hover td': { background: 'rgba(237,242,250,0.9)' },
                    '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even) td': { background: 'rgba(248,250,252,0.6)' },
                    '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even):hover td': { background: 'rgba(237,242,250,0.9)' },
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 170 }}>No. Form</TableCell>
                        <TableCell sx={{ width: 100 }}>Jenis</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Departemen</TableCell>
                        <TableCell sx={{ minWidth: 130 }}>Diperintah</TableCell>
                        <TableCell sx={{ width: 115, whiteSpace: 'nowrap' }}>Tgl. Pengajuan</TableCell>
                        <TableCell sx={{ width: 105 }}>Hari Lembur</TableCell>
                        <TableCell sx={{ width: 70, whiteSpace: 'nowrap' }} align="center">Jml.</TableCell>
                        <TableCell sx={{ width: 115 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentForms.map((form) => (
                        <TableRow key={form.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="primary.main" noWrap>
                              {form.nomerForm}
                            </Typography>
                          </TableCell>
                          <TableCell><FormTypeBadge jenisForm={form.jenisForm} /></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} noWrap>{form.department}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap>{form.diperintahOleh || '-'}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2">{form.tanggalPengajuan}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={form.lemburPada || '-'}
                              size="small"
                              color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.72rem', height: 22 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700} color="text.secondary" fontSize="0.78rem">
                              {form.entries?.length ?? 0}
                            </Typography>
                          </TableCell>
                          <TableCell><StatusChip status={form.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile cards */}
                <Box sx={{
                  display: 'none',
                  '@media (max-width: 768px)': {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    pr: 0.5,
                  },
                }}>
                  {recentForms.map((form) => (
                    <div key={form.id} className="dashboard-stack__item approval-card approval-card--dashboard">
                      <div className="approval-card__header">
                        <div className="approval-card__info">
                          <div className="approval-card__topline">
                            <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.92rem' }}>
                              {form.nomerForm}
                            </Typography>
                            <StatusChip status={form.status} />
                            <FormTypeBadge jenisForm={form.jenisForm} />
                          </div>
                          <div className="approval-card__meta">
                            <span className="approval-card__meta-item">
                              <span className="approval-card__meta-label">Departemen</span>
                              <strong>{form.department}</strong>
                            </span>
                            <span className="approval-card__meta-separator" aria-hidden="true" />
                            <span className="approval-card__meta-item">
                              <span className="approval-card__meta-label">Diperintah</span>
                              <strong>{form.diperintahOleh || '-'}</strong>
                            </span>
                            <span className="approval-card__meta-separator" aria-hidden="true" />
                            <span className="approval-card__meta-item">
                              <span className="approval-card__meta-label">Tanggal</span>
                              <strong>{form.tanggalPengajuan}</strong>
                            </span>
                          </div>
                          <div className="approval-card__summary approval-card__summary--simple">
                            <div className="approval-card__summary-item approval-card__summary-item--muted">
                              <Typography variant="caption" color="text.secondary">{form.entries?.length ?? 0} karyawan</Typography>
                            </div>
                            {form.lemburPada && (
                              <Chip
                                label={form.lemburPada}
                                size="small"
                                color={form.lemburPada === 'Hari Libur' ? 'error' : 'default'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem' }}
                              />
                            )}
                          </div>
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

    </Box>
  );
}
