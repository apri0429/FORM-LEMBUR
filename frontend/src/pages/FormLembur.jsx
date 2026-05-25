import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CardBigBox from '../components/cardbox/CardBigBox';
import CardBox from '../components/cardbox/CardBox';
import { useAuth } from '../context/AuthContext';

const API = '/api/lembur';
const API_KARYAWAN = '/api/karyawan';

const LEMBUR_PADA_OPTIONS = ['Hari Libur', 'Hari Kerja'];

const STAFF_SUPERVISOR_KEYWORDS = ['supervisor', 'ass. manager', 'manager'];
const FORM_TYPE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'outsourcing', label: 'Outsourcing' },
  { value: 'harian_lepas', label: 'Harian Lepas' },
];

const OPEN_FORM_TYPES = ['outsourcing', 'harian_lepas'];

const MANAGER_LEVEL_KEYWORDS = ['manager', 'senior manager', 'ass. manager', 'director', 'commissioner', 'president director'];
const BOD_LEVEL_KEYWORDS = ['director', 'commissioner', 'komisaris', 'president director'];

const emptyEntry = () => ({
  internalId: null,
  nama: '',
  idKaryawan: '',
  tanggalLembur: '',
  jamMulai: '',
  jamSelesai: '',
  tugas: '',
  hasil: '',
  kompensasi: '',
  approval: 0,
});

const MONTH_INDEX = {
  jan: 1,
  januari: 1,
  feb: 2,
  februari: 2,
  mar: 3,
  maret: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  jul: 7,
  juli: 7,
  agu: 8,
  agustus: 8,
  aug: 8,
  sep: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  des: 12,
  desember: 12,
  dec: 12,
  december: 12,
};

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function isValidDateParts(year, month, day) {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  );
}

function toIsoDate(value) {
  if (!value) return '';

  const text = String(value).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (isoMatch) {
    const [, yearText, monthText, dayText] = isoMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    return isValidDateParts(year, month, day) ? text : '';
  }

  const numericMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (numericMatch) {
    const [, dayText, monthText, yearText] = numericMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    return isValidDateParts(year, month, day)
      ? `${year}-${padDatePart(month)}-${padDatePart(day)}`
      : '';
  }

  const parts = text
    .replace(/,/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ');

  if (parts.length >= 3) {
    const day = Number(parts[0]);
    const monthToken = parts[1].toLowerCase().replace(/\.$/, '');
    const month = Number(monthToken) || MONTH_INDEX[monthToken];
    const year = Number(parts[2]);

    if (isValidDateParts(year, month, day)) {
      return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
    }
  }

  return '';
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const isoDate = toIsoDate(dateStr);
  if (!isoDate) return dateStr;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day)).replace(/ /g, '-');
}

function hasJobLevelKeyword(jobLevel, keywords) {
  const normalizedJobLevel = String(jobLevel || '').toLowerCase();
  return keywords.some((keyword) => normalizedJobLevel.includes(keyword));
}

function getDepartmentOptionValue(department) {
  return String(department?.departmentId ?? department?.id ?? department?.department ?? '');
}

function findSelectedDepartment(departments, form) {
  if (!departments.length) return null;

  if (form.departmentId) {
    return departments.find(
      (department) => getDepartmentOptionValue(department) === String(form.departmentId)
    ) || null;
  }

  const sameDepartment = departments.filter(
    (department) => department.department === form.department
  );

  return sameDepartment.find((department) => department.class === form.class)
    || sameDepartment.find((department) => department.kodeDivisi === form.kodeDivisi)
    || sameDepartment[0]
    || null;
}

function getUniqueDepartmentNames(departments) {
  return Array.from(new Set(
    departments
      .map((department) => department.department || department.name)
      .filter(Boolean)
  ));
}

