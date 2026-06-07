import React, { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, Container, MenuItem, TextField, Typography,
} from '@mui/material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import axios from 'axios';
import * as XLSX from 'xlsx';

import CardBigBox from '../../components/ui/CardBigBox';
import DataTable from '../../components/ui/DataTable';
import { SelectFilter, RowsFilter } from '../../components/ui/SelectFilter';
import { ChevronDown, SearchMd, XClose } from '../../components/layout/icons';
import TalentaToggle from './TalentaToggle';
import ExportDropdown from './ExportDropdown';

const API = '/api/laporan';
const ROWS_OPTIONS = [10, 25, 50, 100];

const BULAN_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const FORM_TYPE_CHIP_MAP = {
  staff:        { label: 'Staff',        color: '#1a2a57', bg: 'rgba(26,42,87,0.08)',    icon: BadgeRoundedIcon },
  manager:      { label: 'Manager',      color: '#0277bd', bg: 'rgba(2,119,189,0.1)',    icon: ManageAccountsRoundedIcon },
  outsourcing:  { label: 'Outsourcing',  color: '#e65100', bg: 'rgba(230,81,0,0.09)',   icon: WorkRoundedIcon },
  harian_lepas: { label: 'Daily Worker', color: '#6a1b9a', bg: 'rgba(106,27,154,0.09)', icon: EventNoteRoundedIcon },
};

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

