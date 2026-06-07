import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from '@mui/material';
import ArrowBackRoundedIcon     from '@mui/icons-material/ArrowBackRounded';
import SaveIcon                 from '@mui/icons-material/Save';

import CardBigBox from '../../components/ui/CardBigBox';
import useFormLembur       from './form/useFormLembur';
import FormInfoPanel       from './form/FormInfoPanel';
import EmployeeTabBar      from './form/EmployeeTabBar';
import EmployeeEntryCard   from './form/EmployeeEntryCard';
import SuccessToast        from './form/SuccessToast';
import { rootSx }         from './form/constants';
import { FORM_TYPE_OPTIONS } from './form/constants';

export default function FormLembur() {
  const {
    navigate, isEdit, adm, allowed, isManagerLevel,
    loading, saving, error, success, formNum,
    fErr, vFields, vEntry,
    form, tab, depts, kOpts, supOpts,
    set, onDept, onClass, onType, onSup,
    setE, selK, addE, delE, dupE, setTab,
    submit, setError,
  } = useFormLembur();

  const [footerMsg, setFooterMsg] = useState('');
  const msgTimer = useRef(null);

  const showMsg = (msg) => {
    setFooterMsg(msg);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setFooterMsg(''), 3000);
  };

  useEffect(() => {
    if (vFields.length > 0 || vEntry) {
      const txt = [
        vFields.length > 0 ? `Complete: ${vFields.join(', ')}` : '',
        vEntry ? 'Entry data is incomplete' : '',
      ].filter(Boolean).join(' · ');
      showMsg(txt);
    }
  }, [vFields, vEntry]);

  if (loading) return <Box sx={{ display:'flex',justifyContent:'center',pt:10 }}><CircularProgress /></Box>;

  const selType  = FORM_TYPE_OPTIONS.find(o => o.value === form.formType) || FORM_TYPE_OPTIONS[1];
  const uDepts   = [...new Set(depts.map(d => d.department).filter(Boolean))];
  const deptLock = !adm && !['outsourcing','harian_lepas'].includes(form.formType) && uDepts.length <= 1;
  const clsOpts  = depts.filter(d => d.department === form.department);
  const deptOk   = Boolean(form.department && form.class);
  const ent      = form.entries[tab] || form.entries[0];
  const entErr   = fErr.entries?.[tab] || {};
  const done     = form.entries.filter(e => e.name && e.overtimeDate && e.startTime && e.endTime && e.task && e.result && e.compensation).length;
  const typeLock = allowed.length <= 1;
  const available = FORM_TYPE_OPTIONS.filter(o => allowed.includes(o.value));

  return (
    <Box sx={rootSx}>
      <CardBigBox
        eyebrow={isEdit ? 'Edit Form' : 'New Request'}
        title={`${selType.label} Overtime Form`}
        className="lembur-form-panel"
        contentClassName="dashboard-panel__body--scrollable"
        style={{ flex: 1, minHeight: 0 }}
        footer={
          <Box sx={{ display:'flex',flexDirection:{xs:'column',sm:'row'},gap:1,justifyContent:'flex-end',alignItems:{xs:'stretch',sm:'center'},
            width:'100%' }}>
            {footerMsg && (
              <Typography variant="caption" sx={{
                color: footerMsg.startsWith('⚠') ? '#d97706' : 'error.main',
                fontWeight:600, flex:1, fontSize:{xs:'0.82rem',sm:'0.72rem'},
                animation:'fadeUp .2s ease both',
              }}>
                {footerMsg}
              </Typography>
            )}
            <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/')}
              sx={{ minHeight:{xs:46,sm:40},borderRadius:'22px',textTransform:'none',fontWeight:700,px:2.5,fontSize:{xs:'0.95rem',sm:'0.875rem'},
                borderColor:'rgba(26,42,87,0.22)',color:'#2d4a8c',bgcolor:'rgba(26,42,87,0.03)',
                '&:hover':{borderColor:'#1a2a57',bgcolor:'rgba(26,42,87,0.07)',transform:'translateY(-1px)'},transition:'all .18s',boxShadow:'none' }}>
              Back
            </Button>
            <Button variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={submit} disabled={saving}
              sx={{ minHeight:{xs:46,sm:40},borderRadius:'22px',textTransform:'none',fontWeight:700,px:2.5,fontSize:{xs:'0.95rem',sm:'0.875rem'},minWidth:{xs:'100%',sm:210},color:'#fff',
                background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',boxShadow:'0 4px 14px rgba(42,157,143,0.34)',
                '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 6px 20px rgba(42,157,143,0.44)',transform:'translateY(-1px)'},
                '&.Mui-disabled':{background:'linear-gradient(135deg,#99d4cf,#7dc4be)',color:'#fff',boxShadow:'none'},transition:'all .18s' }}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : form.entries.length === 1 ? 'Submit Request' : `Submit ${form.entries.length} Employee Entries`}
            </Button>
          </Box>
        }
      >
        <Box sx={{ display:'flex',flexDirection:{xs:'column',md:'row'},gap:2.5,alignItems:'stretch',animation:'fadeUp .4s ease both' }}>
          <FormInfoPanel
            form={form} fErr={fErr}
            adm={adm} deptLock={deptLock} typeLock={typeLock}
            available={available} uDepts={uDepts} clsOpts={clsOpts} deptOk={deptOk}
            supOpts={supOpts}
            onType={onType} onDept={onDept} onClass={onClass} set={set} onSup={onSup}
            onHint={showMsg}
          />

          <Box sx={{ flex:1,minWidth:0,width:'100%',display:'flex',flexDirection:'column',gap:{xs:2.5,sm:2},alignSelf:'stretch' }}>
            <EmployeeTabBar
              entries={form.entries} tab={tab} done={done} fErr={fErr}
              addE={addE} dupE={dupE} delE={delE} setTab={setTab}
            />
            {ent && (
              <EmployeeEntryCard
                ent={ent} tab={tab} totalEntries={form.entries.length}
                deptOk={deptOk} kOpts={kOpts} entErr={entErr}
                setE={setE} selK={selK} onHint={showMsg}
              />
            )}
          </Box>
        </Box>
      </CardBigBox>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>

      <SuccessToast success={success} isEdit={isEdit} formNum={formNum} />
    </Box>
  );
}