const formPageSx = {
  width: '100%',
  '& .MuiOutlinedInput-root': {
    bgcolor: '#f4f6f8',
    borderRadius: 1,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    '& fieldset': {
      borderColor: '#dbe3ed',
    },
    '&:hover': {
      bgcolor: '#eef2f6',
    },
    '&:hover fieldset': {
      borderColor: '#b8c6d8',
    },
    '&.Mui-focused': {
      bgcolor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(31, 78, 140, 0.12)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1f4e8c',
      borderWidth: 1,
    },
    '&.Mui-disabled': {
      bgcolor: '#eef1f5',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#7b8ca4',
    opacity: 1,
  },
};

const calendarAdornment = (
  <InputAdornment position="end">
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        bgcolor: '#e7eef7',
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
    </Box>
  </InputAdornment>
);

const timeAdornment = (
  <InputAdornment position="end">
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        bgcolor: 'rgba(244, 169, 64, 0.16)',
        color: '#a95f00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
    </Box>
  </InputAdornment>
);

function CalendarDateField({ label, value, onChange, error, helperText }) {
  const inputRef = useRef(null);
  const inputValue = toIsoDate(value);
  const displayValue = inputValue ? formatDateDisplay(inputValue) : '';

  const openDatePicker = () => {
    const input = inputRef.current;
    if (!input) return;

    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        value={displayValue}
        placeholder="Pilih tanggal"
        error={error}
        helperText={helperText}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          readOnly: true,
          endAdornment: calendarAdornment,
        }}
        inputProps={{ role: 'button' }}
        onClick={openDatePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDatePicker();
          }
        }}
      />
      <Box
        component="input"
        ref={inputRef}
        type="date"
        value={inputValue}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          position: 'absolute',
          left: 12,
          bottom: 8,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

function TimeField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [inputType, setInputType] = useState(value ? 'time' : 'text');

  useEffect(() => {
    if (value) {
      setInputType('time');
    } else if (document.activeElement !== inputRef.current) {
      setInputType('text');
    }
  }, [value]);

  const openTimePicker = () => {
    setInputType('time');
    setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        } else {
          input.focus();
          input.click();
        }
      } catch {
        input.focus();
      }
    }, 10);
  };

  const handleBlur = () => {
    if (!value) {
      setInputType('text');
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      type={inputType}
      value={value}
      placeholder="--:--"
      inputRef={inputRef}
      InputLabelProps={{ shrink: true }}
      InputProps={{ endAdornment: timeAdornment }}
      onFocus={() => setInputType('time')}
      onBlur={handleBlur}
      onClick={openTimePicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTimePicker();
        }
      }}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        '& input[type="time"]::-webkit-calendar-picker-indicator': {
          display: 'none',
        },
      }}
    />
  );
}

