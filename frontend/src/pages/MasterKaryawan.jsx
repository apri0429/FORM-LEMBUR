import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Chip, CircularProgress, Alert,
  Grid, Divider, useTheme, useMediaQuery, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, IconButton
} from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import axios from 'axios';
import CreateButton from '../components/button/CreateButton';
import CardBigBox from '../components/cardbox/CardBigBox';
import { ChevronDown, SearchMd } from '../components/template/TemplateIcons.jsx';

const API = '/api/karyawan';
const ROWS_OPTIONS = [10, 25, 50, 100];

const LEVEL_COLOR = {
  7: 'error', 6: 'error', 5: 'warning', 4: 'primary', 3: 'info', 2: 'secondary', 1: 'default',
};

const pageSx = {
  height: '100%',
  minHeight: 0,
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  '& .karyawan-main-panel': {
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
  '& .karyawan-main-panel .dashboard-panel__header': {
    flexShrink: 0,
  },
  '& .karyawan-main-panel .dashboard-panel__header--split': {
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: 2,
  },
  '& .karyawan-main-panel .dashboard-panel__action': {
    justifySelf: 'end',
  },
  '& .karyawan-main-panel__body': {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  '& .karyawan-list-pagination': {
    flexShrink: 0,
  },
  '@media (max-width: 768px)': {
    '& .karyawan-main-panel': {
      padding: '16px',
      borderRadius: '18px',
    },
    '& .karyawan-main-panel .dashboard-panel__header--split': {
      gridTemplateColumns: '1fr',
      gap: 1.25,
      paddingBottom: '12px',
      borderBottom: '1px solid rgba(26, 42, 87, 0.07)',
    },
    '& .karyawan-main-panel .dashboard-panel__action': {
      justifySelf: 'stretch',
      width: '100%',
    },
    '& .karyawan-main-panel .approval-filter-bar': {
      width: '100%',
      justifyContent: 'stretch',
    },
    '& .karyawan-main-panel .approval-filter-bar__field, & .karyawan-main-panel .approval-filter-bar__input--search, & .karyawan-main-panel .approval-filter-bar__select': {
      width: '100%',
    },
    '& .karyawan-list-pagination': {
      alignItems: 'stretch',
      gap: 1,
    },
    '& .karyawan-list-pagination > .MuiBox-root': {
      justifyContent: 'space-between',
    },
  },
};

const cellSx = {
  px: 1.5,
  py: 1.25,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

export default function MasterKaryawan() {
  const [karyawan, setKaryawan] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Pagination states matching ApprovedList
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    axios.get(`${API}/departments`)
      .then(r => setDepartments(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { includeInactive: includeInactive ? '1' : '' };
    if (search) params.search = search;
    if (filterDept) params.department = filterDept;
    axios.get(API, { params })
      .then(r => setKaryawan(r.data.data))
      .catch(() => setError('Gagal memuat data karyawan.'))
      .finally(() => setLoading(false));
  }, [search, filterDept, includeInactive]);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
  }, [search, filterDept, includeInactive]);

  const byDept = departments.reduce((acc, d) => {
    acc[d.department] = karyawan.filter(k => k.department === d.department).length;
    return acc;
  }, {});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const mainEl = document.querySelector('.dashboard-main');
    if (mainEl && !isMobile) {
      const originalOverflow = mainEl.style.overflow;
      mainEl.style.overflow = 'hidden';
      return () => { mainEl.style.overflow = originalOverflow; };
    }
  }, [isMobile]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(karyawan.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const indexOfLastRow = safePage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentKaryawan = karyawan.slice(indexOfFirstRow, indexOfLastRow);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterDept = (value) => {
    setFilterDept(value);
    setPage(1);
  };

  const handleFilterInactive = (value) => {
    setIncludeInactive(value === 'all');
    setPage(1);
  };

  const handleRowsPerPage = (value) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  // Native filter bar — matches ApprovedList headerAction pattern exactly
  const headerAction = (
    <div className="approval-filter-bar">
      <div className="approval-filter-bar__field">
        <span className="approval-filter-bar__field-icon">
          <SearchMd size={15} />
        </span>
        <input
          type="text"
          className="approval-filter-bar__input approval-filter-bar__input--search"
          placeholder="Cari nama, ID, jabatan..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="approval-filter-bar__field">
        <select
          className="approval-filter-bar__select"
          value={filterDept}
          onChange={(e) => handleFilterDept(e.target.value)}
        >
          <option value="">Semua Department</option>
          {departments.map(d => (
            <option key={d.department} value={d.department}>
              {d.department} ({byDept[d.department] || 0})
            </option>
          ))}
        </select>
        <span className="approval-filter-bar__field-icon approval-filter-bar__field-icon--right">
          <ChevronDown size={14} />
        </span>
      </div>

      <div className="approval-filter-bar__field">
        <select
          className="approval-filter-bar__select"
          value={includeInactive ? 'all' : 'active'}
          onChange={(e) => handleFilterInactive(e.target.value)}
        >
          <option value="active">Aktif saja</option>
          <option value="all">Semua (termasuk Inactive)</option>
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
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          <CardBigBox
            className="karyawan-main-panel"
            contentClassName="karyawan-main-panel__body"
            eyebrow="Data Karyawan"
            title="Master Karyawan"
            headerAction={headerAction}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : karyawan.length === 0 ? (
              <Box className="dashboard-empty-state">
                <p className="dashboard-empty-state__title">Tidak ada data ditemukan</p>
                <p className="dashboard-empty-state__detail">Coba ubah filter atau kata pencarian.</p>
              </Box>
            ) : isMobile ? (
              /* Mobile Card View */
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="dashboard-stack" style={{ flex: 1, minHeight: 0 }}>
                  {currentKaryawan.map((k, i) => (
                    <div key={i} className="dashboard-stack__item">
                      {/* Header Row */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, pr: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                            {k.fullName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={k.employeeId || k.internalId || '-'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }} />
                            <Chip label={`L${k.level}`} size="small" color={LEVEL_COLOR[k.level] || 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </Box>
                        <Chip
                          label={k.status}
                          size="small"
                          color={k.status === 'Active' ? 'success' : 'default'}
                          variant={k.status === 'Active' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.75rem', height: 22 }}
                        />
                      </Box>

                      <Divider sx={{ my: 1, borderColor: 'divider' }} />

                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Department</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">{k.department}</Typography>
                            <Chip label={k.kodeDivisi} size="small" color="primary" sx={{ height: 16, fontSize: '0.65rem', px: 0.5 }} />
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Jabatan</Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">{k.jobPosition || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">Job Level: {k.jobLevel}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Atasan (Head Of)</Typography>
                          <Typography variant="body2" color="text.primary">{k.headOf || '-'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                          {k.email ? (
                            <Typography
                              variant="caption"
                              component="a"
                              href={`mailto:${k.email}`}
                              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {k.email}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </div>
                  ))}
                </div>

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <Box className="karyawan-list-pagination" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, pt: 1.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Tampilkan</Typography>
                      <TextField
                        select
                        size="small"
                        value={rowsPerPage}
                        onChange={(e) => handleRowsPerPage(e.target.value)}
                        sx={{ width: 80 }}
                      >
                        {ROWS_OPTIONS.map((opt) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </TextField>
                      <Typography variant="body2" color="text.secondary">baris</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, karyawan.length)} dari {karyawan.length}
                      </Typography>
                      <IconButton size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                        <KeyboardArrowLeftIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                        <KeyboardArrowRightIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              /* Desktop Clean Table (No Horizontal Scroll) */
              <>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowX: 'hidden', // Completely prevent horizontal scrollbars on desktop container
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    scrollbarGutter: 'stable',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    width: '100%',
                  }}
                >
                  <Table
                    size="small"
                    stickyHeader
                    sx={{
                      width: '100%',
                      tableLayout: 'fixed', // Fixed layout makes sure columns fit exactly into 100% of container
                      '& .MuiTableCell-root': cellSx,
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '6%', fontWeight: 700 }}>No</TableCell>
                        <TableCell sx={{ width: '24%', fontWeight: 700 }}>Karyawan</TableCell>
                        <TableCell sx={{ width: '20%', fontWeight: 700 }}>Department & Divisi</TableCell>
                        <TableCell sx={{ width: '22%', fontWeight: 700 }}>Jabatan & Level</TableCell>
                        <TableCell sx={{ width: '18%', fontWeight: 700 }}>Atasan & Kontak</TableCell>
                        <TableCell sx={{ width: '10%', fontWeight: 700 }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentKaryawan.map((row, idx) => (
                        <TableRow hover key={row.id || idx}>
                          {/* 1. No */}
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                              {indexOfFirstRow + idx + 1}
                            </Typography>
                          </TableCell>

                          {/* 2. Karyawan (Nama & ID) */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Typography variant="body2" fontWeight={800} color="primary.main">
                                {row.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                ID: {row.employeeId || row.internalId || '-'}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* 3. Department & Divisi */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                              <Typography variant="body2" fontWeight={700}>
                                {row.department}
                              </Typography>
                              <Chip label={row.kodeDivisi} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
                            </Box>
                          </TableCell>

                          {/* 4. Jabatan & Level */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                              <Typography variant="body2" fontWeight={600} color="text.primary">
                                {row.jobPosition || '-'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">Job Lvl: {row.jobLevel}</Typography>
                                <Chip label={`L${row.level}`} size="small" color={LEVEL_COLOR[row.level] || 'default'} sx={{ height: 16, fontSize: '0.65rem', px: 0.5, fontWeight: 700 }} />
                              </Box>
                            </Box>
                          </TableCell>

                          {/* 5. Atasan & Kontak */}
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              <Typography variant="body2" color="text.primary">
                                <span style={{ color: 'var(--neutral-gray)', fontSize: '0.75rem' }}>Atasan:</span> {row.headOf || '-'}
                              </Typography>
                              {row.email ? (
                                <Typography
                                  variant="caption"
                                  component="a"
                                  href={`mailto:${row.email}`}
                                  sx={{
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    width: 'fit-content',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                >
                                  {row.email}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </Box>
                          </TableCell>

                          {/* 6. Status */}
                          <TableCell align="center">
                            <Chip
                              label={row.status}
                              size="small"
                              color={row.status === 'Active' ? 'success' : 'default'}
                              variant={row.status === 'Active' ? 'filled' : 'outlined'}
                              sx={{ fontSize: '0.75rem', height: 22, fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Desktop Pagination - Matches ApprovedList exactly */}
                <Box
                  className="karyawan-list-pagination"
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
                      {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, karyawan.length)} dari {karyawan.length}
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
    </Box>
  );
}
