import React, { useRef, useState } from 'react';
import { Box, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import AccessTimeRoundedIcon  from '@mui/icons-material/AccessTimeRounded';
import BlockRoundedIcon        from '@mui/icons-material/BlockRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';

export function LockedField({ locked = true, permanent = false, children }) {
  const boxRef = useRef(null);
  const [pos, setPos] = useState(null);

  const handleMove = (e) => {
    if (!locked) return;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Box
      ref={boxRef}
      sx={{
        position: 'relative',
        ...(permanent && {
          '& .MuiInputBase-root': {
            backgroundColor: 'rgba(0,0,0,0.04)',
            cursor: 'default',
            pointerEvents: 'none',
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.23)',
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0,0,0,0.23)',
            borderWidth: '1px',
          },
          '& input': { cursor: 'default' },
        }),
        ...(locked && pos && {
          '& .MuiInputBase-root': { backgroundColor: 'rgba(220,38,38,0.07)' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(220,38,38,0.45) !important' },
        }),
      }}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {locked && pos && (
        <Box sx={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          transform: 'translate(8px, -50%)',
          zIndex: 3,
          pointerEvents: 'none',
          lineHeight: 0,
          '@media (hover: none)': { display: 'none' },
        }}>
          <BlockRoundedIcon sx={{ fontSize: 18, color: '#dc2626' }} />
        </Box>
      )}
    </Box>
  );
}
import { toIso, dispDate } from './helpers';
import { KOMPENSASI_PRESETS } from './constants';

export function DateField({ label, value, onChange, error, helperText, required }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const iso = toIso(value);
  return (
    <Box sx={{ position: 'relative' }} onClick={() => { try { ref.current?.showPicker?.(); } catch {} }}>
      <TextField fullWidth required={required} label={label} value={iso ? dispDate(iso) : ''} error={error} helperText={helperText}
        InputLabelProps={{ shrink: focused || Boolean(iso) }}
        InputProps={{ readOnly: true, endAdornment: (
          <InputAdornment position="end">
            <Box sx={{ width:26,height:26,borderRadius:'6px',bgcolor:'rgba(42,157,143,0.12)',color:'#2a9d8f',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
          </InputAdornment>
        )}}
        inputProps={{ tabIndex: -1, style: { cursor: 'pointer' } }}
      />
      <input ref={ref} type="date" value={iso || ''} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:1,fontSize:'16px',border:'none',background:'transparent',padding:0 }}
      />
    </Box>
  );
}

export function TimeField({ label, value, onChange, error, helperText }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  return (
    <Box sx={{ position: 'relative' }} onClick={() => { try { ref.current?.showPicker?.(); } catch {} }}>
      <TextField fullWidth label={label} value={value || ''} placeholder="--:--" error={error} helperText={helperText}
        InputLabelProps={{ shrink: focused || Boolean(value) }}
        InputProps={{ readOnly: true, endAdornment: (
          <InputAdornment position="end">
            <Box sx={{ width:26,height:26,borderRadius:'6px',bgcolor:'rgba(26,42,87,0.09)',color:'#2d4a8c',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
          </InputAdornment>
        )}}
        inputProps={{ tabIndex: -1, style: { cursor: 'pointer' } }}
      />
      <input ref={ref} type="time" value={value || ''} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:1,fontSize:'16px',border:'none',background:'transparent',padding:0 }}
      />
    </Box>
  );
}

export function KompensasiField({ value, onChange, error, helperText }) {
  const [custom, setCustom] = useState(() => !!value && !KOMPENSASI_PRESETS.includes(value));
  const showText = custom || (!!value && !KOMPENSASI_PRESETS.includes(value));
  const dropdownValue = showText ? '__custom__' : (value || '');

  const handleSelect = (v) => {
    if (v === '__custom__') { setCustom(true); onChange(''); }
    else { setCustom(false); onChange(v); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField select fullWidth label="Compensation *" value={dropdownValue}
        onChange={e => handleSelect(e.target.value)}
        error={error && !showText} helperText={!showText ? helperText : undefined}
      >
        <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select compensation *</em></MenuItem>
        {KOMPENSASI_PRESETS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        <MenuItem value="__custom__">Cash / Other Amount...</MenuItem>
      </TextField>
      {showText && (
        <TextField fullWidth label="Amount / Description *"
          value={value} onChange={e => onChange(e.target.value)}
          placeholder="Example: Rp 150,000 *"
          error={error} helperText={helperText} autoFocus={!value}
        />
      )}
    </Box>
  );
}

export function SLabel({ children, icon: Icon }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
      {Icon && <Icon sx={{ fontSize: 14, color: 'var(--accent-teal)' }} />}
      <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--neutral-gray)', fontFamily: "'IBM Plex Mono', monospace" }}>
        {children}
      </Typography>
    </Box>
  );
}
