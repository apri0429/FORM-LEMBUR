import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
} from '@mui/material';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CardBox from '../../components/ui/CardBox';
import CardBigBox from '../../components/ui/CardBigBox';
import DataTable from '../../components/ui/DataTable';
import {
  Check, FileText01, RefreshCw05, XClose, ChevronDown,
} from '../../components/layout/icons';
import { useAuth } from '../../context/AuthContext';
import StatusChip from '../../components/ui/StatusChip';

const API = '/api/overtime/dashboard';
const ROWS_OPTIONS = [10, 25, 50, 100];

const FORM_TYPE_CHIP_MAP = {
  staff:        { label: 'Staff',        color: '#1a2a57', bg: 'rgba(26,42,87,0.08)',    icon: BadgeRoundedIcon },
  manager:      { label: 'Manager',      color: '#0277bd', bg: 'rgba(2,119,189,0.1)',    icon: ManageAccountsRoundedIcon },
  outsourcing:  { label: 'Outsourcing',  color: '#e65100', bg: 'rgba(230,81,0,0.09)',   icon: WorkRoundedIcon },
  harian_lepas: { label: 'Daily Worker', color: '#6a1b9a', bg: 'rgba(106,27,154,0.09)', icon: EventNoteRoundedIcon },
};

function SelectFilter({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const wrapRef = useRef(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 200 && rect.top > 200;
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
    const onScroll = () => setOpen(false);
    const onResize = () => calcPos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
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
        <span className="sf-value">{selectedLabel}</span>
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
      <span className="approval-unified-pagination__label">View</span>
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

const pageSx = {
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  '& > *': { minWidth: 0 },
  '@media (max-width: 768px)': { gap: '12px' },
};

/* ── Donut chart (pure SVG, driven by server stats) ─────────────────── */
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
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--primary-blue)" fontFamily="Manrope, sans-serif">
        {total > 0 ? total : '—'}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="11" fill="rgba(26,42,87,0.5)" fontFamily="Manrope, sans-serif">
        total
      </text>
    </svg>
  );
}

const RANK_COLORS = [
  'var(--accent-gold)',
  'var(--accent-teal)',
  'var(--secondary-blue)',
  'var(--accent-coral)',
  'var(--accent-purple)',
];