export default function FormLembur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const isAdmin = user?.role === 'admin'
    || user?.department === 'IT'
    || user?.department === 'Board Of Director'
    || BOD_LEVEL_KEYWORDS.some((k) => String(user?.jobLevel || '').toLowerCase().includes(k));

  const isKoordinator = String(user?.jobLevel || '').toLowerCase().includes('koordinator')
    || String(user?.jobPosition || '').toLowerCase().includes('koordinator');
  const isManagerOrSpv = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'lead', 'ass. manager', 'senior manager', 'director'].some((k) => String(user?.jobLevel || '').toLowerCase().includes(k));

  const availableFormTypes = FORM_TYPE_OPTIONS.filter((option) => {
    if (isAdmin || isKoordinator) return true;
    return option.value === 'manager' || option.value === 'staff';
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [departments, setDepartments] = useState([]);
  const [karyawanOptions, setKaryawanOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [bodOptions, setBodOptions] = useState([]);
  const [approvalChain, setApprovalChain] = useState([]);

  const [form, setForm] = useState({
    formType: 'staff',
    departmentId: '',
    department: '',
    class: '',
    kodeDivisi: '',
    lemburPada: 'Hari Libur',
    tanggalPengajuan: '',
    diperintahOleh: '',
    entries: [emptyEntry()],
  });

  // Auto-set divisi dari data user untuk non-admin saat buat form baru
  useEffect(() => {
    if (isEdit || isAdmin || !user?.department) return;
    setForm((prev) => ({
      ...prev,
      departmentId: user.departmentId ? String(user.departmentId) : '',
      department: user.department || '',
      class: user.class || user.departmentClass || '',
      kodeDivisi: user.kodeDivisi || '',
    }));
  }, [user, isEdit, isAdmin]);

  useEffect(() => {
    axios.get(`${API_KARYAWAN}/departments`)
      .then((response) => setDepartments(response.data.data))
      .catch(() => {});

    axios.get(API_KARYAWAN)
      .then((response) => {
        const allKaryawan = response.data.data;
        setBodOptions(allKaryawan.filter((karyawan) =>
          karyawan.department === 'Board Of Director'
          || hasJobLevelKeyword(karyawan.jobLevel, BOD_LEVEL_KEYWORDS)
        ));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.departmentId && (!form.department || !form.class)) {
      setKaryawanOptions([]);
      setSupervisorOptions([]);
      return;
    }

    const params = form.departmentId
      ? { departmentId: form.departmentId }
      : { department: form.department, departmentClass: form.class };

    axios.get(API_KARYAWAN, { params })
      .then((response) => {
        const options = response.data.data;
        setKaryawanOptions(options);
        setSupervisorOptions(options.filter((karyawan) => karyawan.level >= 2));
      })
      .catch(() => {});
  }, [form.department, form.departmentId, form.class]);

  useEffect(() => {
    if (!form.diperintahOleh) {
      setApprovalChain([]);
      return;
    }

    axios.get(`${API_KARYAWAN}/approval-chain`, { params: { nama: form.diperintahOleh } })
      .then((response) => setApprovalChain(response.data.data))
      .catch(() => {});
  }, [form.diperintahOleh]);

  useEffect(() => {
    if (!isEdit) return;

    setLoading(true);
    axios.get(`${API}/${id}`)
      .then((response) => {
        const data = response.data.data;
        setForm({
          formType: data.formType || 'staff',
          ...data,
          departmentId: data.departmentId ? String(data.departmentId) : '',
          entries: data.entries?.length ? data.entries : [emptyEntry()],
        });
      })
      .catch(() => setError('Gagal memuat data form.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!departments.length || !form.department || form.departmentId || (!form.class && !form.kodeDivisi)) return;

    const selected = findSelectedDepartment(departments, form);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      departmentId: getDepartmentOptionValue(selected),
      department: selected.department,
      class: selected.class || '',
      kodeDivisi: selected.kodeDivisi || '',
    }));
  }, [departments, form.department, form.departmentId, form.class, form.kodeDivisi]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (departmentName) => {
    const matchingDepartments = departments.filter(
      (item) => item.department === departmentName
    );
    const autoSelected = matchingDepartments.length === 1 ? matchingDepartments[0] : null;

    setForm((prev) => ({
      ...prev,
      departmentId: autoSelected ? getDepartmentOptionValue(autoSelected) : '',
      department: departmentName,
      class: autoSelected?.class || '',
      kodeDivisi: autoSelected?.kodeDivisi || '',
      diperintahOleh: '',
      entries: [emptyEntry()],
    }));
  };

  const handleClassChange = (classValue) => {
    const found = departments.find(
      (item) => item.department === form.department && item.class === classValue
    );

    setForm((prev) => ({
      ...prev,
      departmentId: found ? getDepartmentOptionValue(found) : '',
      class: classValue,
      kodeDivisi: found?.kodeDivisi || '',
      diperintahOleh: '',
      entries: [emptyEntry()],
    }));
  };

  const handleFormTypeChange = (formType) => {
    const isOpen = OPEN_FORM_TYPES.includes(formType);
    setForm((prev) => ({
      ...prev,
      formType,
      // non-admin: buka divisi untuk outsourcing/harian lepas, kunci kembali untuk staff/manager
      ...(!isAdmin && isOpen ? {
        departmentId: '',
        department: '',
        class: '',
        kodeDivisi: '',
      } : !isAdmin && !isOpen ? {
        departmentId: user?.departmentId ? String(user.departmentId) : '',
        department: user?.department || '',
        class: user?.class || user?.departmentClass || '',
        kodeDivisi: user?.kodeDivisi || '',
      } : {}),
      diperintahOleh: '',
      entries: [emptyEntry()],
    }));
    setApprovalChain([]);
  };

  const handleDiperintahChange = (nama) => {
    setField('diperintahOleh', nama);
    const found = [...karyawanOptions, ...bodOptions].find((item) => item.fullName === nama);
    setField('diperintahOlehJobLevel', found?.jobLevel || '');
    setField('diperintahOlehJobPosition', found?.jobPosition || '');
  };

  const setEntry = (index, field, value) => {
    setForm((prev) => {
      const entries = [...prev.entries];
      entries[index] = { ...entries[index], [field]: value };
      return { ...prev, entries };
    });
  };

  const handleSelectKaryawan = (index, karyawan) => {
    if (!karyawan) return;

    setForm((prev) => {
      const entries = [...prev.entries];
      entries[index] = {
        ...entries[index],
        nama: karyawan.fullName,
        idKaryawan: karyawan.employeeId || karyawan.internalId || '',
      };
      return { ...prev, entries };
    });
  };

  const addEntry = () => {
    setForm((prev) => ({ ...prev, entries: [...prev.entries, emptyEntry()] }));
  };

  const removeEntry = (index) => {
    setForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((_, idx) => idx !== index),
    }));
  };

  const duplicateEntry = (index) => {
    setForm((prev) => {
      const entries = [...prev.entries];
      const clone = { ...entries[index], internalId: null, approval: 0 };
      entries.splice(index + 1, 0, clone);
      return { ...prev, entries };
    });
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setError('');

    const newErrors = {};
    const missingTopFields = [];

    if (!form.department) {
      newErrors.department = 'Divisi harus dipilih';
      missingTopFields.push('Divisi');
    }
    if (!form.class) {
      newErrors.class = 'Class harus dipilih';
      missingTopFields.push('Class');
    }
    if (!form.tanggalPengajuan) {
      newErrors.tanggalPengajuan = 'Tanggal Pengajuan harus diisi';
      missingTopFields.push('Tanggal Pengajuan');
    }
    if (!form.diperintahOleh) {
      newErrors.diperintahOleh = 'Diperintah Oleh harus dipilih';
      missingTopFields.push('Diperintah Oleh');
    }

    const entriesErrors = [];
    let hasEntryError = false;

    form.entries.forEach((entry, idx) => {
      const entryErr = {};
      if (!entry.nama) {
        entryErr.nama = 'Nama harus diisi';
        hasEntryError = true;
      }
      if (!entry.tanggalLembur) {
        entryErr.tanggalLembur = 'Tanggal harus diisi';
        hasEntryError = true;
      }
      entriesErrors[idx] = entryErr;
    });

    if (missingTopFields.length > 0 || hasEntryError) {
      setFieldErrors({
        ...newErrors,
        entries: hasEntryError ? entriesErrors : [],
      });

      const errorParts = [];
      if (missingTopFields.length > 0) {
        errorParts.push(`Harap lengkapi: ${missingTopFields.join(', ')}.`);
      }
      if (hasEntryError) {
        errorParts.push('Harap lengkapi Nama dan Tanggal pada semua detail lembur.');
      }

      setError(errorParts.join(' '));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        tanggalPengajuan: formatDateDisplay(form.tanggalPengajuan) || form.tanggalPengajuan,
      };

      if (isEdit) {
        await axios.put(`${API}/${id}`, payload);
        setSuccess('Form berhasil diperbarui.');
      } else {
        await axios.post(API, payload);
        setSuccess('Form berhasil dibuat.');
      }

      setTimeout(() => navigate('/'), 1200);
    } catch {
      setError('Gagal menyimpan form. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedFormType = FORM_TYPE_OPTIONS.find((option) => option.value === form.formType) || FORM_TYPE_OPTIONS[1];
  const departmentNameOptions = getUniqueDepartmentNames(departments);
  const selectedDepartment = findSelectedDepartment(departments, form);
  const selectedDepartmentName = form.department || selectedDepartment?.department || '';
  const classOptions = departments.filter(
    (department) => department.department === selectedDepartmentName
  );
  const isDepartmentReady = Boolean(form.department && form.class);
  const filteredSupervisorOptions = (() => {
    if (form.formType === 'manager') {
      return bodOptions;
    }

    if (form.formType === 'staff') {
      // For staff form, show only Supervisor, Ass. Manager, Manager
      return supervisorOptions.filter((karyawan) =>
        hasJobLevelKeyword(karyawan.jobLevel, STAFF_SUPERVISOR_KEYWORDS)
      );
    }

    // For outsourcing, show all supervisors
    return supervisorOptions;
  })();
  const selectedDiperintahPerson = filteredSupervisorOptions.find((k) => k.fullName === form.diperintahOleh);
  const filteredKaryawanOptions = karyawanOptions.filter((karyawan) => {
    const employeeId = String(karyawan.employeeId || '').toUpperCase();

    if (form.formType === 'outsourcing') {
      return employeeId.startsWith('MPP');
    }

    if (form.formType === 'harian_lepas') {
      return employeeId.startsWith('HLP') || employeeId.startsWith('HL');
    }

    if (form.formType === 'manager') {
      return hasJobLevelKeyword(karyawan.jobLevel, MANAGER_LEVEL_KEYWORDS);
    }

    return !employeeId.startsWith('MPP') && !hasJobLevelKeyword(karyawan.jobLevel, MANAGER_LEVEL_KEYWORDS);
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Container disableGutters maxWidth={false} sx={{ width: '100%' }}>
        <Box className="dashboard-content" sx={formPageSx}>
        <CardBigBox
          eyebrow="Informasi Utama"
          title={`Form Lembur ${selectedFormType.label}`}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <Alert severity="info" sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Panduan Pengisian Form Lembur:</Typography>
            {!isDepartmentReady ? (
              <Box component="span">
                {!form.department
                  ? 'Silakan pastikan Jenis Form dan Divisi sudah sesuai.'
                  : 'Silakan pilih Class untuk melanjutkan.'}
              </Box>
            ) : (
              <Box component="span">
                Silakan lengkapi bagian <b>Detail Lembur</b> di bawah. Pastikan seluruh kolom dengan tanda bintang (*) telah terisi.
              </Box>
            )}
          </Alert>
          <Grid container spacing={2.5} alignItems="flex-start">

            {/* Baris 1: Jenis Form | Divisi | Class */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                label="Jenis Form *"
                value={form.formType}
                onChange={(event) => handleFormTypeChange(event.target.value)}
              >
                {availableFormTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                options={departmentNameOptions}
                value={selectedDepartmentName || null}
                onChange={(_, value) => handleDepartmentChange(value || '')}
                disabled={!isAdmin && !OPEN_FORM_TYPES.includes(form.formType)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Divisi *"
                    placeholder="Cari atau pilih divisi..."
                    error={Boolean(fieldErrors.department)}
                    helperText={fieldErrors.department || (!isAdmin && !OPEN_FORM_TYPES.includes(form.formType) ? 'Terkunci pada divisi Anda' : '')}
                  />
                )}
                noOptionsText="Divisi tidak ditemukan"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                options={classOptions}
                getOptionLabel={(option) => option.class || ''}
                isOptionEqualToValue={(option, value) => option.class === value.class}
                value={classOptions.find((d) => d.class === form.class) || null}
                onChange={(_, value) => handleClassChange(value?.class || '')}
                disabled={!form.department || (!isAdmin && !OPEN_FORM_TYPES.includes(form.formType))}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={option.kodeDivisi}
                        size="small"
                        color="primary"
                        sx={{ fontSize: 11, height: 20, flexShrink: 0 }}
                      />
                      <Typography variant="body2">{option.class}</Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Class *"
                    placeholder={form.department ? 'Cari atau pilih class...' : ''}
                    error={Boolean(fieldErrors.class)}
                    helperText={fieldErrors.class || (!form.department ? 'Pilih Divisi terlebih dahulu' : '')}
                  />
                )}
                noOptionsText="Class tidak ditemukan"
              />
            </Grid>

            {/* Baris 2: Kode Div | Lembur Pada | Tanggal Pengajuan */}
            <Grid item xs={6} sm={4} md={4}>
              <TextField
                fullWidth
                label="Kode Divisi"
                value={form.kodeDivisi}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                placeholder="—"
              />
            </Grid>

            <Grid item xs={6} sm={4} md={4}>
              <TextField
                fullWidth
                select
                label="Lembur Pada *"
                value={form.lemburPada}
                onChange={(event) => setField('lemburPada', event.target.value)}
              >
                {LEMBUR_PADA_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <CalendarDateField
                label="Tanggal Pengajuan *"
                value={form.tanggalPengajuan}
                onChange={(value) => setField('tanggalPengajuan', value)}
                error={Boolean(fieldErrors.tanggalPengajuan)}
                helperText={fieldErrors.tanggalPengajuan || ''}
              />
            </Grid>

            {/* Baris 3: Diperintah Oleh */}
            <Grid item xs={12}>
              <Autocomplete
                options={filteredSupervisorOptions.map((karyawan) => karyawan.fullName)}
                value={form.diperintahOleh || null}
                onChange={(_, value) => handleDiperintahChange(value || '')}
                disabled={!isDepartmentReady}
                renderOption={(props, option) => {
                  const person = filteredSupervisorOptions.find((karyawan) => karyawan.fullName === option);
                  return (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option}</Typography>
                        {person?.jobPosition && (
                          <Typography variant="caption" color="text.secondary">
                            {person.jobLevel} — {person.jobPosition}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Diperintah Oleh *"
                    placeholder={isDepartmentReady ? 'Cari atau pilih atasan...' : ''}
                    error={Boolean(fieldErrors.diperintahOleh)}
                    helperText={
                      fieldErrors.diperintahOleh || (
                        !form.department
                          ? 'Pilih Divisi terlebih dahulu'
                          : !form.class
                            ? 'Pilih Class terlebih dahulu'
                            : ''
                      )
                    }
                  />
                )}
              />
            </Grid>

          </Grid>
        </CardBigBox>

        <CardBigBox
          eyebrow="Detail Lembur"
          title={`Detail Lembur ${selectedFormType.label}`}
          footer={
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 2 },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                pt: 2,
                mt: 1,
                borderTop: '1px solid rgba(26,42,87,0.08)',
              }}
            >
              <Button
                variant="outlined"
                size="large"
                startIcon={<AddIcon />}
                onClick={addEntry}
                sx={{ borderStyle: 'dashed', px: 3 }}
              >
                Tambah Karyawan
              </Button>
              <Box sx={{
                display: 'flex',
                gap: 1.5,
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/')}
                >
                  Kembali
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Kirim Pengajuan'}
                </Button>
              </Box>
            </Box>
          }
        >
            {form.entries.map((entry, index) => {
              const entryErr = fieldErrors.entries?.[index] || {};
              return (
              <Box
                key={index}
                sx={{
                  mb: index < form.entries.length - 1 ? 2.5 : 0,
                  p: { xs: 2, md: 3 },
                  border: '1px solid',
                  borderColor: 'rgba(26,42,87,0.10)',
                  borderRadius: 2,
                  bgcolor: index % 2 === 0 ? 'rgba(248,250,252,0.8)' : '#fff',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 4px 16px rgba(26,42,87,0.08)' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a2a57 0%, #2a9d8f 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.dark" letterSpacing={0.2}>
                      Karyawan {index + 1}
                    </Typography>
                    {entry.nama && (
                      <Chip label={entry.nama} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Duplikat">
                      <IconButton size="small" onClick={() => duplicateEntry(index)} sx={{ color: 'primary.main' }}>
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEntry(index)}
                          disabled={form.entries.length === 1}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      options={filteredKaryawanOptions}
                      getOptionLabel={(option) => option.fullName}
                      value={filteredKaryawanOptions.find((item) => item.fullName === entry.nama) || null}
                      onChange={(_, value) => (
                        value ? handleSelectKaryawan(index, value) : setEntry(index, 'nama', '')
                      )}
                      disabled={!isDepartmentReady}
                      freeSolo
                      onInputChange={(_, value) => setEntry(index, 'nama', value)}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{option.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.employeeId} · {option.jobPosition}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nama Karyawan *"
                          placeholder={isDepartmentReady ? 'Cari nama karyawan...' : 'Pilih divisi dan class dulu'}
                          error={Boolean(entryErr.nama)}
                          helperText={entryErr.nama || ''}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonSearchIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                      noOptionsText={isDepartmentReady ? `Tidak ada ${selectedFormType.label.toLowerCase()} di divisi ini` : 'Pilih divisi dan class dulu'}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ID Karyawan"
                      value={entry.idKaryawan}
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      placeholder="—"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <CalendarDateField
                      label="Tanggal Lembur *"
                      value={entry.tanggalLembur}
                      onChange={(value) => setEntry(index, 'tanggalLembur', value)}
                      error={Boolean(entryErr.tanggalLembur)}
                      helperText={entryErr.tanggalLembur || ''}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <TimeField
                      label="Jam Mulai"
                      value={entry.jamMulai}
                      onChange={(value) => setEntry(index, 'jamMulai', value)}
                    />
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <TimeField
                      label="Jam Selesai"
                      value={entry.jamSelesai}
                      onChange={(value) => setEntry(index, 'jamSelesai', value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tugas / Pekerjaan"
                      value={entry.tugas}
                      onChange={(event) => setEntry(index, 'tugas', event.target.value)}
                      multiline
                      minRows={2}
                      placeholder="Deskripsi tugas lembur..."
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hasil"
                      value={entry.hasil}
                      onChange={(event) => setEntry(index, 'hasil', event.target.value)}
                      multiline
                      minRows={2}
                      placeholder="Hasil pekerjaan lembur..."
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Kompensasi"
                      value={entry.kompensasi}
                      placeholder="Nominal / bentuk kompensasi..."
                      onChange={(event) => setEntry(index, 'kompensasi', event.target.value)}
                      error={Boolean(entryErr.kompensasi)}
                      helperText={entryErr.kompensasi || ''}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </CardBigBox>
      </Box>
    </Container>
  </Box>
  );
}
