import React from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { DateField, TimeField, KompensasiField, LockedField } from './FormFields';
import { initials } from './helpers';
import CardBigBox from '../../../components/ui/CardBigBox';

export default function EmployeeEntryCard({ ent, tab, totalEntries, deptOk, kOpts, entErr, setE, selK, onHint }) {

  return (
    <CardBigBox
      eyebrow="Active Entry"
      title={ent.name || `Employee ${tab + 1}`}
      headerAction={
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
            boxShadow: '0 2px 8px rgba(26,42,87,0.28)',
          }}>
            {initials(ent.name)}
          </Box>
          <Chip label={`${tab + 1} / ${totalEntries}`} size="small" variant="outlined"
            sx={{ borderRadius:'7px',fontWeight:700,fontSize:'0.7rem',height:22,borderColor:'rgba(15,23,42,0.18)',color:'#475569' }} />
        </Box>
      }
      style={{ width: '100%', flex: 1, overflow: 'hidden', animation: 'fadeUp .28s ease both' }}
    >
      {/* fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.75, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <BadgeRoundedIcon sx={{ fontSize: 14, color: 'var(--accent-teal)' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--neutral-gray)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Employee Data
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 190px' }, gap: 1.5, position: 'relative', pb: { xs: 0, md: 0 } }}>
          <Box sx={{ position: 'relative' }}>
          <Autocomplete
            options={kOpts} getOptionLabel={o => o.fullName}
            value={kOpts.find(i => i.fullName === ent.name) || null}
            onChange={(_, v) => v ? selK(tab, v) : setE(tab, 'name', '')}
            disabled={!deptOk} freeSolo
            onInputChange={(_, v) => setE(tab, 'name', v)}
            renderOption={({ key, ...props }, opt) => (
              <Box key={key} component="li" {...props}>
                <Box>
                  <Typography variant="body2" fontWeight={600} fontSize="0.85rem">{opt.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.75rem">{opt.employeeId} — {opt.jobPosition}</Typography>
                </Box>
              </Box>
            )}
            renderInput={p => (
              <TextField {...p} label="Employee Name *"
                placeholder={deptOk ? 'Search employee name *' : 'Select department & class first *'}
                required error={Boolean(entErr.name)} helperText={entErr.name || undefined}
                InputLabelProps={{ ...p.InputLabelProps, shrink: p.InputLabelProps?.shrink || Boolean(ent.name) }}
                InputProps={{
                  ...p.InputProps,
                  sx: { pr: '46px !important' },
                  endAdornment: (
                    <>
                      {p.InputProps?.endAdornment}
                      <Box sx={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:26,height:26,borderRadius:'6px',bgcolor:'rgba(42,157,143,0.12)',color:'#2a9d8f',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
                        <PersonSearchIcon sx={{ fontSize:15 }} />
                      </Box>
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={deptOk ? 'No employees found' : 'Select department & class first'}
          />
          {!deptOk && (
            <Box sx={{ position:'absolute', inset:0, zIndex:2, cursor:'default' }}
              onClick={() => onHint?.('⚠ Select department & class first')} />
          )}
          </Box>
          <LockedField permanent>
            <TextField fullWidth label="Employee ID" value={ent.employeeId} InputProps={{ readOnly: true }} placeholder="-" />
          </LockedField>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, position: 'relative', pb: 2.5 }}>
          <DateField label="Overtime Date *" value={ent.overtimeDate}
            onChange={v => setE(tab, 'overtimeDate', v)}
            error={Boolean(entErr.overtimeDate)} helperText={entErr.overtimeDate || undefined} />
          <TimeField label="Start Time *" value={ent.startTime}
            onChange={v => setE(tab, 'startTime', v)}
            error={Boolean(entErr.startTime)} helperText={entErr.startTime || undefined} />
          <TimeField label="End Time *" value={ent.endTime}
            onChange={v => setE(tab, 'endTime', v)}
            error={Boolean(entErr.endTime)} helperText={entErr.endTime || undefined} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, position: 'relative', pb: 2.5 }}>
          <TextField label="Task / Work *" value={ent.task}
            onChange={e => setE(tab, 'task', e.target.value)}
            placeholder="Describe the overtime work *"
            error={Boolean(entErr.task)} helperText={entErr.task || undefined} />
          <TextField label="Result *" value={ent.result}
            onChange={e => setE(tab, 'result', e.target.value)}
            placeholder="Describe the result achieved *"
            error={Boolean(entErr.result)} helperText={entErr.result || undefined} />
        </Box>

        <KompensasiField value={ent.compensation} onChange={v => setE(tab, 'compensation', v)}
          error={Boolean(entErr.compensation)} helperText={entErr.compensation || undefined} />
      </Box>
    </CardBigBox>
  );
}
