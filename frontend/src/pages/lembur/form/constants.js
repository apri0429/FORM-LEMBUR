export const API              = '/api/overtime';
export const API_KARYAWAN     = '/api/employees';
export const API_SUPERVISORS  = '/api/employees/managers';
export const API_APPROVAL_CHAIN = '/api/employees/approval-chain';

export const LEMBUR_PADA_OPTIONS = [
  { value: 'Hari Libur', label: 'Holiday' },
  { value: 'Hari Kerja', label: 'Workday' },
];
export const KOMPENSASI_PRESETS  = ['1 Day Off', 'Half Day Off'];

export const FORM_TYPE_OPTIONS = [
  { value: 'manager',      label: 'Manager' },
  { value: 'staff',        label: 'Staff' },
  { value: 'outsourcing',  label: 'Outsourcing' },
  { value: 'harian_lepas', label: 'Daily Worker' },
];

export const OPEN_FORM_TYPES  = ['outsourcing', 'harian_lepas'];
export const BOD_KEYWORDS     = ['director', 'commissioner', 'komisaris', 'president director'];
export const MANAGER_KEYWORDS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

export const rootSx = {
  width: '100%',
  height: { xs: 'auto', md: '100%' },
  minHeight: { xs: 'unset', md: 0 },
  display: 'flex', flexDirection: 'column',
  overflow: { xs: 'visible', md: 'hidden' },
  '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
  '@keyframes pop':    { '0%': { opacity: 0, transform: 'scale(.88)' }, '60%': { transform: 'scale(1.03)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
  '@keyframes drain':  { from: { width: '100%' }, to: { width: '0%' } },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#eef2f6',
    borderRadius: '22px !important',
    boxShadow: 'none !important',
    minHeight: { xs: 52, sm: 48 }, height: { xs: 52, sm: 48 },
    fontSize: { xs: '0.92rem', sm: '0.875rem' },
    transition: 'box-shadow .18s, background-color .18s',
    alignItems: 'center', boxSizing: 'border-box',
    '& fieldset': {
      borderRadius: '22px !important',
      border: '1.5px solid rgba(26,42,87,0.11) !important',
    },
    '&:hover': { backgroundColor: '#e7edf4' },
    '&:hover fieldset': { borderColor: 'rgba(42,157,143,0.45) !important' },
    '&.Mui-focused': { backgroundColor: '#fff', boxShadow: '0 0 0 3px rgba(42,157,143,0.14) !important' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(42,157,143,0.6) !important', borderWidth: '1.5px !important' },
    '&.Mui-disabled': { backgroundColor: 'rgba(15,23,42,0.04)', '& fieldset': { borderColor: 'rgba(15,23,42,0.07) !important' } },
    '&.Mui-error fieldset': { borderColor: '#ef4444 !important', borderWidth: '1.5px !important' },
    '&.Mui-error:hover fieldset': { borderColor: '#dc2626 !important' },
    '&:not(.Mui-error):not(.Mui-focused):not(.Mui-disabled):hover fieldset': { borderColor: 'rgba(42,157,143,0.45) !important' },
  },
  '& .MuiInputLabel-root': { color: '#64748b', fontWeight: 500, fontSize: { xs: '0.86rem', sm: '0.82rem' }, transform: 'translate(16px,14px) scale(1)' },
  '& .MuiInputLabel-root.MuiInputLabel-shrink': { transform: 'translate(16px,-6px) scale(0.75)', fontWeight: 700, color: '#1a2a57' },
  '& .MuiFormLabel-asterisk': { display: 'none !important' },
  '& .MuiInputBase-input': { height: '1.25em', py: '0 !important', px: '4px', display: 'flex', alignItems: 'center' },
  '& .MuiOutlinedInput-input': { pl: '16px !important', pr: '16px !important' },
  '& .MuiAutocomplete-inputRoot': { pr: '40px !important', pl: '16px !important', py: '0 !important' },
  '& .MuiAutocomplete-inputRoot .MuiInputBase-input': { height: '1.25em', py: '0 !important', px: '0 !important', minWidth: '0 !important' },
  '& .MuiAutocomplete-endAdornment': { right: 12 },
  '& .MuiFormControl-root': { position: 'relative' },
  '& .MuiInputAdornment-root': { alignSelf: 'center', mt: '0 !important' },
  '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1 },
  '& .MuiFormHelperText-root': {
    mx: 0, mt: '2px', fontSize: '0.68rem',
    position: 'absolute', bottom: '-18px', left: 0,
  },
  '& .MuiFormHelperText-root.Mui-error': {
    top: '-9px',
    right: '14px',
    bottom: 'auto',
    left: 'auto',
    zIndex: 4,
    mt: 0,
    px: '6px',
    py: '1px',
    borderRadius: '999px',
    backgroundColor: '#fff',
    color: '#dc2626',
    fontSize: '0.65rem',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    pointerEvents: 'none',
    boxShadow: '0 0 0 2px #fff',
  },
  '& .MuiSelect-select': { height: '1.25em', py: '0 !important', pl: '16px !important', display: 'flex', alignItems: 'center' },
  '& .MuiSelect-icon': { right: 12 },
};

export const cardPanelSx = {
  border: '1px solid rgba(26,42,87,0.1)',
  borderRadius: '14px',
  bgcolor: '#fff',
  boxShadow: '0 2px 8px rgba(26,42,87,0.07),0 1px 2px rgba(15,23,42,0.04)',
};
