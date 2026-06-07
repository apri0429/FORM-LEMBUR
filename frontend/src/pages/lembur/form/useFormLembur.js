import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { API, API_KARYAWAN, API_SUPERVISORS, API_APPROVAL_CHAIN } from './constants';
import {
  toOpt, sameDept, addOnce, findDept, deptVal,
  emptyEntry, today,
} from './helpers';

export default function useFormLembur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const adm     = Boolean(user?.isAdmin || user?.role === 'admin');
  const allowed = Array.isArray(user?.allowedFormTypes) && user.allowedFormTypes.length
    ? user.allowedFormTypes : ['staff'];
  // Manager = exactly ['manager','staff'] from server, not admin, not koordinator (4 types)
  const isManagerLevel = !adm && allowed.includes('manager') && allowed.length === 2;

  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [formNum, setFormNum] = useState('');
  const [fErr,    setFErr]    = useState({});
  const [vFields, setVFields] = useState([]);
  const [vEntry,  setVEntry]  = useState(false);
  const [depts,   setDepts]   = useState([]);
  const [kOpts,   setKOpts]   = useState([]);
  const [supOpts, setSupOpts] = useState([]);
  const [,        setChain]   = useState([]);
  const [tab,     setTab]     = useState(0);
  const timer = useRef(null);

  const makeForm = useCallback(() => ({
    formType: isManagerLevel ? 'manager' : allowed.length === 1 ? allowed[0] : '',
    departmentId: '', department: '', class: '', divisionCode: '',
    overtimeDay: '', submissionDate: '', requestedBy: '', entries: [emptyEntry()],
  }), [allowed.join('|')]); // eslint-disable-line

  const reset = useCallback(() => {
    setSuccess(''); setFormNum(''); setForm(makeForm()); setTab(0);
  }, [makeForm]);

  const [form, setForm] = useState(() => ({
    formType: isManagerLevel ? 'manager' : '', departmentId: '', department: '', class: '', divisionCode: '',
    overtimeDay: '', submissionDate: '', requestedBy: '', entries: [emptyEntry()],
  }));

  useEffect(() => {
    if (!success) return;
    timer.current = setTimeout(reset, 4500);
    return () => clearTimeout(timer.current);
  }, [success, reset]);

  useEffect(() => {
    if (isEdit || allowed.includes(form.formType)) return;
    const next = allowed.length === 1 ? (allowed[0] || 'staff') : '';
    setForm(p => ({ ...p, formType: next, requestedBy: '', entries: [emptyEntry()] }));
    setChain([]); setTab(0);
  }, [allowed.join('|'), form.formType, isEdit]); // eslint-disable-line

  useEffect(() => {
    if (isEdit || adm || !depts.length || depts.length !== 1) return;
    const d = depts[0];
    setForm(p => ({ ...p, departmentId: String(d.departmentId||d.id), department: d.department, class: d.class||'', divisionCode: d.kodeDivisi||'' }));
  }, [depts, isEdit, adm]);

  useEffect(() => {
    axios.get(`${API_KARYAWAN}/departments`).then(r => setDepts(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.departmentId && (!form.department || !form.class)) { setKOpts([]); setSupOpts([]); return; }
    const bp = form.departmentId ? { departmentId: form.departmentId } : { department: form.department, departmentClass: form.class };
    axios.get(API_KARYAWAN, { params: { ...bp, formType: form.formType } })
      .then(r => {
        const cur = toOpt(user);
        const lvl = (cur?.jobLevel || '').toLowerCase();
        const empId = String(cur?.employeeId || '');
        const fitsType = form.formType === 'manager'
          ? ['manager','director','commissioner','president'].some(k => lvl.includes(k))
          : form.formType === 'outsourcing'
          ? empId.toUpperCase().startsWith('MPP')
          : form.formType === 'harian_lepas'
          ? empId.toUpperCase().startsWith('HLP') || empId.toUpperCase().startsWith('HL')
          : !['manager','director','commissioner','president'].some(k => lvl.includes(k));
        setKOpts(addOnce(r.data.data||[], sameDept(cur, form) && fitsType ? cur : null));
      })
      .catch(() => {});
    axios.get(API_SUPERVISORS, { params: { department: form.department, formType: form.formType } }).then(r => setSupOpts(r.data.data||[])).catch(() => {});
  }, [form.department, form.departmentId, form.class, form.formType, user]);

  useEffect(() => {
    if (!form.requestedBy) { setChain([]); return; }
    axios.get(API_APPROVAL_CHAIN, { params: { name: form.requestedBy } })
      .then(r => setChain(r.data.data)).catch(() => {});
  }, [form.requestedBy]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    axios.get(`${API}/${id}`)
      .then(r => {
        const d = r.data.data;
        setForm({ formType: d.formType||'staff', ...d, departmentId: d.departmentId ? String(d.departmentId) : '', entries: d.entries?.length ? d.entries : [emptyEntry()] });
      })
      .catch(() => setError('Failed to load form data.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!depts.length || !form.department || form.departmentId || (!form.class && !form.divisionCode)) return;
    const s = findDept(depts, form); if (!s) return;
    setForm(p => ({ ...p, departmentId: deptVal(s), department: s.department, class: s.class||'', divisionCode: s.kodeDivisi||'' }));
  }, [depts, form.department, form.departmentId, form.class, form.divisionCode]);

  const clearErr = (...fields) => setFErr(p => { const n = { ...p }; fields.forEach(f => delete n[f]); return n; });
  const clearEntryErr = (i, ...fields) => setFErr(p => {
    if (!p.entries?.[i]) return p;
    const ee = [...(p.entries || [])]; ee[i] = { ...ee[i] }; fields.forEach(f => delete ee[i][f]);
    return { ...p, entries: ee };
  });

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); clearErr(f); };

  const onDept = name => {
    const m = depts.filter(d => d.department === name), a = m.length === 1 ? m[0] : null;
    setForm(p => ({ ...p, departmentId: a ? deptVal(a) : '', department: name, class: a?.class||'', divisionCode: a?.kodeDivisi||'', requestedBy: '', entries: [emptyEntry()] }));
    clearErr('department', 'class', 'requestedBy'); setTab(0);
  };

  const onClass = val => {
    const f = depts.find(d => d.department === form.department && d.class === val);
    setForm(p => ({ ...p, departmentId: f ? deptVal(f) : '', class: val, divisionCode: f?.kodeDivisi||'', requestedBy: '', entries: [emptyEntry()] }));
    clearErr('class', 'requestedBy'); setTab(0);
  };

  const onType = type => {
    const isOpen = ['outsourcing','harian_lepas'].includes(type), sd = !adm && depts.length === 1 ? depts[0] : null;
    setForm(p => ({
      ...p, formType: type,
      ...(!adm && isOpen ? { departmentId:'', department:'', class:'', divisionCode:'' }
        : sd && !isOpen ? { departmentId: String(sd.departmentId||sd.id), department: sd.department, class: sd.class||'', divisionCode: sd.kodeDivisi||'' }
        : !adm && !isOpen ? { departmentId:'', department:'', class:'', divisionCode:'' } : {}),
      requestedBy: '', entries: [emptyEntry()],
    }));
    clearErr('formType'); setChain([]); setTab(0);
  };

  const onSup = nama => {
    setForm(p => {
      const f = supOpts.find(i => i.fullName === nama);
      return { ...p, requestedBy: nama, requestedByJobLevel: f?.jobLevel||'', requestedByJobPosition: f?.jobPosition||'' };
    });
    clearErr('requestedBy');
  };

  const setE = (i, f, v) => { setForm(p => { const e = [...p.entries]; e[i] = { ...e[i], [f]: v }; return { ...p, entries: e }; }); clearEntryErr(i, f); };
  const selK = (i, k) => { if (!k) return; setForm(p => { const e = [...p.entries]; e[i] = { ...e[i], name: k.fullName, employeeId: k.employeeId||k.internalId||'' }; return { ...p, entries: e }; }); clearEntryErr(i, 'name', 'employeeId'); };
  const addE = () => { const n = form.entries.length; setForm(p => ({ ...p, entries: [...p.entries, emptyEntry()] })); setTab(n); };
  const delE = i => { setForm(p => ({ ...p, entries: p.entries.filter((_, x) => x !== i) })); setTab(p => i < p ? p-1 : i === p ? Math.max(0, p-1) : p); };
  const dupE = i => { setForm(p => { const e = [...p.entries]; e.splice(i+1, 0, { ...e[i], sequence: null, approval: 0 }); return { ...p, entries: e }; }); setTab(i+1); };

  const submit = async () => {
    setFErr({}); setError(''); setVFields([]); setVEntry(false);
    const nE = {}, miss = [];
    if (!form.formType)        { nE.formType = 'Required';        miss.push('Form Type'); }
    if (!form.overtimeDay)     { nE.overtimeDay = 'Required';     miss.push('Overtime Day'); }
    if (!form.department)      { nE.department = 'Required';      miss.push('Department'); }
    if (!form.class)           { nE.class = 'Required';           miss.push('Class'); }
    if (!form.submissionDate)  { nE.submissionDate = 'Required';  miss.push('Submission Date'); }
    if (!form.requestedBy)     { nE.requestedBy = 'Required';     miss.push('Requested By'); }
    const ee = []; let hasE = false;
    form.entries.forEach((e, i) => {
      const err = {};
      if (!e.name)         { err.name = 'Required';         hasE = true; }
      if (!e.overtimeDate) { err.overtimeDate = 'Required'; hasE = true; }
      if (!e.startTime)    { err.startTime = 'Required';    hasE = true; }
      if (!e.endTime)      { err.endTime = 'Required';      hasE = true; }
      if (!e.task)         { err.task = 'Required';         hasE = true; }
      if (!e.result)       { err.result = 'Required';       hasE = true; }
      if (!e.compensation) { err.compensation = 'Required'; hasE = true; }
      ee[i] = err;
    });
    if (miss.length || hasE) { setFErr({ ...nE, entries: hasE ? ee : [] }); setVFields(miss); setVEntry(hasE); return; }
    try {
      setSaving(true);
      const payload = { ...form };
      if (isEdit) {
        await axios.put(`${API}/${id}`, payload);
        setSuccess('The overtime form changes were saved successfully.');
      } else {
        const r = await axios.post(API, payload);
        setFormNum(r.data.data?.formNumber || '');
        setSuccess('The overtime request was submitted and sent for approval.');
      }
    } catch { setError('Failed to save form.'); }
    finally { setSaving(false); }
  };

  return {
    user, navigate, isEdit, adm, allowed, isManagerLevel,
    loading, saving, error, success, formNum,
    fErr, vFields, vEntry,
    form, tab, depts, kOpts, supOpts,
    set, onDept, onClass, onType, onSup,
    setE, selK, addE, delE, dupE, setTab,
    submit, setError,
  };
}