/* ── Pure display: data comes directly from server ───────────────────── */
function DivisionRanking({ departments }) {
  const max = departments[0]?.count || 1;
  return (
    <CardBox eyebrow="Top Overtime Departments" style={{ flex: 1, minWidth: 0 }}>
      {departments.length === 0 ? (
        <p style={{ color: 'rgba(26,42,87,0.35)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0', margin: '4px 0 0' }}>
          No data yet
        </p>
      ) : (
        <div className="dash-ranking-list">
          {departments.map(({ department, count }, i) => (
            <div key={department} className="dash-ranking-item">
              <div className="dash-ranking-item__header">
                <span className="dash-ranking-rank">{i + 1}</span>
                <span className="dash-ranking-name">{department}</span>
                <span className="dash-ranking-count">{count} forms</span>
              </div>
              <div className="dash-ranking-track">
                <div className="dash-ranking-fill" style={{ width: `${(count / max) * 100}%`, background: RANK_COLORS[i] }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </CardBox>
  );
}

function StatCard({ label, value, detail, iconColor, icon, accentColor }) {
  return (
    <article className="dashboard-card dash-stat-card" style={{ gap: 0 }}>
      {/* Bar first in DOM so it's always above content */}
      <div className="dash-stat-bar" style={{ background: accentColor }} />
      <p className="dashboard-card__label">{label}</p>
      <strong className="dashboard-card__value" style={{ color: iconColor }}>
        {value != null ? value : <span style={{ opacity: 0.22 }}>—</span>}
      </strong>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        <p style={{ margin: 0, fontSize: '0.79rem', color: 'rgba(26,42,87,0.45)', lineHeight: 1.4 }}>{detail}</p>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          {icon}
        </div>
      </div>
    </article>
  );
}

const recentColumns = [
  {
    key: 'formNumber',
    header: 'No. Form',
    cellStyle: { whiteSpace: 'nowrap' },
    render: (row) => (
      <strong style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.85rem' }}>
        {row.formNumber}
      </strong>
    ),
  },
  {
    key: 'formType',
    header: 'Type',
    render: (row) => <FormTypeBadge jenisForm={row.formType} />,
  },
  {
    key: 'department',
    header: 'Department',
    render: (row) => <strong style={{ fontSize: '0.85rem' }}>{row.department}</strong>,
  },
  {
    key: 'submissionDate',
    header: 'Submission Date',
    accessor: 'submissionDate',
    cellStyle: { whiteSpace: 'nowrap' },
  },
  {
    key: 'overtimeDay',
    header: 'Overtime Day',
    render: (row) => (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
        fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap',
        background: row.overtimeDay === 'Hari Libur' ? 'rgba(231,111,81,0.1)' : 'rgba(26,42,87,0.06)',
        color: row.overtimeDay === 'Hari Libur' ? 'var(--accent-coral)' : '#51627f',
        border: `1px solid ${row.overtimeDay === 'Hari Libur' ? 'rgba(231,111,81,0.2)' : 'rgba(26,42,87,0.1)'}`,
      }}>
        {row.overtimeDay || '-'}
      </span>
    ),
  },
  {
    key: 'entries',
    header: 'Employees',
    cellStyle: { textAlign: 'center' },
    render: (row) => (
      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary-blue)' }}>
        {row.entries?.length ?? 0}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusChip status={row.status} />,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashData, setDashData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    axios.get(API, { params: { page, limit: rowsPerPage } })
      .then(r => setDashData(r.data.data || null))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage]);

  const stats          = dashData?.stats;
  const topDepartments = dashData?.topDepartments || [];
  const recentForms    = dashData?.recentForms?.data || [];
  const pg             = dashData?.recentForms?.pagination;
  const totalPages     = pg?.totalPages || 1;
  const safePage       = Math.min(page, totalPages);

  const buildPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    if (safePage > 3) items.push('...');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) items.push(i);
    if (safePage < totalPages - 2) items.push('...');
    items.push(totalPages);
    return items;
  };

  const tablePagination = pg && pg.total > 0 ? {
    summary: `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, pg.total)} of ${pg.total}`,
    currentPage: safePage,
    totalPages,
    pageSize: rowsPerPage,
    pageSizeOptions: ROWS_OPTIONS,
    pageSizeLabel: 'Show',
    pageSizeSuffix: 'rows',
    onPageSizeChange: (v) => { setRowsPerPage(Number(v)); setPage(1); },
    onPrevious: () => setPage(p => Math.max(1, p - 1)),
    onNext:     () => setPage(p => Math.min(totalPages, p + 1)),
    onSelect:   (n) => setPage(n),
    previousLabel: 'Previous',
    nextLabel:     'Next',
    items: buildPageItems(),
    pageSizeNode: <RowsFilter rowsPerPage={rowsPerPage} onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }} />,
  } : null;

  const headerAction = (
    <button
      type="button"
      className="add-board-button"
      onClick={() => navigate('/form/baru')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      New Form
    </button>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Container disableGutters maxWidth={false} sx={{ width: '100%' }}>
        <Box sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ flexShrink: 0 }}>{error}</Alert>}

          {/* ── Stat Cards ── */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(4, minmax(0,1fr))' },
            gap: { xs: '10px', sm: '14px' },
            '@keyframes fadeSlideUp': {
              from: { opacity: 0, transform: 'translateY(16px)' },
              to:   { opacity: 1, transform: 'translateY(0)' },
            },
            '& > *': { animation: 'fadeSlideUp 0.42s cubic-bezier(0.22,1,0.36,1) both' },
            '& > *:nth-of-type(1)': { animationDelay: '0.04s' },
            '& > *:nth-of-type(2)': { animationDelay: '0.09s' },
            '& > *:nth-of-type(3)': { animationDelay: '0.14s' },
            '& > *:nth-of-type(4)': { animationDelay: '0.19s' },
          }}>
            <StatCard label="Total Forms"   value={stats?.total}            detail="All submissions"  iconColor="var(--primary-blue)"  accentColor="var(--primary-blue)"  icon={<FileText01 size={18} />} />
            <StatCard label="Approved"      value={stats?.approved}         detail="Fully processed"  iconColor="var(--accent-teal)"   accentColor="var(--accent-teal)"   icon={<Check size={18} />} />
            <StatCard label="Pending"       value={stats?.pending}          detail="Awaiting action"  iconColor="#c08b00"               accentColor="var(--accent-gold)"   icon={<RefreshCw05 size={18} />} />
            <StatCard label="Rejected"      value={stats?.rejected}         detail="Not approved"     iconColor="var(--accent-coral)"  accentColor="var(--accent-coral)"  icon={<XClose size={18} />} />
          </Box>

          {/* ── Analytics Row ── */}
          <div className="dash-analytics-row" style={{ animation: 'fadeSlideUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.22s both' }}>
            <CardBox eyebrow="Form Status Distribution" className="dash-chart-card">
              <div className="dash-chart-card__inner">
                <DonutChart
                  segments={[
                    { label: 'Approved', value: stats?.approved ?? 0,          color: 'var(--accent-teal)' },
                    { label: 'Pending',  value: stats?.pending  ?? 0,          color: 'var(--accent-gold)' },
                    { label: 'Rejected', value: stats?.rejected ?? 0,          color: 'var(--accent-coral)' },
                  ]}
                  total={stats?.total ?? 0}
                  size={170} outerR={72} innerR={47}
                />
                <div className="dash-chart-legend">
                  {[
                    { label: 'Approved', value: stats?.approved, color: 'var(--accent-teal)' },
                    { label: 'Pending',  value: stats?.pending,  color: 'var(--accent-gold)' },
                    { label: 'Rejected', value: stats?.rejected, color: 'var(--accent-coral)' },
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
            </CardBox>

            <DivisionRanking departments={topDepartments} />
          </div>

          {/* ── Recent Forms ── */}
          <CardBigBox
            eyebrow={pg ? `${pg.total} total forms` : ''}
            title="Recent Forms"
            headerAction={!loading && headerAction}
            style={{ animation: 'fadeSlideUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.30s both' }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : recentForms.length === 0 ? (
              <div className="dashboard-empty-state">
                <FileText01 size={48} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <p className="dashboard-empty-state__title">No forms yet</p>
                <p className="dashboard-empty-state__detail">Create a new form to start submitting overtime requests.</p>
              </div>
            ) : (
              <>
                {/* Desktop: piagam DataTable with server-driven pagination */}
                <div className="dash-recent-table approval-desktop-table">
                  <DataTable
                    rows={recentForms}
                    columns={recentColumns}
                    getRowId={(row) => row.id}
                    tableLabel="Recent Forms"
                    pagination={tablePagination}
                  />
                </div>

                {/* Mobile cards + pagination wrapper */}
                <div className="dash-mobile-wrapper">
                  <div className="approval-mobile-cards dash-mobile-cards">
                    {recentForms.map((form) => (
                      <div key={form.id} style={{
                        background: '#fff', borderRadius: 14,
                        border: '1px solid rgba(26,42,87,0.08)',
                        padding: '12px 14px',
                        boxShadow: '0 1px 4px rgba(26,42,87,0.05)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <strong style={{ color: 'var(--primary-blue)', fontSize: '0.9rem', fontWeight: 800 }}>
                            {form.formNumber}
                          </strong>
                          <StatusChip status={form.status} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <FormTypeBadge jenisForm={form.formType} />
                          {form.overtimeDay && (
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                              fontSize: '0.74rem', fontWeight: 700,
                              background: form.overtimeDay === 'Hari Libur' ? 'rgba(231,111,81,0.1)' : 'rgba(26,42,87,0.06)',
                              color: form.overtimeDay === 'Hari Libur' ? 'var(--accent-coral)' : '#51627f',
                              border: `1px solid ${form.overtimeDay === 'Hari Libur' ? 'rgba(231,111,81,0.2)' : 'rgba(26,42,87,0.1)'}`,
                            }}>
                              {form.overtimeDay}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                          {[
                            { label: 'Department', value: form.department },
                            { label: 'Ordered By', value: form.requestedBy || '-' },
                            { label: 'Date',       value: form.submissionDate },
                            { label: 'Employees',  value: `${form.entries?.length ?? 0} people` },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p style={{ margin: 0, fontSize: '0.65rem', color: '#aab4c4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                              <p style={{ margin: 0, fontSize: '0.79rem', fontWeight: 600, color: 'var(--primary-blue)' }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile pagination — outside scroll area */}
                  {tablePagination && (
                    <div className="approval-mob-pagination dash-mob-pagination-sticky">
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
                        <button type="button" className="users-table-pagination__button" onClick={tablePagination.onPrevious} disabled={safePage <= 1}>Previous</button>
                        <button type="button" className="users-table-pagination__button" onClick={tablePagination.onNext} disabled={safePage >= totalPages}>Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>

      <style>{`
        .dash-stat-bar {
          height: 3px; border-radius: 2px;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        .dash-stat-card .dashboard-card__value {
          margin-top: 6px;
        }
        @media (max-width: 768px) {
          .dash-stat-card .dashboard-card__value { font-size: 1.6rem !important; }
        }

        .dash-recent-table .users-table-wrapper {
          max-height: 320px;
          overflow-y: auto;
          overflow-x: auto;
          border: 1px solid rgba(26,42,87,0.08);
          border-radius: 14px;
        }
        .dash-recent-table .users-table {
          min-width: 700px;
        }
        .dash-recent-table .users-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #f3f6fa;
        }
        .dash-mobile-wrapper {
          display: none;
          flex-direction: column;
        }
        .dash-mobile-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 420px;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .dash-mob-pagination-sticky {
          flex-shrink: 0;
          border-top: 1px solid rgba(26,42,87,0.08);
          margin-top: 4px;
          padding-top: 10px;
        }
        @media (max-width: 768px) {
          .dash-recent-table { display: none; }
          .dash-mobile-wrapper { display: flex !important; }
        }
        .dashboard-empty-state {
          text-align: center;
          padding: 40px 24px;
        }
        .dashboard-empty-state__title {
          margin: 0 0 6px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--primary-blue);
        }
        .dashboard-empty-state__detail {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(26,42,87,0.45);
        }
      `}</style>
    </Box>
  );
}
