import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, CircularProgress, Collapse, Container, MenuItem,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, Printer, SearchMd, XClose } from '../components/template/TemplateIcons.jsx';

const API = '/api/laporan';
const ROWS_OPTIONS = [10, 25, 50, 100];
const BULAN_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pageSx = {
  height: '100%',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  overflow: 'hidden',
  '& .laporan-main-panel': {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '& .laporan-main-panel__body': {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};

const FORM_TYPE_CHIP_MAP = {
  staff:        { label: 'Staff',        color: '#1a2a57', bg: 'rgba(26,42,87,0.08)',    icon: BadgeRoundedIcon },
  manager:      { label: 'Manager',      color: '#0277bd', bg: 'rgba(2,119,189,0.1)',    icon: ManageAccountsRoundedIcon },
  outsourcing:  { label: 'Outsourcing',  color: '#e65100', bg: 'rgba(230,81,0,0.09)',   icon: WorkRoundedIcon },
  harian_lepas: { label: 'Harian Lepas', color: '#6a1b9a', bg: 'rgba(106,27,154,0.09)', icon: EventNoteRoundedIcon },
};

function FormTypeBadge({ jenisForm }) {
  const cfg = FORM_TYPE_CHIP_MAP[jenisForm];
  if (!cfg) return <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{jenisForm || '-'}</span>;
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

function TalentaToggle({ row, onToggle, isLoading }) {
  const done = !!row.talentaInput;
  return (
    <button
      type="button"
      onClick={() => onToggle(row)}
      disabled={isLoading}
      title={done ? 'Sudah — klik untuk batalkan' : 'Belum — klik untuk tandai sudah'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 26, padding: '0 10px', borderRadius: 13,
        fontSize: '0.77rem', fontWeight: 700,
        cursor: isLoading ? 'wait' : 'pointer',
        border: `1.5px solid ${done ? 'rgba(46,125,50,0.2)' : 'rgba(194,96,0,0.2)'}`,
        background: done ? 'rgba(46,125,50,0.08)' : 'rgba(245,124,0,0.07)',
        color: done ? '#2e7d32' : '#c26000',
        transition: 'all 0.18s',
        outline: 'none',
      }}
    >
      {isLoading
        ? <CircularProgress size={11} color="inherit" />
        : done
          ? <CheckCircleOutlineIcon style={{ fontSize: 14 }} />
          : <RadioButtonUncheckedIcon style={{ fontSize: 14 }} />}
      {done ? 'Sudah' : 'Belum'}
    </button>
  );
}

const EXPORT_ITEMS = [
  { label: 'Export CSV',   desc: 'Unduh file .csv',   color: '#1a5276', bg: '#eaf1fb', icon: FileDownloadRoundedIcon, action: null },
  { label: 'Export Excel', desc: 'Unduh file .xlsx',  color: '#1e8449', bg: '#eafaf1', icon: TableChartRoundedIcon,   action: null },
  { label: 'Download PDF', desc: 'Unduh file .pdf',   color: '#6d3fa0', bg: '#f3eeff', icon: Printer,                 action: null },
];

function ExportDropdown({ onCSV, onExcel, onPrint }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const items = EXPORT_ITEMS.map((it, i) => ({
    ...it, action: [onCSV, onExcel, onPrint][i],
  }));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="add-board-button"
        style={{ gap: 6 }}
      >
        <FileDownloadRoundedIcon style={{ fontSize: 15 }} />
        Export
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(26,42,87,0.16), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(26,42,87,0.08)',
          minWidth: 210, overflow: 'hidden', padding: '6px',
        }}>
          <p style={{ margin: '4px 10px 6px', fontSize: '0.68rem', fontWeight: 700, color: '#aab4c4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Unduh Data
          </p>
          {items.map(({ label, desc, color, bg, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 10px', borderRadius: 9,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.13s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = bg}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ fontSize: 16, color }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#1a2a57', lineHeight: 1.2 }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#8fa3b8', lineHeight: 1.2 }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function sortMonthYear(a, b) {
  const [mA, yA] = a.split('-');
  const [mB, yB] = b.split('-');
  const yDiff = Number(yB) - Number(yA);
  if (yDiff !== 0) return yDiff;
  return BULAN_ORDER.indexOf(mB) - BULAN_ORDER.indexOf(mA);
}

const selectSx = {
  width: '100%', minWidth: '100%',
  '& .MuiOutlinedInput-root': {
    width: '100%', height: 44, borderRadius: '11px', bgcolor: '#eef2f6', boxShadow: 'none',
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


export default function Laporan() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterTalenta, setFilterTalenta] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [toggling, setToggling] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  useEffect(() => {
    setLoading(true);
    axios.get(API)
      .then(r => setRows(r.data.data || []))
      .catch(() => setError('Gagal memuat data laporan.'))
      .finally(() => setLoading(false));
  }, []);

  const uniqueMonths = useMemo(() => {
    const set = new Set();
    rows.forEach(r => {
      if (r.tanggalLembur) {
        const parts = r.tanggalLembur.split('-');
        if (parts.length >= 3) set.add(`${parts[1]}-${parts[2]}`);
      }
    });
    return [...set].sort(sortMonthYear);
  }, [rows]);

  const uniqueDepts = useMemo(() =>
    [...new Set(rows.map(r => r.department).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterBulan) {
        const parts = (r.tanggalLembur || '').split('-');
        const my = parts.length >= 3 ? `${parts[1]}-${parts[2]}` : '';
        if (my !== filterBulan) return false;
      }
      if (filterDept && r.department !== filterDept) return false;
      if (filterJenis && r.jenisForm !== filterJenis) return false;
      if (filterTalenta === '1' && !r.talentaInput) return false;
      if (filterTalenta === '0' && r.talentaInput) return false;
      if (q) {
        const hay = [r.nomerForm, r.nama, r.department, r.diperintahOleh, r.idKaryawan]
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterBulan, filterDept, filterJenis, filterTalenta, search]);


  const stats = useMemo(() => ({
    total: filtered.length,
    sudah: filtered.filter(r => r.talentaInput).length,
    belum: filtered.filter(r => !r.talentaInput).length,
  }), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleToggle = async (row) => {
    const id = row.entryId;
    const next = !row.talentaInput;
    setRows(prev => prev.map(r => r.entryId === id ? { ...r, talentaInput: next } : r));
    setToggling(prev => new Set(prev).add(id));
    try {
      await axios.patch(`${API}/entry/${id}/talenta`, { talentaInput: next });
    } catch {
      setRows(prev => prev.map(r => r.entryId === id ? { ...r, talentaInput: !next } : r));
      setError('Gagal memperbarui status Talenta. Coba lagi.');
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const getLabel = r => FORM_TYPE_CHIP_MAP[r.jenisForm]?.label || r.jenisForm || '';

  const exportCSV = () => {
    const headers = ['No. Form', 'Jenis Form', 'Departemen', 'Diperintah Oleh',
      'Nama Karyawan', 'ID Karyawan', 'Tgl. Lembur', 'Jam Mulai', 'Jam Selesai',
      'Kompensasi', 'Input Talenta'];
    const lines = [headers.join(',')];
    filtered.forEach(r => {
      lines.push([
        `"${r.nomerForm || ''}"`, `"${getLabel(r)}"`, `"${r.department || ''}"`,
        `"${r.diperintahOleh || ''}"`, `"${r.nama || ''}"`, `"${r.idKaryawan || ''}"`,
        `"${r.tanggalLembur || ''}"`, `"${r.jamMulai || ''}"`, `"${r.jamSelesai || ''}"`,
        `"${r.kompensasi || ''}"`, r.talentaInput ? 'Sudah' : 'Belum',
      ].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan-Lembur-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'No. Form': r.nomerForm || '',
      'Jenis Form': getLabel(r),
      'Departemen': r.department || '',
      'Diperintah Oleh': r.diperintahOleh || '',
      'Nama Karyawan': r.nama || '',
      'ID Karyawan': r.idKaryawan || '',
      'Tgl. Lembur': r.tanggalLembur || '',
      'Jam Mulai': r.jamMulai || '',
      'Jam Selesai': r.jamSelesai || '',
      'Kompensasi': r.kompensasi || '',
      'Input Talenta': r.talentaInput ? 'Sudah' : 'Belum',
      'Status Form': r.formStatus || '',
      'Disetujui Oleh': r.approvedBy || '',
      'Tgl. Disetujui': r.approvedAt || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Lembur');
    XLSX.writeFile(wb, `Laporan-Lembur-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(26, 42, 87);
    doc.text('Laporan Lembur', 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(96, 112, 137);
    const meta = [
      `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      filterBulan && `Bulan: ${filterBulan}`,
      filterDept  && `Dept: ${filterDept}`,
      filterJenis && `Jenis: ${getLabel({ jenisForm: filterJenis })}`,
    ].filter(Boolean).join('   •   ');
    doc.text(meta, 14, 20);
    doc.text(`Total: ${stats.total} entri  •  Sudah Talenta: ${stats.sudah}  •  Belum: ${stats.belum}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['#', 'No. Form', 'Jenis', 'Departemen', 'Diperintah Oleh', 'Nama Karyawan', 'ID', 'Tgl. Lembur', 'Mulai', 'Selesai', 'Kompensasi', 'Talenta']],
      body: filtered.map((r, i) => [
        i + 1,
        r.nomerForm || '',
        getLabel(r),
        r.department || '',
        r.diperintahOleh || '',
        r.nama || '',
        r.idKaryawan || '',
        r.tanggalLembur || '',
        r.jamMulai || '',
        r.jamSelesai || '',
        r.kompensasi || '',
        r.talentaInput ? 'Sudah' : 'Belum',
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [26, 42, 87], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        7: { cellWidth: 22 },
        8: { cellWidth: 14 },
        9: { cellWidth: 14 },
        11: { cellWidth: 18, halign: 'center' },
      },
    });

    doc.save(`Laporan-Lembur-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const isFiltered = filterBulan || filterDept || filterJenis || filterTalenta;

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          {/* ── Filter card ── */}
          <div className={`approval-filter-card approved-filter-card${mobileFilterOpen ? ' approval-filter-card--mobile-open' : ''}`}>
            <button
              type="button"
              className="approval-filter-card__toggle"
              onClick={() => setMobileFilterOpen(p => !p)}
              aria-expanded={mobileFilterOpen}
            >
              <span className="approval-filter-card__toggle-label">
                <FilterListRoundedIcon sx={{ fontSize: 20 }} />
                Filter & Pencarian
              </span>
              <ChevronDown size={18} style={{ transition: 'transform 0.22s', transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <div className="approval-filter-card__fields">
              <div className="approval-filter-card__field approval-filter-card__field--search" style={{ flex: '2 1 220px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Pencarian</span>
                <div className="approval-filter-card__input-wrap">
                  <span className="approval-filter-card__icon"><SearchMd size={18} /></span>
                  <input
                    type="text"
                    className="approval-filter-card__input"
                    placeholder="Cari..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 180px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Bulan Lembur</span>
                <TextField select fullWidth value={filterBulan}
                  onChange={e => { setFilterBulan(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua Bulan</em></MenuItem>
                  {uniqueMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 220px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Departemen</span>
                <TextField select fullWidth value={filterDept}
                  onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <ApartmentRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua Departemen</em></MenuItem>
                  {uniqueDepts.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 200px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Jenis Form</span>
                <TextField select fullWidth value={filterJenis}
                  onChange={e => { setFilterJenis(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <AssignmentIndRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua Jenis</em></MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="outsourcing">Outsourcing</MenuItem>
                  <MenuItem value="harian_lepas">Harian Lepas</MenuItem>
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 160px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Status Talenta</span>
                <TextField select fullWidth value={filterTalenta}
                  onChange={e => { setFilterTalenta(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>Semua</em></MenuItem>
                  <MenuItem value="1">✓ Sudah Input</MenuItem>
                  <MenuItem value="0">○ Belum Input</MenuItem>
                </TextField>
              </div>
            </div>
          </div>

          {/* ── Main table card ── */}
          <CardBigBox
            eyebrow="HRD"
            title="Laporan Lembur"
            className="laporan-main-panel"
            contentClassName="laporan-main-panel__body"
            headerAction={!loading && filtered.length > 0 && (
              <ExportDropdown
                onCSV={exportCSV}
                onExcel={exportExcel}
                onPrint={exportPDF}
              />
            )}
            footer={filtered.length > 0 && !loading ? (
              <div className="approval-pagination">
                <div className="approval-pagination__rows">
                  <span className="approval-pagination__rows-text">Tampilkan</span>
                  <TextField
                    select size="small" value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                    sx={{ width: 72 }}
                  >
                    {ROWS_OPTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                  <span className="approval-pagination__rows-text">baris</span>
                </div>
                <div className="approval-pagination__nav">
                  <span className="approval-pagination__info">
                    {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, filtered.length)} dari {filtered.length}
                  </span>
                  <button type="button" className="approval-pagination__btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                    <KeyboardArrowLeftIcon sx={{ fontSize: 16 }} />
                    <span className="approval-pagination__btn-label">Previous</span>
                  </button>
                  <button type="button" className="approval-pagination__btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                    <span className="approval-pagination__btn-label">Next</span>
                    <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            ) : null}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1.5 }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.92rem' }}>
                  {isFiltered ? 'Tidak ada data dengan filter yang dipilih.' : 'Belum ada data lembur yang disetujui.'}
                </Typography>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={() => { setFilterBulan(''); setFilterDept(''); setFilterJenis(''); setFilterTalenta(''); setPage(1); }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      height: 32, padding: '0 14px', borderRadius: 8,
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      border: '1.5px solid rgba(26,42,87,0.15)', background: 'rgba(26,42,87,0.05)',
                      color: '#1a2a57', outline: 'none',
                    }}
                  >
                    <XClose size={13} />
                    Reset Filter
                  </button>
                )}
              </Box>
            ) : (
              <>
                {/* Mobile cards */}
                <Box sx={{
                  display: 'none',
                  '@media (max-width: 768px)': {
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
                  },
                }}>
                  {pagedRows.map((row, idx) => (
                    <div key={row.entryId} style={{
                      background: '#fff', borderRadius: 12,
                      border: '1px solid rgba(26,42,87,0.08)',
                      padding: '12px 14px',
                      boxShadow: '0 1px 4px rgba(26,42,87,0.06)',
                      animation: 'cardSlideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${Math.min(idx * 0.03, 0.15)}s`,
                    }}>
                      {/* Top row: no form + status talenta */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: '#aab4c4', fontWeight: 700, flexShrink: 0 }}>
                            #{(safePage - 1) * rowsPerPage + idx + 1}
                          </span>
                          <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.88rem', lineHeight: 1.2 }}>
                            {row.nomerForm}
                          </Typography>
                        </div>
                        <TalentaToggle row={row} onToggle={handleToggle} isLoading={toggling.has(row.entryId)} />
                      </div>

                      {/* Badges row */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <FormTypeBadge jenisForm={row.jenisForm} />
                        {row.kompensasi && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            height: 24, padding: '0 8px', borderRadius: 12,
                            fontSize: '0.78rem', fontWeight: 700,
                            color: '#6d3fa0', background: 'rgba(109,63,160,0.08)',
                          }}>
                            {row.kompensasi}
                          </span>
                        )}
                      </div>

                      {/* Meta grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                        {[
                          { label: 'Nama',       value: row.nama },
                          { label: 'ID',         value: row.idKaryawan },
                          { label: 'Departemen', value: row.department },
                          { label: 'Diperintah', value: row.diperintahOleh },
                          { label: 'Tgl. Lembur',value: row.tanggalLembur },
                          { label: 'Jam',        value: row.jamMulai && row.jamSelesai ? `${row.jamMulai}–${row.jamSelesai}` : '-' },
                          { label: 'Pekerjaan',  value: row.tugas },
                          { label: 'Hasil',      value: row.hasil },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#aab4c4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#1a2a57', wordBreak: 'break-word' }}>{value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </Box>

                {/* Desktop table */}
                <TableContainer component={Paper} elevation={0} className="laporan-table-area" sx={{
                  flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable',
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  background: 'linear-gradient(180deg,rgba(248,250,252,0.9) 0%,rgba(255,255,255,0.96) 100%)',
                  '@media (max-width: 768px)': { display: 'none' },
                }}>
                  <Table size="small" stickyHeader sx={{
                    tableLayout: 'fixed', width: '100%',
                    '& .MuiTableCell-root': { px: 1, py: 0.75, fontSize: '0.8rem', wordBreak: 'break-word' },
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontSize: '0.72rem', fontWeight: 800, color: '#607089',
                      backgroundColor: '#f3f6fa',
                      borderBottom: '1px solid rgba(26,42,87,0.1)',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiTableBody-root .laporan-data-row:hover td': { background: 'rgba(237,242,250,0.85)' },
                    '& .MuiTableBody-root td': { transition: 'background .15s' },
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 36, textAlign: 'center' }}>#</TableCell>
                        <TableCell sx={{ width: '13%' }}>No. Form</TableCell>
                        <TableCell sx={{ width: '9%' }}>Jenis</TableCell>
                        <TableCell sx={{ width: '11%' }}>Departemen</TableCell>
                        <TableCell sx={{ width: '11%' }}>Diperintah</TableCell>
                        <TableCell sx={{ width: '12%' }}>Nama Karyawan</TableCell>
                        <TableCell sx={{ width: '8%' }}>ID</TableCell>
                        <TableCell sx={{ width: '9%' }}>Tgl. Lembur</TableCell>
                        <TableCell sx={{ width: '10%' }}>Mulai–Selesai</TableCell>
                        <TableCell sx={{ width: '8%' }}>Kompensasi</TableCell>
                        <TableCell sx={{ width: '9%' }} align="center">Talenta</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRows.map((row, idx) => {
                        const isExpanded = expandedId === row.entryId;
                        const hasDetail = !!(row.tugas || row.hasil);
                        return (
                        <React.Fragment key={row.entryId}>
                        <TableRow
                          className="laporan-data-row"
                          hover
                          onClick={() => hasDetail && toggleExpand(row.entryId)}
                          sx={{
                            cursor: hasDetail ? 'pointer' : 'default',
                            borderBottom: isExpanded ? 'none' : undefined,
                            animation: 'cardSlideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
                            animationDelay: `${Math.min(idx * 0.03, 0.15)}s`,
                          }}
                        >
                          <TableCell sx={{ color: '#94a3b8', textAlign: 'center', pr: 0 }}>
                            {hasDetail ? (
                              isExpanded
                                ? <ExpandLessIcon sx={{ fontSize: 18, display: 'block', mx: 'auto' }} />
                                : <ExpandMoreIcon sx={{ fontSize: 18, display: 'block', mx: 'auto' }} />
                            ) : (safePage - 1) * rowsPerPage + idx + 1}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ wordBreak: 'break-word' }}>
                              {row.nomerForm}
                            </Typography>
                          </TableCell>
                          <TableCell><FormTypeBadge jenisForm={row.jenisForm} /></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{row.department || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{row.diperintahOleh || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{row.nama || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <span className="users-table__status users-table__status--inline users-table__status--app" style={{ fontSize: '0.72rem' }}>
                              {row.idKaryawan || '-'}
                            </span>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.tanggalLembur || '-'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              {row.jamMulai || '-'}–{row.jamSelesai || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="secondary.main">
                              {row.kompensasi || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TalentaToggle
                              row={row}
                              onToggle={handleToggle}
                              isLoading={toggling.has(row.entryId)}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={11} sx={{ py: 0, border: isExpanded ? undefined : 'none !important' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{
                                mx: 2, my: 1.5,
                                borderRadius: 1.5,
                                border: '1px solid rgba(26,42,87,0.08)',
                                background: 'rgba(248,250,252,0.7)',
                                overflow: 'hidden',
                              }}>
                                <Typography variant="caption" fontWeight={800} color="primary.main"
                                  sx={{ display: 'block', px: 1.5, pt: 1.25, pb: 0.75, borderBottom: '1px solid rgba(26,42,87,0.07)', letterSpacing: '0.03em' }}>
                                  DETAIL PEKERJAAN
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', p: 1.5 }}>
                                  {row.tugas && (
                                    <div style={{ flex: '1 1 200px' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: '0.67rem', fontWeight: 700, color: '#9aabbc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pekerjaan / Tugas</p>
                                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#344563', lineHeight: 1.5 }}>{row.tugas}</p>
                                    </div>
                                  )}
                                  {row.hasil && (
                                    <div style={{ flex: '1 1 200px' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: '0.67rem', fontWeight: 700, color: '#9aabbc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasil Pekerjaan</p>
                                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#344563', lineHeight: 1.5 }}>{row.hasil}</p>
                                    </div>
                                  )}
                                </Box>
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

                {/* Hidden print table — semua baris, bukan hanya halaman aktif */}
                <div className="laporan-print-only">
                  <div style={{ marginBottom: 12 }}>
                    <h2 style={{ margin: '0 0 2px', fontSize: 15, color: '#1a2a57', fontWeight: 800 }}>Laporan Lembur</h2>
                    <p style={{ margin: 0, fontSize: 11, color: '#607089' }}>
                      Dicetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {filterBulan && ` • Bulan: ${filterBulan}`}
                      {filterDept && ` • Dept: ${filterDept}`}
                      {filterJenis && ` • Jenis: ${getLabel({ jenisForm: filterJenis })}`}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#607089' }}>
                      Total: {stats.total} entri • Sudah Talenta: {stats.sudah} • Belum: {stats.belum}
                    </p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr style={{ background: '#f3f6fa' }}>
                        {['#', 'No. Form', 'Jenis', 'Departemen', 'Diperintah Oleh', 'Nama', 'ID Karyawan',
                          'Tgl. Lembur', 'Mulai', 'Selesai', 'Kompensasi', 'Pekerjaan', 'Hasil', 'Talenta'].map(h => (
                          <th key={h} style={{ border: '1px solid #d1d9e6', padding: '4px 6px', textAlign: 'left', fontWeight: 700, color: '#607089' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row, idx) => (
                        <tr key={row.entryId} style={{ background: idx % 2 === 1 ? '#f8fafc' : '#fff' }}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px', color: '#9ca3af' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px', fontWeight: 700, color: '#1a2a57' }}>{row.nomerForm}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{getLabel(row)}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.department || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.diperintahOleh || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px', fontWeight: 600 }}>{row.nama || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.idKaryawan || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.tanggalLembur || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.jamMulai || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.jamSelesai || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px', fontWeight: 700 }}>{row.kompensasi || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.tugas || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px' }}>{row.hasil || '-'}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '3px 5px', fontWeight: 700, color: row.talentaInput ? '#2e7d32' : '#c26000' }}>
                            {row.talentaInput ? '✓ Sudah' : '○ Belum'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>

      <style>{`
        .laporan-print-only { display: none; }
        @media print {
          .dashboard-shell > *:not(.dashboard-stage) { display: none !important; }
          .dashboard-stage header { display: none !important; }
          .dashboard-stage .dashboard-main { padding: 16px !important; }
          .approval-filter-card, .approved-filter-card { display: none !important; }
          .laporan-table-area { display: none !important; }
          .dashboard-panel__footer { display: none !important; }
          .laporan-print-only { display: block !important; }
        }
      `}</style>
    </Box>
  );
}