const selectSx = {
  width: '100%', minWidth: '100%',
  '& .MuiOutlinedInput-root': {
    width: '100%', height: 44, borderRadius: '22px', bgcolor: '#eef2f6', boxShadow: 'none',
    '& .MuiOutlinedInput-notchedOutline': { border: '1.5px solid rgba(26,42,87,0.11)', borderRadius: '22px' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(42,157,143,0.4)' },
    '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 3px rgba(42,157,143,0.14)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(42,157,143,0.6) !important', borderWidth: '1.5px !important' },
  },
  '& .MuiInputBase-root': { width: '100%' },
  '& .MuiSelect-select': {
    display: 'block', width: '100%', minWidth: 0,
    py: '0 !important', pl: '4px !important', pr: '36px !important',
    height: '44px !important', lineHeight: '44px', boxSizing: 'border-box', textOverflow: 'ellipsis',
  },
  '& .MuiSelect-icon': { color: '#6b7a90', right: 12 },
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

export default function Laporan() {
  const [rows, setRows]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deptOptions, setDeptOptions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filterBulan, setFilterBulan]   = useState('');
  const [filterDept, setFilterDept]     = useState('');
  const [filterJenis, setFilterJenis]   = useState('');
  const [filterTalenta, setFilterTalenta] = useState('');
  const [page, setPage]           = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [toggling, setToggling]   = useState(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    axios.get(`${API}/filter-options`)
      .then((r) => setDeptOptions(r.data.data?.departments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: rowsPerPage };
    if (filterBulan)   params.bulan        = filterBulan;
    if (filterDept)    params.department   = filterDept;
    if (filterJenis)   params.formType     = filterJenis;
    if (filterTalenta) params.talentaInput = filterTalenta;
    if (search.trim()) params.search       = search.trim();

    axios.get(API, { params })
      .then((r) => {
        const pg = r.data.pagination;
        setRows(r.data.data || []);
        setTotal(pg?.total || 0);
        setTotalPages(pg?.totalPages || 1);
      })
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false));
  }, [filterBulan, filterDept, filterJenis, filterTalenta, search, page, rowsPerPage]);

  const safePage = Math.min(page, totalPages);

  const handleToggle = async (row) => {
    const id = row.entryId;
    const next = !row.talentaInput;
    setRows((prev) => prev.map((r) => r.entryId === id ? { ...r, talentaInput: next } : r));
    setToggling((prev) => new Set(prev).add(id));
    try {
      await axios.patch(`${API}/entry/${id}/talenta`, { talentaInput: next });
    } catch {
      setRows((prev) => prev.map((r) => r.entryId === id ? { ...r, talentaInput: !next } : r));
      setError('Failed to update Talenta status. Please try again.');
    } finally {
      setToggling((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const getLabel = (r) => FORM_TYPE_CHIP_MAP[r.formType]?.label || r.formType || '';

  const fetchAllForExport = async () => {
    const params = {};
    if (filterBulan)   params.bulan        = filterBulan;
    if (filterDept)    params.department   = filterDept;
    if (filterJenis)   params.formType     = filterJenis;
    if (filterTalenta) params.talentaInput = filterTalenta;
    if (search.trim()) params.search       = search.trim();
    const r = await axios.get(`${API}/export`, { params });
    return r.data.data || [];
  };

  const exportCSV = async () => {
    const allRows = await fetchAllForExport();
    const headers = ['Form No.', 'Form Type', 'Department', 'Ordered By',
      'Employee Name', 'Employee ID', 'Overtime Date', 'Start Time', 'End Time',
      'Compensation', 'Talenta Input'];
    const lines = [headers.join(',')];
    allRows.forEach((r) => {
      lines.push([
        `"${r.formNumber || ''}"`, `"${getLabel(r)}"`, `"${r.department || ''}"`,
        `"${r.requestedBy || ''}"`, `"${r.name || ''}"`, `"${r.employeeId || ''}"`,
        `"${r.overtimeDate || ''}"`, `"${r.startTime || ''}"`, `"${r.endTime || ''}"`,
        `"${r.compensation || ''}"`, r.talentaInput ? 'Done' : 'Pending',
      ].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Overtime-Report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const allRows = await fetchAllForExport();
    const data = allRows.map((r) => ({
      'Form No.':     r.formNumber || '',
      'Form Type':    getLabel(r),
      'Department':   r.department || '',
      'Ordered By':   r.requestedBy || '',
      'Employee Name': r.name || '',
      'Employee ID':  r.employeeId || '',
      'Overtime Date': r.overtimeDate || '',
      'Start Time':   r.startTime || '',
      'End Time':     r.endTime || '',
      'Compensation': r.compensation || '',
      'Talenta Input': r.talentaInput ? 'Done' : 'Pending',
      'Form Status':  r.formStatus || '',
      'Approved By':  r.approvedBy || '',
      'Approved At':  r.approvedAt || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overtime Report');
    XLSX.writeFile(wb, `Overtime-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isFiltered = !!(filterBulan || filterDept || filterJenis || filterTalenta || search.trim());

  const buildPaginationItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    if (safePage > 3) items.push('...');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) items.push(i);
    if (safePage < totalPages - 2) items.push('...');
    items.push(totalPages);
    return items;
  };

  const tableColumns = [
    {
      key: 'formNumber', header: 'Form No.',
      render: (row) => <strong style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.88rem' }}>{row.formNumber}</strong>,
    },
    {
      key: 'formType', header: 'Form Type',
      render: (row) => <FormTypeBadge jenisForm={row.formType} />,
    },
    {
      key: 'department', header: 'Department',
      render: (row) => <strong style={{ fontSize: '0.85rem' }}>{row.department || '-'}</strong>,
    },
    {
      key: 'name', header: 'Employee Name',
      render: (row) => <strong style={{ fontSize: '0.85rem' }}>{row.name || '-'}</strong>,
    },
    { key: 'overtimeDate', header: 'Overtime Date', accessor: 'overtimeDate', cellStyle: { whiteSpace: 'nowrap' } },
    {
      key: 'talenta', header: 'Talenta',
      render: (row) => <TalentaToggle row={row} onToggle={handleToggle} isLoading={toggling.has(row.entryId)} />,
      cellStyle: { textAlign: 'center', whiteSpace: 'nowrap' },
    },
  ];

  const tableDetail = {
    eyebrow: 'Report Detail',
    title: (row) => row.name || row.formNumber,
    description: (row) => `${row.formNumber} · ${row.department}`,
    columnLabel: 'Entries',
    buttonLabel: 'Entries',
    render: (row) => (
      <div className="laporan-detail-grid">
        {[
          { label: 'Employee ID',    value: row.employeeId },
          { label: 'Ordered By',     value: row.requestedBy },
          { label: 'Overtime Hours', value: row.startTime && row.endTime ? `${row.startTime}–${row.endTime}` : '-' },
          { label: 'Compensation',   value: row.compensation },
          { label: 'Task / Work',    value: row.task },
          { label: 'Work Result',    value: row.result },
        ].map(({ label, value }) => (
          <div key={label} className="laporan-detail-item">
            <p className="laporan-detail-label">{label}</p>
            <p className="laporan-detail-value">{value || '-'}</p>
          </div>
        ))}
      </div>
    ),
  };

  const tablePagination = total > 0 ? {
    summary: `${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, total)} of ${total}`,
    currentPage: safePage,
    totalPages,
    pageSize: rowsPerPage,
    pageSizeOptions: ROWS_OPTIONS,
    pageSizeLabel: 'Show',
    pageSizeSuffix: 'rows',
    onPageSizeChange: (v) => { setRowsPerPage(Number(v)); setPage(1); },
    onPrevious: () => setPage((p) => Math.max(1, p - 1)),
    onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
    onSelect: (pageNum) => setPage(pageNum),
    previousLabel: 'Previous',
    nextLabel: 'Next',
    items: buildPaginationItems(),
    pageSizeNode: <RowsFilter rowsPerPage={rowsPerPage} onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }} />,
  } : null;

  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', overflowX: 'hidden' }}>
      <Container disableGutters maxWidth={false} sx={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Box className="dashboard-content" sx={pageSx}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          {/* ── Filter card ── */}
          <CardBigBox>
            <button
              type="button"
              className="approval-filter-card__toggle--icon"
              onClick={() => setMobileFilterOpen((p) => !p)}
              aria-expanded={mobileFilterOpen}
            >
              <span className="approval-filter-card__toggle--icon-label">
                <FilterListRoundedIcon style={{ fontSize: 16 }} />
                Filter & Search
              </span>
              <ChevronDown size={15} style={{ transition: 'transform 0.22s', transform: mobileFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>
            <div className={`approval-filter-card__fields${mobileFilterOpen ? ' approval-filter-card__fields--mobile-open' : ''}`} style={{ padding: '4px 0' }}>
              <div className="approval-filter-card__field approval-filter-card__field--search">
                <span className="approval-filter-card__label">Search</span>
                <div className="approval-filter-card__input-wrap">
                  <span className="approval-filter-card__icon"><SearchMd size={18} /></span>
                  <input
                    type="text"
                    className="approval-filter-card__input"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 180px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Overtime Month</span>
                <TextField select fullWidth value={filterBulan}
                  onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>All Months</em></MenuItem>
                  {BULAN_OPTIONS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 220px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Department</span>
                <TextField select fullWidth value={filterDept}
                  onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <ApartmentRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>All Departments</em></MenuItem>
                  {deptOptions.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 200px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Form Type</span>
                <TextField select fullWidth value={filterJenis}
                  onChange={(e) => { setFilterJenis(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  InputProps={{ startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7a90', mr: 0.75, ml: 0.25 }}>
                      <AssignmentIndRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  )}}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>All Types</em></MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="outsourcing">Outsourcing</MenuItem>
                  <MenuItem value="harian_lepas">Daily Worker</MenuItem>
                </TextField>
              </div>

              <div className="approval-filter-card__field" style={{ flex: '1 1 160px', minWidth: 0 }}>
                <span className="approval-filter-card__label">Talenta Status</span>
                <TextField select fullWidth value={filterTalenta}
                  onChange={(e) => { setFilterTalenta(e.target.value); setPage(1); }}
                  SelectProps={{ displayEmpty: true }}
                  sx={selectSx}
                >
                  <MenuItem value=""><em style={{ color: '#94a3b8' }}>All</em></MenuItem>
                  <MenuItem value="1">✓ Entered</MenuItem>
                  <MenuItem value="0">○ Not Entered</MenuItem>
                </TextField>
              </div>
            </div>
          </CardBigBox>

          {/* ── Main table card ── */}
          <CardBigBox
            eyebrow="HRD"
            title="Overtime Report"
            className="laporan-main-panel"
            contentClassName="laporan-main-panel__body"
            headerAction={!loading && total > 0 && (
              <ExportDropdown onCSV={exportCSV} onExcel={exportExcel} />
            )}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : rows.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1.5 }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.92rem' }}>
                  {isFiltered ? 'No data matching the selected filters.' : 'No approved overtime data yet.'}
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
                    Reset Filters
                  </button>
                )}
              </Box>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="approval-mobile-cards">
                  {rows.map((row, idx) => (
                    <div key={row.entryId} style={{
                      background: '#fff', borderRadius: 12,
                      border: '1px solid rgba(26,42,87,0.08)',
                      padding: '12px 14px',
                      boxShadow: '0 1px 4px rgba(26,42,87,0.06)',
                      animation: 'cardSlideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
                      animationDelay: `${Math.min(idx * 0.03, 0.15)}s`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: '#aab4c4', fontWeight: 700, flexShrink: 0 }}>
                            #{(safePage - 1) * rowsPerPage + idx + 1}
                          </span>
                          <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ minWidth: 0, fontSize: '0.88rem', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                            {row.formNumber}
                          </Typography>
                        </div>
                        <TalentaToggle row={row} onToggle={handleToggle} isLoading={toggling.has(row.entryId)} />
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <FormTypeBadge jenisForm={row.formType} />
                        {row.compensation && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            height: 24, padding: '0 8px', borderRadius: 12,
                            fontSize: '0.78rem', fontWeight: 700,
                            color: '#6d3fa0', background: 'rgba(109,63,160,0.08)',
                          }}>
                            {row.compensation}
                          </span>
                        )}
                      </div>

                      <div className="laporan-mobile-card__meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                        {[
                          { label: 'Name',          value: row.name },
                          { label: 'ID',            value: row.employeeId },
                          { label: 'Department',    value: row.department },
                          { label: 'Ordered By',    value: row.requestedBy },
                          { label: 'Overtime Date', value: row.overtimeDate },
                          { label: 'Time',          value: row.startTime && row.endTime ? `${row.startTime}–${row.endTime}` : '-' },
                          { label: 'Task',          value: row.task },
                          { label: 'Result',        value: row.result },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#aab4c4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#1a2a57', wordBreak: 'break-word' }}>{value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {tablePagination && (
                  <div className="approval-mob-pagination laporan-mobile-pagination">
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
                      <button type="button" className="users-table-pagination__button" onClick={tablePagination.onPrevious} disabled={safePage <= 1}>
                        Previous
                      </button>
                      <button type="button" className="users-table-pagination__button" onClick={tablePagination.onNext} disabled={safePage >= totalPages}>
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Desktop DataTable */}
                <div className="approval-desktop-table laporan-table-area">
                  <DataTable
                    rows={rows}
                    columns={tableColumns}
                    getRowId={(row) => row.entryId}
                    detail={tableDetail}
                    pagination={tablePagination}
                    tableLabel="Overtime Report"
                    className="laporan-table-no-x"
                  />
                </div>
              </>
            )}
          </CardBigBox>
        </Box>
      </Container>
    </Box>
  );
}
