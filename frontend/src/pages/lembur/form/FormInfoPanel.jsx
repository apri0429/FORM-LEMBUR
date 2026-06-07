import React from 'react';
import { Autocomplete, Box, Chip, Divider, MenuItem, TextField, Typography } from '@mui/material';
import AssignmentRoundedIcon    from '@mui/icons-material/AssignmentRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import { DateField, SLabel, LockedField } from './FormFields';
import { LEMBUR_PADA_OPTIONS, FORM_TYPE_OPTIONS } from './constants';
import CardBigBox from '../../../components/ui/CardBigBox';

export default function FormInfoPanel({
  form, fErr,
  adm, deptLock, typeLock,
  available, uDepts, clsOpts, deptOk,
  supOpts,
  onType, onDept, onClass, set, onSup, onHint,
}) {
  const deptName = form.department || '';

  return (
    <Box sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0, position: { md: 'sticky' }, top: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
    <CardBigBox style={{ flex: 1 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <SLabel icon={AssignmentRoundedIcon}>Overtime Type</SLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
        <LockedField locked={typeLock}>
          <TextField fullWidth select required label="Form Type *" value={form.formType}
            onChange={e => onType(e.target.value)} disabled={typeLock}
            error={Boolean(fErr.formType)} helperText={fErr.formType || undefined}
          >
            <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select form type *</em></MenuItem>
            {available.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </LockedField>
        <TextField fullWidth select required label="Overtime Day *" value={form.overtimeDay}
          onChange={e => set('overtimeDay', e.target.value)}
          error={Boolean(fErr.overtimeDay)} helperText={fErr.overtimeDay || undefined}
        >
          <MenuItem value=""><em style={{ color: '#94a3b8' }}>Select overtime day *</em></MenuItem>
          {LEMBUR_PADA_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: 'rgba(26,42,87,0.08)' }} />

      <SLabel icon={CorporateFareRoundedIcon}>Organization</SLabel>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
        <LockedField locked={deptLock}>
          <Autocomplete
            options={uDepts} value={deptName || null}
            onChange={(_, v) => onDept(v || '')} disabled={deptLock}
            renderInput={p => (
              <TextField {...p} required label="Department *" placeholder="Select department *"
                error={Boolean(fErr.department)} helperText={fErr.department || undefined}
                InputLabelProps={p.InputLabelProps} />
            )}
            noOptionsText="Department not found"
          />
        </LockedField>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 80px', gap: 1.5 }}>
          <LockedField locked={deptLock}>
            <Autocomplete
              options={clsOpts} getOptionLabel={o => o.class || ''}
              isOptionEqualToValue={(o, v) => o.class === v.class}
              value={clsOpts.find(d => d.class === form.class) || null}
              onChange={(_, v) => onClass(v?.class || '')}
              disabled={!form.department || deptLock}
              renderOption={({ key, ...props }, opt) => (
                <Box key={key} component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={opt.kodeDivisi} size="small" color="primary" sx={{ fontSize: 10, height: 18, borderRadius: '5px' }} />
                    <Typography variant="body2" fontSize="0.82rem">{opt.class}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={p => (
                <TextField {...p} required label="Class *"
                  placeholder={form.department ? 'Select class *' : ''}
                  error={Boolean(fErr.class)} helperText={fErr.class || undefined}
                  InputLabelProps={p.InputLabelProps} />
              )}
              noOptionsText="Not found"
            />
          </LockedField>
          <LockedField locked permanent>
            <TextField label="Code" value={form.divisionCode} InputProps={{ readOnly: true }} placeholder="-" />
          </LockedField>
        </Box>
        <DateField required label="Submission Date *" value={form.submissionDate}
          onChange={v => set('submissionDate', v)}
          error={Boolean(fErr.submissionDate)} helperText={fErr.submissionDate || undefined} />
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: 'rgba(26,42,87,0.08)' }} />

      <SLabel icon={ManageAccountsRoundedIcon}>
        {form.formType === 'manager' ? 'Director / Commissioner' : 'Requested By'}
      </SLabel>
      <Box sx={{ position: 'relative' }}>
      <Autocomplete
        options={supOpts.map(k => k.fullName)} value={form.requestedBy || null}
        onChange={(_, v) => onSup(v || '')} disabled={!deptOk}
        renderOption={({ key, ...props }, opt) => {
          const p = supOpts.find(k => k.fullName === opt);
          return (
            <Box key={key} component="li" {...props}>
              <Box>
                <Typography variant="body2" fontWeight={600} fontSize="0.85rem">{opt}</Typography>
                {p?.jobPosition && <Typography variant="caption" color="text.secondary" fontSize="0.75rem">{p.jobLevel} · {p.jobPosition}</Typography>}
              </Box>
            </Box>
          );
        }}
        renderInput={p => (
          <TextField {...p} required
            label={form.formType === 'manager' ? 'Director / Commissioner *' : 'Requested By *'}
            placeholder={deptOk ? (form.formType === 'manager' ? 'Search director / commissioner name *' : 'Search requested by name *') : ''}
            error={Boolean(fErr.requestedBy)}
            helperText={fErr.requestedBy || undefined}
            InputLabelProps={p.InputLabelProps}
          />
        )}
      />
      {!deptOk && (
        <Box sx={{ position:'absolute', inset:0, zIndex:2, cursor:'default' }}
          onClick={() => onHint?.('⚠ Select department & class first')} />
      )}
      </Box>
    </Box>
    </CardBigBox>
    </Box>
  );
}
