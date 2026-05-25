import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Chip,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar, Divider,
  Collapse, IconButton, Tooltip,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';

const API = '/api/karyawan';

const DEPT_COLORS = {
  GEC: '#1565c0', HRD: '#6a1b9a', FIN: '#2e7d32', IT: '#00838f',
  PDT: '#e65100', MKT: '#ad1457', GST: '#4527a0', GSB: '#00695c',
  GTS: '#1b5e20', WGS: '#4e342e', WGT: '#37474f', LEG: '#880e4f',
  BOD: '#b71c1c', PKS: '#f57f17', PLK: '#0277bd',
};

const LEVEL_LABEL = {
  7: 'Commissioner', 6: 'Direktur', 5: 'Senior Manager',
  4: 'Manager', 3: 'Ass. Manager', 2: 'Supervisor', 1: 'Staff',
};

function DeptCard({ dept, karyawan }) {
  const [expanded, setExpanded] = useState(false);
  const color = DEPT_COLORS[dept.kodeDivisi] || '#1565c0';

  const managers = karyawan.filter(k => k.level >= 4);
  const supervisors = karyawan.filter(k => k.level === 2 || k.level === 3);
  const staff = karyawan.filter(k => k.level <= 1);

  const byLevel = [
    { label: 'Manager ke atas', list: managers, color: 'error' },
    { label: 'Supervisor / Ass. Manager', list: supervisors, color: 'warning' },
    { label: 'Staff / Ops', list: staff, color: 'default' },
  ].filter(g => g.list.length > 0);

  return (
    <Card sx={{ height: '100%', border: `2px solid ${color}20` }}>
      {/* Header */}
      <Box sx={{ bgcolor: color, px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
          <ApartmentIcon sx={{ color: 'white' }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} color="white">
            {dept.department}
          </Typography>
          <Chip
            label={dept.kodeDivisi}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: 11 }}
          />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight={700} color="white">{karyawan.length}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>karyawan</Typography>
        </Box>
      </Box>

      <CardContent sx={{ pt: 2, pb: '8px !important' }}>
        {/* Ringkasan level */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          {managers.length > 0 && (
            <Chip label={`${managers.length} Manager+`} size="small" color="error" variant="outlined" />
          )}
          {supervisors.length > 0 && (
            <Chip label={`${supervisors.length} Supervisor`} size="small" color="warning" variant="outlined" />
          )}
          {staff.length > 0 && (
            <Chip label={`${staff.length} Staff`} size="small" variant="outlined" />
          )}
        </Box>

        {/* Manajer */}
        {managers.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              PIMPINAN
            </Typography>
            {managers.map((m, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <PersonIcon fontSize="small" sx={{ color: color, opacity: 0.8 }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>{m.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.jobLevel} · {m.jobPosition || '-'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Tombol expand */}
        {karyawan.length > managers.length && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setExpanded(!expanded)}
            >
              <Typography variant="caption" color="primary" fontWeight={600}>
                {expanded ? 'Sembunyikan' : `Lihat semua ${karyawan.length} karyawan`}
              </Typography>
              <IconButton size="small">
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
          </>
        )}

        {/* Expanded: tabel lengkap */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            {byLevel.map(group => (
              <Box key={group.label} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {group.label} ({group.list.length})
                </Typography>
                <TableContainer component={Paper} elevation={0}
                  sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ py: 0.5 }}>Nama</TableCell>
                        <TableCell sx={{ py: 0.5 }}>ID</TableCell>
                        <TableCell sx={{ py: 0.5 }}>Jabatan</TableCell>
                        <TableCell sx={{ py: 0.5 }}>Atasan</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.list.map((k, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ py: 0.75 }}>
                            <Typography variant="body2" fontWeight={500}>{k.fullName}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Chip label={k.employeeId || k.internalId || '-'}
                              size="small" variant="outlined" sx={{ fontSize: 10 }} />
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Typography variant="caption" color="text.secondary">
                              {k.jobPosition || k.jobLevel || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <Typography variant="caption" color="text.secondary">
                              {k.headOf || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function Departemen() {
  const [departments, setDepartments] = useState([]);
  const [allKaryawan, setAllKaryawan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/departments`),
      axios.get(API, { params: { includeInactive: '1' } }),
    ])
      .then(([dRes, kRes]) => {
        setDepartments(dRes.data.data);
        setAllKaryawan(kRes.data.data);
      })
      .catch(() => setError('Gagal memuat data. Pastikan server backend berjalan.'))
      .finally(() => setLoading(false));
  }, []);

  const totalAktif = allKaryawan.filter(k => k.status === 'Active').length;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="xl">

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Ringkasan stat */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {departments.map(dept => {
                const count = allKaryawan.filter(k => k.department === dept.department && k.status === 'Active').length;
                const color = DEPT_COLORS[dept.kodeDivisi] || '#1565c0';
                return (
                  <Grid item xs={6} sm={4} md={2} key={dept.kodeDivisi}>
                    <Box sx={{
                      border: `2px solid ${color}`,
                      borderRadius: 2, p: 1.5, textAlign: 'center',
                      bgcolor: `${color}08`,
                    }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color }}>
                        {count}
                      </Typography>
                      <Chip label={dept.kodeDivisi} size="small"
                        sx={{ bgcolor: color, color: 'white', fontWeight: 700, fontSize: 10, mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary"
                        display="block" sx={{ fontSize: 10, lineHeight: 1.3 }}>
                        {dept.department}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Cards per department */}
            <Grid container spacing={3}>
              {departments.map(dept => {
                const karyawan = allKaryawan.filter(
                  k => k.department === dept.department && k.status === 'Active'
                );
                return (
                  <Grid item xs={12} sm={6} lg={4} key={dept.department}>
                    <DeptCard dept={dept} karyawan={karyawan} />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}
