import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress,
  Divider, IconButton, InputAdornment,
  MenuItem, Snackbar, Alert, TextField, Tooltip, Typography,
} from '@mui/material';
import AccessTimeRoundedIcon       from '@mui/icons-material/AccessTimeRounded';
import ArrowBackRoundedIcon        from '@mui/icons-material/ArrowBackRounded';
import AssignmentRoundedIcon       from '@mui/icons-material/AssignmentRounded';
import BadgeRoundedIcon            from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon    from '@mui/icons-material/CalendarMonthRounded';
import CategoryRoundedIcon         from '@mui/icons-material/CategoryRounded';
import CheckCircleRoundedIcon      from '@mui/icons-material/CheckCircleRounded';
import ContentCopyRoundedIcon      from '@mui/icons-material/ContentCopyRounded';
import CorporateFareRoundedIcon    from '@mui/icons-material/CorporateFareRounded';
import EventNoteRoundedIcon        from '@mui/icons-material/EventNoteRounded';
import ManageAccountsRoundedIcon   from '@mui/icons-material/ManageAccountsRounded';
import PersonAddAlt1RoundedIcon    from '@mui/icons-material/PersonAddAlt1Rounded';
import PersonRemoveRoundedIcon     from '@mui/icons-material/PersonRemoveRounded';
import PersonSearchIcon            from '@mui/icons-material/PersonSearch';
import SaveIcon                    from '@mui/icons-material/Save';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CardBigBox from '../components/cardbox/CardBigBox';
import { useAuth } from '../context/AuthContext';

/* ── constants ─────────────────────────────────────────────── */
const API           = '/api/lembur';
const API_KARYAWAN  = '/api/karyawan';
const LEMBUR_PADA_OPTIONS = ['Hari Libur', 'Hari Kerja'];
const KOMPENSASI_PRESETS  = ['1 Hari Cuti', '½ Hari Cuti'];
const FORM_TYPE_OPTIONS   = [
  { value:'manager',      label:'Manager' },
  { value:'staff',        label:'Staff' },
  { value:'outsourcing',  label:'Outsourcing' },
  { value:'harian_lepas', label:'Harian Lepas' },
];
const OPEN_FORM_TYPES  = ['outsourcing','harian_lepas'];
const BOD_KEYWORDS     = ['director','commissioner','komisaris','president director'];
const MANAGER_KEYWORDS = ['manager','supervisor','spv','kepala','head','koordinator','lead'];

const CONFETTI = [
  {tx:-95,ty:-65, color:'#10b981',size:9, round:true,  delay:0   },
  {tx: 95,ty:-65, color:'#f59e0b',size:9, round:false, delay:.04 },
  {tx:-52,ty:-115,color:'#3b82f6',size:7, round:true,  delay:.08 },
  {tx: 52,ty:-115,color:'#ec4899',size:7, round:false, delay:.06 },
  {tx:-125,ty:5,  color:'#8b5cf6',size:10,round:true,  delay:.02 },
  {tx: 125,ty:5,  color:'#ef4444',size:10,round:false, delay:.1  },
  {tx:-72, ty:92, color:'#f59e0b',size:7, round:true,  delay:.14 },
  {tx: 72, ty:92, color:'#10b981',size:7, round:false, delay:.12 },
  {tx:-22, ty:125,color:'#3b82f6',size:8, round:true,  delay:.18 },
  {tx: 22, ty:125,color:'#ec4899',size:8, round:false, delay:.16 },
  {tx:0,  ty:-135,color:'#8b5cf6',size:9, round:true,  delay:.05 },
  {tx:-112,ty:-38,color:'#ef4444',size:6, round:false, delay:.09 },
  {tx: 112,ty:-38,color:'#10b981',size:6, round:true,  delay:.07 },
  {tx:0,  ty:132, color:'#f59e0b',size:9, round:false, delay:.11 },
  {tx:-60,ty:-95, color:'#ec4899',size:6, round:true,  delay:.13 },
  {tx: 60,ty:-95, color:'#8b5cf6',size:6, round:false, delay:.03 },
];

/* ── helpers ────────────────────────────────────────────────── */
const MONTH_IDX = {
  jan:1,januari:1,feb:2,februari:2,mar:3,maret:3,
  apr:4,april:4,mei:5,may:5,jun:6,juni:6,
  jul:7,juli:7,agu:8,agustus:8,aug:8,sep:9,september:9,
  okt:10,oktober:10,oct:10,october:10,nov:11,november:11,
  des:12,desember:12,dec:12,december:12,
};
const pad = v => String(v).padStart(2,'0');
const validParts = (y,m,d) => { const dt=new Date(y,m-1,d); return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d; };

function toIso(val) {
  if (!val) return '';
  const t=String(val).trim();
  const m1=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m1) { const [,y,mo,d]=m1.map(Number); return validParts(y,mo,d)?t:''; }
  const m2=/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (m2) { const [,d,mo,y]=m2.map(Number); return validParts(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:''; }
  const pts=t.replace(/,/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').split(' ');
  if (pts.length>=3) {
    const d=Number(pts[0]),tok=pts[1].toLowerCase().replace(/\.$/,'');
    const mo=Number(tok)||MONTH_IDX[tok],y=Number(pts[2]);
    if (validParts(y,mo,d)) return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return '';
}
function dispDate(s) {
  if (!s) return '';
  const iso=toIso(s); if (!iso) return s;
  const [y,m,d]=iso.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d));
}
function today() { const n=new Date(); return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`; }
const deptVal = d => String(d?.departmentId??d?.id??d?.department??'');

function findDept(depts,form) {
  if (!depts.length) return null;
  if (form.departmentId) return depts.find(d=>deptVal(d)===String(form.departmentId))||null;
  const same=depts.filter(d=>d.department===form.department);
  return same.find(d=>d.class===form.class)||same.find(d=>d.kodeDivisi===form.kodeDivisi)||same[0]||null;
}
function hasKw(u,kws) {
  const t=[u?.jobLevel,u?.jobPosition,u?.department].map(v=>String(v||'').toLowerCase()).join(' ');
  return kws.some(k=>t.includes(k));
}
const isAdmin   = u => !u?false:u.isAdmin===true||u.role==='admin'||u.department==='IT'||hasKw(u,BOD_KEYWORDS);
const isCoord   = u => !u?false:hasKw(u,['koordinator','coordinator']);
const isManager = u => !u?false:hasKw(u,MANAGER_KEYWORDS);

function getAllowed(user) {
  const derived = isAdmin(user)||isCoord(user) ? FORM_TYPE_OPTIONS.map(o=>o.value)
    : isManager(user) ? ['manager','staff'] : ['staff'];
  const stored = Array.isArray(user?.allowedFormTypes)&&user.allowedFormTypes.length?user.allowedFormTypes:derived;
  return stored.filter(f=>derived.includes(f));
}
function toOpt(user) {
  if (!user?.fullName) return null;
  return { id:user.id||user.userId||user.employeeId||user.fullName,
    employeeId:user.employeeId||user.internalId||'',fullName:user.fullName,
    departmentId:user.departmentId||'',department:user.department||'',
    departmentClass:user.departmentClass||user.class||'',class:user.class||user.departmentClass||'',
    kodeDivisi:user.kodeDivisi||'',jobPosition:user.jobPosition||'',jobLevel:user.jobLevel||'',
    level:user.level||1,status:user.status||'Active',departments:user.departments||[] };
}
function sameDept(person,form) {
  if (!person||(!form.departmentId&&!form.department)) return false;
  const ds=[{departmentId:person.departmentId,department:person.department,class:person.class||person.departmentClass},...(person.departments||[])];
  return ds.some(d=>{
    const sId=form.departmentId&&String(d.departmentId||d.id||'')===String(form.departmentId);
    const sNm=form.department&&(d.department||d.name)===form.department;
    return Boolean(sId||sNm);
  });
}
function addOnce(opts,opt) {
  if (!opt) return opts;
  return opts.some(i=>String(i.employeeId||'')===String(opt.employeeId||'')||i.fullName===opt.fullName)?opts:[opt,...opts];
}
function initials(name) {
  const ps=String(name||'').trim().split(/\s+/).filter(Boolean);
  return ps.length?ps.slice(0,2).map(p=>p[0]?.toUpperCase()).join(''):'KL';
}
const emptyEntry = () => ({ internalId:null,nama:'',idKaryawan:'',tanggalLembur:today(),jamMulai:'',jamSelesai:'',tugas:'',hasil:'',kompensasi:'',approval:0 });

/* ── date / time pickers ───────────────────────────────────── */
function DateField({ label, value, onChange, error, helperText }) {
  const ref=useRef(null);
  const iso=toIso(value);
  return (
    <Box sx={{position:'relative'}} onClick={()=>{try{ref.current?.showPicker?.();}catch{}}}>
      <TextField fullWidth label={label} value={iso?dispDate(iso):''} error={error} helperText={helperText}
        InputProps={{readOnly:true,endAdornment:(
          <InputAdornment position="end">
            <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:'rgba(42,157,143,0.12)',color:'#2a9d8f',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <CalendarMonthRoundedIcon sx={{fontSize:15}}/>
            </Box>
          </InputAdornment>
        )}}
        inputProps={{tabIndex:-1,style:{cursor:'pointer'}}}
      />
      <input ref={ref} type="date" value={iso||''} onChange={e=>onChange(e.target.value)}
        style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:1,fontSize:'16px',border:'none',background:'transparent',padding:0}}
      />
    </Box>
  );
}
function TimeField({ label, value, onChange, error, helperText }) {
  const ref=useRef(null);
  return (
    <Box sx={{position:'relative'}} onClick={()=>{try{ref.current?.showPicker?.();}catch{}}}>
      <TextField fullWidth label={label} value={value||''} placeholder="--:--" error={error} helperText={helperText}
        InputProps={{readOnly:true,endAdornment:(
          <InputAdornment position="end">
            <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:'rgba(26,42,87,0.09)',color:'#2d4a8c',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <AccessTimeRoundedIcon sx={{fontSize:15}}/>
            </Box>
          </InputAdornment>
        )}}
        inputProps={{tabIndex:-1,style:{cursor:'pointer'}}}
      />
      <input ref={ref} type="time" value={value||''} onChange={e=>onChange(e.target.value)}
        style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',zIndex:1,fontSize:'16px',border:'none',background:'transparent',padding:0}}
      />
    </Box>
  );
}

/* ── kompensasi: dropdown preset + custom text ─────────────── */
function KompensasiField({ value, onChange, error, helperText }) {
  const [custom, setCustom] = useState(() => !!value && !KOMPENSASI_PRESETS.includes(value));
  const showText = custom || (!!value && !KOMPENSASI_PRESETS.includes(value));
  const dropdownValue = showText ? '__custom__' : (value || '');

  const handleSelect = (v) => {
    if (v === '__custom__') {
      setCustom(true);
      onChange('');
    } else {
      setCustom(false);
      onChange(v);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField select fullWidth label="Kompensasi *" value={dropdownValue}
        onChange={e => handleSelect(e.target.value)}
        error={error && !showText}
        helperText={!showText ? helperText : undefined}
      >
        <MenuItem value=""><em style={{ color: '#94a3b8' }}>Pilih kompensasi...</em></MenuItem>
        {KOMPENSASI_PRESETS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        <MenuItem value="__custom__">Uang / Nominal Lainnya...</MenuItem>
      </TextField>
      {showText && (
        <TextField fullWidth label="Jumlah / Keterangan *"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Contoh: Rp 150.000"
          error={error} helperText={helperText}
          autoFocus={!value}
        />
      )}
    </Box>
  );
}

/* ── tiny label above section ──────────────────────────────── */
const SLabel = ({children, icon:Icon}) => (
  <Box sx={{display:'flex',alignItems:'center',gap:0.75,mb:1.5}}>
    {Icon&&<Icon sx={{fontSize:14,color:'#2a9d8f'}}/>}
    <Typography sx={{fontWeight:800,fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.09em',color:'#2a9d8f'}}>
      {children}
    </Typography>
  </Box>
);

/* ── global sx ─────────────────────────────────────────────── */
const rootSx = {
  width:'100%', display:'flex', flexDirection:'column',
  '@keyframes fadeUp': {from:{opacity:0,transform:'translateY(8px)'},to:{opacity:1,transform:'translateY(0)'}},
  '@keyframes pop':    {'0%':{opacity:0,transform:'scale(.88)'},'60%':{transform:'scale(1.03)'},'100%':{opacity:1,transform:'scale(1)'}},
  '@keyframes drain':  {from:{width:'100%'},to:{width:'0%'}},
  '& .MuiOutlinedInput-root': {
    bgcolor:'#eef2f6', borderRadius:'10px', minHeight:{xs:52,sm:48}, height:{xs:52,sm:48}, fontSize:{xs:'0.92rem',sm:'0.875rem'},
    transition:'box-shadow .18s,background-color .18s,border-color .18s',
    alignItems:'center',
    boxSizing:'border-box',
    '& fieldset':{borderColor:'rgba(26,42,87,0.14)'},
    '&:hover':{bgcolor:'#e7edf4'},
    '&:hover fieldset':{borderColor:'rgba(42,157,143,0.45)'},
    '&.Mui-focused':{bgcolor:'#fff',boxShadow:'0 0 0 3.5px rgba(42,157,143,0.14)'},
    '&.Mui-focused fieldset':{borderColor:'#2a9d8f',borderWidth:1.5},
    '&.Mui-disabled':{bgcolor:'rgba(15,23,42,0.03)','& fieldset':{borderColor:'rgba(15,23,42,0.07)'}},
  },
  '& .MuiInputLabel-root':{color:'#64748b',fontWeight:500,fontSize:{xs:'0.86rem',sm:'0.82rem'},transform:'translate(14px,14px) scale(1)'},
  '& .MuiInputLabel-root.MuiInputLabel-shrink':{transform:'translate(14px,-6px) scale(0.75)',fontWeight:700,color:'#1a2a57'},
  '& .MuiInputBase-input':{height:'1.25em',py:'0 !important',display:'flex',alignItems:'center'},
  '& .MuiAutocomplete-inputRoot':{pr:'12px !important',pl:'12px !important',py:'0 !important'},
  '& .MuiAutocomplete-inputRoot .MuiInputBase-input':{height:'1.25em',py:'0 !important',minWidth:'0 !important'},
  '& .MuiAutocomplete-endAdornment':{right:10},
  '& .MuiInputAdornment-root':{alignSelf:'center',mt:'0 !important'},
  '& .MuiInputBase-input::placeholder':{color:'#94a3b8',opacity:1},
  '& .MuiFormHelperText-root':{mx:0,mt:'3px',fontSize:'0.7rem'},
  '& .MuiSelect-select':{height:'1.25em',py:'0 !important',display:'flex',alignItems:'center'},
};

/* ── main ───────────────────────────────────────────────────── */
export default function FormLembur() {
  const {user} = useAuth();
  const navigate = useNavigate();
  const {id} = useParams();
  const isEdit = Boolean(id);
  const adm = isAdmin(user);
  const allowed = getAllowed(user);
  const available = FORM_TYPE_OPTIONS.filter(o=>allowed.includes(o.value));

  const [loading, setLoading]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');
  const [formNum, setFormNum]   = useState('');
  const [fErr,    setFErr]      = useState({});
  const [vFields, setVFields]   = useState([]);
  const [vEntry,  setVEntry]    = useState(false);
  const [depts,   setDepts]     = useState([]);
  const [kOpts,   setKOpts]     = useState([]);
  const [supOpts, setSupOpts]   = useState([]);
  const [,        setChain]     = useState([]);
  const [tab,     setTab]       = useState(0);
  const timer = useRef(null);

  const makeForm = useCallback(()=>({
    formType: allowed.length===1?allowed[0]:'',
    departmentId:'',department:'',class:'',kodeDivisi:'',
    lemburPada:'',tanggalPengajuan:today(),diperintahOleh:'',entries:[emptyEntry()],
  }),[allowed.join('|')]);

  const reset = useCallback(()=>{setSuccess('');setFormNum('');setForm(makeForm());setTab(0);},[makeForm]);

  useEffect(()=>{
    if (!success) return;
    timer.current=setTimeout(reset,4500);
    return ()=>clearTimeout(timer.current);
  },[success,reset]);

  const [form,setForm] = useState(()=>({
    formType:'',departmentId:'',department:'',class:'',kodeDivisi:'',
    lemburPada:'',tanggalPengajuan:today(),diperintahOleh:'',entries:[emptyEntry()],
  }));

  useEffect(()=>{
    if (isEdit||allowed.includes(form.formType)) return;
    const next=allowed.length===1?(allowed[0]||'staff'):'';
    setForm(p=>({...p,formType:next,diperintahOleh:'',entries:[emptyEntry()]}));
    setChain([]);setTab(0);
  },[allowed.join('|'),form.formType,isEdit]);

  useEffect(()=>{
    if (isEdit||adm||!depts.length||depts.length!==1) return;
    const d=depts[0];
    setForm(p=>({...p,departmentId:String(d.departmentId||d.id),department:d.department,class:d.class||'',kodeDivisi:d.kodeDivisi||''}));
  },[depts,isEdit,adm]);

  useEffect(()=>{axios.get(`${API_KARYAWAN}/departments`).then(r=>setDepts(r.data.data)).catch(()=>{});},[]);

  useEffect(()=>{
    if (!form.departmentId&&(!form.department||!form.class)){setKOpts([]);setSupOpts([]);return;}
    const bp=form.departmentId?{departmentId:form.departmentId}:{department:form.department,departmentClass:form.class};
    axios.get(API_KARYAWAN,{params:{...bp,formType:form.formType}})
      .then(r=>{const cur=toOpt(user);setKOpts(addOnce(r.data.data||[],sameDept(cur,form)?cur:null));}).catch(()=>{});
    const sf=form.formType==='manager'?'manager':form.formType==='staff'?'staff':'all';
    const sp=form.formType==='manager'?{supervisorFor:sf}:{department:form.department,supervisorFor:sf};
    axios.get(API_KARYAWAN,{params:sp}).then(r=>setSupOpts(r.data.data||[])).catch(()=>{});
  },[form.department,form.departmentId,form.class,form.formType,user]);

  useEffect(()=>{
    if (!form.diperintahOleh){setChain([]);return;}
    axios.get(`${API_KARYAWAN}/approval-chain`,{params:{nama:form.diperintahOleh}}).then(r=>setChain(r.data.data)).catch(()=>{});
  },[form.diperintahOleh]);

  useEffect(()=>{
    if (!isEdit) return;
    setLoading(true);
    axios.get(`${API}/${id}`)
      .then(r=>{const d=r.data.data;setForm({formType:d.formType||d.jenisForm||'staff',...d,departmentId:d.departmentId?String(d.departmentId):'',entries:d.entries?.length?d.entries:[emptyEntry()]});})
      .catch(()=>setError('Gagal memuat data form.')).finally(()=>setLoading(false));
  },[id,isEdit]);

  useEffect(()=>{
    if (!depts.length||!form.department||form.departmentId||(!form.class&&!form.kodeDivisi)) return;
    const s=findDept(depts,form);if (!s) return;
    setForm(p=>({...p,departmentId:deptVal(s),department:s.department,class:s.class||'',kodeDivisi:s.kodeDivisi||''}));
  },[depts,form.department,form.departmentId,form.class,form.kodeDivisi]);

  const set = (f,v)=>setForm(p=>({...p,[f]:v}));

  const onDept = name=>{
    const m=depts.filter(d=>d.department===name),a=m.length===1?m[0]:null;
    setForm(p=>({...p,departmentId:a?deptVal(a):'',department:name,class:a?.class||'',kodeDivisi:a?.kodeDivisi||'',diperintahOleh:'',entries:[emptyEntry()]}));
    setTab(0);
  };
  const onClass = val=>{
    const f=depts.find(d=>d.department===form.department&&d.class===val);
    setForm(p=>({...p,departmentId:f?deptVal(f):'',class:val,kodeDivisi:f?.kodeDivisi||'',diperintahOleh:'',entries:[emptyEntry()]}));
    setTab(0);
  };
  const onType = type=>{
    const isOpen=OPEN_FORM_TYPES.includes(type),sd=!adm&&depts.length===1?depts[0]:null;
    setForm(p=>({...p,formType:type,
      ...(!adm&&isOpen?{departmentId:'',department:'',class:'',kodeDivisi:''}
        :sd&&!isOpen?{departmentId:String(sd.departmentId||sd.id),department:sd.department,class:sd.class||'',kodeDivisi:sd.kodeDivisi||''}
        :!adm&&!isOpen?{departmentId:'',department:'',class:'',kodeDivisi:''}:{}),
      diperintahOleh:'',entries:[emptyEntry()]}));
    setChain([]);setTab(0);
  };
  const onSup = nama=>{
    set('diperintahOleh',nama);
    const f=supOpts.find(i=>i.fullName===nama);
    set('diperintahOlehJobLevel',f?.jobLevel||'');
    set('diperintahOlehJobPosition',f?.jobPosition||'');
  };

  const setE=(i,f,v)=>setForm(p=>{const e=[...p.entries];e[i]={...e[i],[f]:v};return {...p,entries:e};});
  const selK=(i,k)=>{if(!k)return;setForm(p=>{const e=[...p.entries];e[i]={...e[i],nama:k.fullName,idKaryawan:k.employeeId||k.internalId||''};return {...p,entries:e};});};
  const addE=()=>{const n=form.entries.length;setForm(p=>({...p,entries:[...p.entries,emptyEntry()]}));setTab(n);};
  const delE=i=>{setForm(p=>({...p,entries:p.entries.filter((_,x)=>x!==i)}));setTab(p=>i<p?p-1:i===p?Math.max(0,p-1):p);};
  const dupE=i=>{setForm(p=>{const e=[...p.entries];e.splice(i+1,0,{...e[i],internalId:null,approval:0});return {...p,entries:e};});setTab(i+1);};

  const submit=async()=>{
    setFErr({});setError('');setVFields([]);setVEntry(false);
    const nE={},miss=[];
    if (!form.formType)       {nE.formType='Wajib';      miss.push('Jenis Form');}
    if (!form.lemburPada)     {nE.lemburPada='Wajib';    miss.push('Lembur Pada');}
    if (!form.department)     {nE.department='Wajib';    miss.push('Divisi');}
    if (!form.class)          {nE.class='Wajib';         miss.push('Class');}
    if (!form.tanggalPengajuan){nE.tanggalPengajuan='Wajib';miss.push('Tanggal');}
    if (!form.diperintahOleh) {nE.diperintahOleh='Wajib';miss.push('Diperintah Oleh');}
    const ee=[];let hasE=false;
    form.entries.forEach((e,i)=>{
      const err={};
      if(!e.nama){err.nama='Wajib';hasE=true;}
      if(!e.tanggalLembur){err.tanggalLembur='Wajib';hasE=true;}
      if(!e.jamMulai){err.jamMulai='Wajib';hasE=true;}
      if(!e.jamSelesai){err.jamSelesai='Wajib';hasE=true;}
      if(!e.tugas){err.tugas='Wajib';hasE=true;}
      if(!e.hasil){err.hasil='Wajib';hasE=true;}
      if(!e.kompensasi){err.kompensasi='Wajib';hasE=true;}
      ee[i]=err;
    });
    if (miss.length||hasE){setFErr({...nE,entries:hasE?ee:[]});setVFields(miss);setVEntry(hasE);return;}
    try {
      setSaving(true);
      const payload={...form,jenisForm:form.formType,tanggalPengajuan:dispDate(form.tanggalPengajuan)||form.tanggalPengajuan};
      if (isEdit){await axios.put(`${API}/${id}`,payload);setSuccess('Perubahan form lembur sudah berhasil disimpan.');}
      else{const r=await axios.post(API,payload);setFormNum(r.data.data?.nomerForm||'');setSuccess('Pengajuan lembur berhasil dikirim dan masuk ke proses persetujuan.');}
    } catch {setError('Gagal menyimpan form.');}
    finally {setSaving(false);}
  };

  if (loading) return <Box sx={{display:'flex',justifyContent:'center',pt:10}}><CircularProgress/></Box>;

  const selType   = FORM_TYPE_OPTIONS.find(o=>o.value===form.formType)||FORM_TYPE_OPTIONS[1];
  const isOpenT   = OPEN_FORM_TYPES.includes(form.formType);
  const uDepts    = [...new Set(depts.map(d=>d.department).filter(Boolean))];
  const deptLock  = !adm&&!isOpenT&&uDepts.length<=1;
  const deptName  = form.department||findDept(depts,form)?.department||'';
  const clsOpts   = depts.filter(d=>d.department===deptName);
  const deptOk    = Boolean(form.department&&form.class);
  const ent       = form.entries[tab]||form.entries[0];
  const entErr    = fErr.entries?.[tab]||{};
  const done      = form.entries.filter(e=>e.nama&&e.tanggalLembur&&e.jamMulai&&e.jamSelesai&&e.tugas&&e.hasil&&e.kompensasi).length;
  const typeLock  = available.length<=1;

  /* shared card style */
  const panel = {
    border:'1px solid rgba(26,42,87,0.1)',
    borderRadius:'14px',
    bgcolor:'#fff',
    boxShadow:'0 2px 8px rgba(26,42,87,0.07),0 1px 2px rgba(15,23,42,0.04)',
  };

  return (
    <Box sx={rootSx}>
      <CardBigBox
        eyebrow={isEdit?'Edit Form':'Pengajuan Baru'}
        title={`Form Lembur ${selType.label}`}
        headerAction={
          <Button variant="contained" size="small" startIcon={<PersonAddAlt1RoundedIcon/>} onClick={addE}
            sx={{display:{xs:'none',sm:'inline-flex'},minHeight:{xs:42,sm:34},borderRadius:'9px',textTransform:'none',fontSize:{xs:13.5,sm:12.5},fontWeight:700,
              px:{xs:1.25,sm:1.75},whiteSpace:'nowrap',
              background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',
              boxShadow:'0 3px 10px rgba(42,157,143,0.32)',
              '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 5px 16px rgba(42,157,143,0.42)',transform:'translateY(-1px)'},
              transition:'all .18s'}}>
            <Box component="span" sx={{display:{xs:'none',sm:'inline'}}}>Tambah </Box>Karyawan
          </Button>
        }
        style={{boxShadow:'none',border:'1px solid rgba(26,42,87,0.1)'}}
      >
        {/* ── two-column layout inside scrollable card body ── */}
        <Box sx={{
          display:'flex', flexDirection:{xs:'column',md:'row'},
          gap:2.5, alignItems:'flex-start',
          animation:'fadeUp .4s ease both',
        }}>

          {/* ══════════════════════════════════════════════
              LEFT — Informasi Form (fixed width card)
          ══════════════════════════════════════════════ */}
          <Box sx={{
            ...panel,
            width:{xs:'100%',md:292},
            flexShrink:0,
            p:2.5,
            bgcolor:'#f8fafc',
            position:{md:'sticky'},
            top:0,
          }}>

            <SLabel icon={AssignmentRoundedIcon}>Jenis Lembur</SLabel>
            <Box sx={{display:'flex',flexDirection:'column',gap:1,mb:2.5}}>
              <TextField fullWidth select label="Jenis Form *" value={form.formType}
                onChange={e=>onType(e.target.value)} disabled={typeLock}
                error={Boolean(fErr.formType)} helperText={fErr.formType||undefined}
                >
                <MenuItem value=""><em style={{color:'#94a3b8'}}>Pilih jenis form...</em></MenuItem>
                {available.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField fullWidth select label="Lembur Pada *" value={form.lemburPada}
                onChange={e=>set('lemburPada',e.target.value)}
                error={Boolean(fErr.lemburPada)} helperText={fErr.lemburPada||undefined}
                >
                <MenuItem value=""><em style={{color:'#94a3b8'}}>Pilih hari lembur...</em></MenuItem>
                {LEMBUR_PADA_OPTIONS.map(o=><MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Box>

            <Divider sx={{mb:2.5,borderColor:'rgba(26,42,87,0.08)'}}/>

            <SLabel icon={CorporateFareRoundedIcon}>Organisasi</SLabel>
            <Box sx={{display:'flex',flexDirection:'column',gap:1,mb:2.5}}>
              <Autocomplete
                options={uDepts} value={deptName||null}
                onChange={(_,v)=>onDept(v||'')} disabled={deptLock}
                renderInput={p=>(
                  <TextField {...p} label="Divisi *" placeholder="Pilih divisi..."
                    error={Boolean(fErr.department)} helperText={fErr.department||undefined}
                    InputLabelProps={p.InputLabelProps}/>
                )}
                noOptionsText="Divisi tidak ditemukan"
              />
              <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'minmax(0,1fr) 92px'},gap:1}}>
                <Autocomplete
                  options={clsOpts} getOptionLabel={o=>o.class||''}
                  isOptionEqualToValue={(o,v)=>o.class===v.class}
                  value={clsOpts.find(d=>d.class===form.class)||null}
                  onChange={(_,v)=>onClass(v?.class||'')}
                  disabled={!form.department||deptLock}
                  renderOption={(props,opt)=>(
                    <Box component="li" {...props}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                        <Chip label={opt.kodeDivisi} size="small" color="primary" sx={{fontSize:10,height:18,borderRadius:'5px'}}/>
                        <Typography variant="body2" fontSize="0.82rem">{opt.class}</Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={p=>(
                    <TextField {...p} label="Class *"
                      placeholder={form.department?'Pilih class...':''}
                      error={Boolean(fErr.class)} helperText={fErr.class||undefined}
                      InputLabelProps={p.InputLabelProps}/>
                  )}
                  noOptionsText="Tidak ditemukan"
                />
                <TextField label="Kode" value={form.kodeDivisi}
                  InputProps={{readOnly:true}} placeholder="-"/>
              </Box>
              <DateField label="Tanggal Pengajuan *" value={form.tanggalPengajuan}
                onChange={v=>set('tanggalPengajuan',v)}
                error={Boolean(fErr.tanggalPengajuan)} helperText={fErr.tanggalPengajuan||undefined}/>
            </Box>

            <Divider sx={{mb:2.5,borderColor:'rgba(26,42,87,0.08)'}}/>

            <SLabel icon={ManageAccountsRoundedIcon}>Diperintah Oleh</SLabel>
            <Autocomplete
              options={supOpts.map(k=>k.fullName)} value={form.diperintahOleh||null}
              onChange={(_,v)=>onSup(v||'')} disabled={!deptOk}
              renderOption={(props,opt)=>{
                const p=supOpts.find(k=>k.fullName===opt);
                return (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} fontSize="0.85rem">{opt}</Typography>
                      {p?.jobPosition&&<Typography variant="caption" color="text.secondary" fontSize="0.75rem">{p.jobLevel} · {p.jobPosition}</Typography>}
                    </Box>
                  </Box>
                );
              }}
              renderInput={p=>(
                <TextField {...p} label="Atasan / Pemberi Perintah *"
                  placeholder={deptOk?'Cari nama atasan...':'Pilih divisi & class dulu'}
                  error={Boolean(fErr.diperintahOleh)} helperText={fErr.diperintahOleh||undefined}
                  InputLabelProps={p.InputLabelProps}/>
              )}
            />
          </Box>

          {/* ══════════════════════════════════════════════
              RIGHT — Detail Karyawan
          ══════════════════════════════════════════════ */}
          <Box sx={{flex:1,minWidth:0,width:'100%',display:'flex',flexDirection:'column',gap:{xs:2.5,sm:2}}}>

            {/* ── tab bar ── */}
            <Box sx={{...panel,width:'100%',overflow:'hidden'}}>
              {/* header row — never wraps */}
              <Box sx={{
                display:'flex',alignItems:'center',justifyContent:'space-between',
                px:{xs:2.25,sm:1.5},py:{xs:1.35,sm:1},gap:1,
                borderBottom:'1px solid rgba(26,42,87,0.07)',
                bgcolor:'rgba(26,42,87,0.02)',
              }}>
                <Box sx={{display:'flex',alignItems:'center',gap:0.75,minWidth:0,overflow:'hidden'}}>
                  <Typography sx={{fontWeight:800,fontSize:{xs:'0.9rem',sm:'0.72rem'},color:'#1a2a57',
                    textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>
                    Daftar Karyawan
                  </Typography>
                  <Chip
                    label={`${done}/${form.entries.length}`} size="small"
                    color={done===form.entries.length?'success':'default'}
                    variant={done===form.entries.length?'filled':'outlined'}
                    sx={{borderRadius:'7px',fontWeight:700,fontSize:{xs:'0.78rem',sm:'0.62rem'},height:{xs:26,sm:17},px:{xs:0.4,sm:0},flexShrink:0,
                      ...(done!==form.entries.length?{borderColor:'rgba(26,42,87,0.22)',color:'#2d4a8c'}:{})}}
                  />
                </Box>
                <Box sx={{display:'flex',gap:0.5,flexShrink:0}}>
                  <Tooltip title="Duplikat entri" placement="top">
                    <IconButton size="small" onClick={()=>dupE(tab)} sx={{
                      width:{xs:38,sm:26},height:{xs:38,sm:26},borderRadius:{xs:'9px',sm:'7px'},
                      border:'1px solid rgba(42,157,143,0.28)',color:'#2a9d8f',bgcolor:'rgba(42,157,143,0.06)',
                      '&:hover':{bgcolor:'rgba(42,157,143,0.12)',borderColor:'#2a9d8f'},
                      transition:'all .15s',
                    }}>
                      <ContentCopyRoundedIcon sx={{fontSize:{xs:18,sm:11}}}/>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hapus entri" placement="top">
                    <span>
                      <IconButton size="small" onClick={()=>delE(tab)} disabled={form.entries.length===1} sx={{
                        width:{xs:38,sm:26},height:{xs:38,sm:26},borderRadius:{xs:'9px',sm:'7px'},
                        border:'1px solid rgba(231,111,81,0.3)',color:'#e76f51',bgcolor:'rgba(231,111,81,0.06)',
                        '&:hover':{bgcolor:'rgba(231,111,81,0.12)',borderColor:'#e76f51'},
                        '&.Mui-disabled':{opacity:.3,borderColor:'rgba(0,0,0,0.08)'},
                        transition:'all .15s',
                      }}>
                        <PersonRemoveRoundedIcon sx={{fontSize:{xs:18,sm:11}}}/>
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              {/* pills — horizontal scroll on mobile, wrap on desktop */}
              <Box sx={{display:{xs:'block',sm:'none'},px:2.25,pt:1.25,pb:0.4}}>
                <Button fullWidth variant="contained" startIcon={<PersonAddAlt1RoundedIcon/>} onClick={addE}
                  sx={{minHeight:46,borderRadius:'11px',textTransform:'none',fontSize:'0.95rem',fontWeight:700,
                    background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',
                    boxShadow:'0 4px 14px rgba(42,157,143,0.28)',
                    '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 6px 18px rgba(42,157,143,0.4)'}}}>
                  Tambah Karyawan
                </Button>
              </Box>
              <Box sx={{
                display:'flex',gap:{xs:0.9,sm:0.5},p:{xs:1.5,sm:1},
                overflowX:{xs:'auto',md:'visible'},
                overflowY:'hidden',
                flexWrap:{xs:'nowrap',md:'wrap'},
                WebkitOverflowScrolling:'touch',
                scrollbarWidth:'none','&::-webkit-scrollbar':{display:'none'},
              }}>
                {form.entries.map((e,i)=>{
                  const ok=Boolean(e.nama&&e.tanggalLembur&&e.jamMulai&&e.jamSelesai&&e.tugas&&e.hasil&&e.kompensasi);
                  const er=Boolean(fErr.entries?.[i]?.nama||fErr.entries?.[i]?.tanggalLembur);
                  const ac=i===tab;
                  return (
                    <Box key={i} component="button" type="button" onClick={()=>setTab(i)} sx={{
                      display:'flex',alignItems:'center',gap:0.75,flexShrink:0,
                      width:'auto',
                      minWidth:{xs:'max-content',sm:'auto'},
                      justifyContent:'center',
                      px:{xs:1.6,sm:1.25},py:{xs:1.15,sm:0.75},borderRadius:{xs:'12px',sm:'8px'},cursor:'pointer',
                      border:'none',
                      background:ac?'linear-gradient(135deg,#1a2a57 0%,#2d4a8c 100%)':'rgba(26,42,87,0.06)',
                      outline:ac?'none':'1px solid rgba(26,42,87,0.1)',
                      fontFamily:'inherit',fontSize:{xs:'0.96rem',sm:'0.75rem'},fontWeight:700,
                      color:er?'#dc2626':ac?'#fff':'#2d4a8c',
                      whiteSpace:'nowrap',transition:'all .15s',
                      boxShadow:ac?'0 2px 8px rgba(26,42,87,0.18)':'none',
                      animation:`pop .2s cubic-bezier(.22,1,.36,1) ${i*.04}s both`,
                      '&:hover':{background:ac?'linear-gradient(135deg,#162247 0%,#243d7a 100%)':'rgba(26,42,87,0.1)',color:ac?'#fff':'#1a2a57'},
                    }}>
                      <Box sx={{width:{xs:8,sm:5},height:{xs:8,sm:5},borderRadius:'50%',flexShrink:0,
                        bgcolor:er?'#e76f51':ok?'#2a9d8f':ac?'rgba(255,255,255,0.6)':'rgba(26,42,87,0.18)'}}/>
                      <Box sx={{width:{xs:24,sm:15},height:{xs:24,sm:15},borderRadius:'50%',flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontWeight:800,fontSize:{xs:'0.8rem',sm:'0.55rem'},
                        bgcolor:ac?'rgba(255,255,255,0.18)':'rgba(26,42,87,0.08)',
                        color:ac?'#fff':'#2d4a8c'}}>
                        {i+1}
                      </Box>
                      <Box component="span" sx={{maxWidth:{xs:156,sm:96,md:110},overflow:'hidden',textOverflow:'ellipsis'}}>
                        {e.nama||`Karyawan ${i+1}`}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* ── entry card ── */}
            {ent && (
              <Box key={tab} sx={{...panel,width:'100%',overflow:'hidden',animation:'fadeUp .28s ease both'}}>
                {/* card header */}
                <Box sx={{
                  display:'flex',alignItems:'center',gap:1.5,
                  px:{xs:2.25,sm:2},py:{xs:1.85,sm:1.5},
                  background:'linear-gradient(135deg,rgba(26,42,87,0.04) 0%,rgba(42,157,143,0.06) 100%)',
                  borderBottom:'1px solid rgba(26,42,87,0.08)',
                }}>
                  <Box sx={{
                    width:{xs:46,sm:38},height:{xs:46,sm:38},borderRadius:{xs:'12px',sm:'10px'},flexShrink:0,
                    background:'linear-gradient(135deg,#1a2a57 0%,#2d4a8c 100%)',color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontWeight:800,fontSize:{xs:15,sm:13},
                    boxShadow:'0 3px 10px rgba(26,42,87,0.28)',
                    animation:'pop .24s cubic-bezier(.22,1,.36,1) both',
                  }}>
                    {initials(ent.nama)}
                  </Box>
                  <Box sx={{minWidth:0,flex:1}}>
                    <Typography sx={{fontSize:{xs:'0.76rem',sm:'0.62rem'},textTransform:'uppercase',letterSpacing:'0.07em',color:'#2a9d8f',fontWeight:800,display:'block'}}>
                      Entri Aktif
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#1a2a57" noWrap fontSize={{xs:'1rem',sm:'0.88rem'}}>
                      {ent.nama||`Karyawan ${tab+1}`}
                    </Typography>
                  </Box>
                  <Box sx={{display:'flex',gap:0.5,flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    <Chip label={`${tab+1} / ${form.entries.length}`} size="small" variant="outlined"
                      sx={{borderRadius:'7px',fontWeight:700,fontSize:{xs:'0.78rem',sm:'0.68rem'},height:{xs:25,sm:20},borderColor:'rgba(15,23,42,0.18)',color:'#475569'}}/>
                    {ent.idKaryawan&&(
                      <Chip label={ent.idKaryawan} size="small" color="primary" variant="filled"
                        sx={{borderRadius:'7px',fontWeight:700,fontSize:{xs:'0.78rem',sm:'0.68rem'},height:{xs:25,sm:20}}}/>
                    )}
                  </Box>
                </Box>

                {/* fields */}
                <Box sx={{p:{xs:2.25,sm:2},display:'flex',flexDirection:'column',gap:{xs:1.75,sm:1.5}}}>
                  <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                    <Box sx={{width:{xs:28,sm:22},height:{xs:28,sm:22},borderRadius:'7px',background:'linear-gradient(135deg,rgba(42,157,143,0.15),rgba(42,157,143,0.25))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <BadgeRoundedIcon sx={{fontSize:{xs:16,sm:13},color:'#2a9d8f'}}/>
                    </Box>
                    <Typography sx={{fontWeight:800,fontSize:{xs:'0.82rem',sm:'0.68rem'},color:'#2a9d8f',textTransform:'uppercase',letterSpacing:'0.07em'}}>
                      Data Karyawan
                    </Typography>
                  </Box>

                  <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'minmax(0,1fr) 170px'},gap:1.5}}>
                    <Autocomplete
                      options={kOpts} getOptionLabel={o=>o.fullName}
                      value={kOpts.find(i=>i.fullName===ent.nama)||null}
                      onChange={(_,v)=>v?selK(tab,v):setE(tab,'nama','')}
                      disabled={!deptOk} freeSolo
                      onInputChange={(_,v)=>setE(tab,'nama',v)}
                      renderOption={(props,opt)=>(
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={600} fontSize="0.85rem">{opt.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary" fontSize="0.75rem">{opt.employeeId} — {opt.jobPosition}</Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={p=>(
                        <TextField {...p} label="Nama Karyawan *"
                          placeholder={deptOk?'Cari nama karyawan...':'Pilih divisi & class dulu'}
                          error={Boolean(entErr.nama)} helperText={entErr.nama||undefined}
                          InputLabelProps={p.InputLabelProps}
                          InputProps={{...p.InputProps,startAdornment:(<InputAdornment position="start"><PersonSearchIcon fontSize="small" color="action"/></InputAdornment>)}}
                        />
                      )}
                      noOptionsText={deptOk?'Tidak ada karyawan':'Pilih divisi & class dulu'}
                    />
                    <TextField fullWidth label="ID Karyawan" value={ent.idKaryawan}
                      InputProps={{readOnly:true}} placeholder="-"/>
                  </Box>

                  <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr 1fr'},gap:1.5}}>
                    <DateField label="Tanggal Lembur *" value={ent.tanggalLembur}
                      onChange={v=>setE(tab,'tanggalLembur',v)}
                      error={Boolean(entErr.tanggalLembur)} helperText={entErr.tanggalLembur||undefined}/>
                    <TimeField label="Jam Mulai *" value={ent.jamMulai}
                      onChange={v=>setE(tab,'jamMulai',v)}
                      error={Boolean(entErr.jamMulai)} helperText={entErr.jamMulai||undefined}/>
                    <TimeField label="Jam Selesai *" value={ent.jamSelesai}
                      onChange={v=>setE(tab,'jamSelesai',v)}
                      error={Boolean(entErr.jamSelesai)} helperText={entErr.jamSelesai||undefined}/>
                  </Box>

                  <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},gap:1.5}}>
                    <TextField label="Tugas / Pekerjaan *" value={ent.tugas}
                      onChange={e=>setE(tab,'tugas',e.target.value)}
                      placeholder="Deskripsi pekerjaan lembur..."
                      error={Boolean(entErr.tugas)} helperText={entErr.tugas||undefined}/>
                    <TextField label="Hasil *" value={ent.hasil}
                      onChange={e=>setE(tab,'hasil',e.target.value)}
                      placeholder="Hasil yang dicapai..."
                      error={Boolean(entErr.hasil)} helperText={entErr.hasil||undefined}/>
                  </Box>

                  <KompensasiField
                    value={ent.kompensasi}
                    onChange={v=>setE(tab,'kompensasi',v)}
                    error={Boolean(entErr.kompensasi)} helperText={entErr.kompensasi||undefined}/>
                </Box>
              </Box>
            )}

            {/* ── action bar ── */}
            <Box sx={{
              display:'flex',flexDirection:{xs:'column',sm:'row'},
              gap:1,justifyContent:'flex-end',alignItems:{xs:'stretch',sm:'center'},
              pb:0.5,
            }}>
              {(vFields.length>0||vEntry)&&(
                <Typography variant="caption" sx={{color:'error.main',fontWeight:600,flex:1,fontSize:{xs:'0.82rem',sm:'0.72rem'}}}>
                  {vFields.length>0?`Lengkapi: ${vFields.join(', ')}`:''}
                  {vFields.length>0&&vEntry?' · ':''}
                  {vEntry?'Data entri belum lengkap':''}
                </Typography>
              )}
              <Button variant="outlined" startIcon={<ArrowBackRoundedIcon/>} onClick={()=>navigate('/')}
                sx={{minHeight:{xs:46,sm:40},borderRadius:'10px',textTransform:'none',fontWeight:700,px:2.5,fontSize:{xs:'0.95rem',sm:'0.875rem'},
                  borderColor:'rgba(26,42,87,0.22)',color:'#2d4a8c',bgcolor:'rgba(26,42,87,0.03)',
                  '&:hover':{borderColor:'#1a2a57',bgcolor:'rgba(26,42,87,0.07)',transform:'translateY(-1px)'},
                  transition:'all .18s',boxShadow:'none'}}>
                Kembali
              </Button>
              <Button variant="contained"
                startIcon={saving?<CircularProgress size={16} color="inherit"/>:<SaveIcon/>}
                onClick={submit} disabled={saving}
                sx={{minHeight:{xs:46,sm:40},borderRadius:'10px',textTransform:'none',fontWeight:700,px:2.5,fontSize:{xs:'0.95rem',sm:'0.875rem'},
                  minWidth:{xs:'100%',sm:210},color:'#fff',
                  background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',
                  boxShadow:'0 4px 14px rgba(42,157,143,0.34)',
                  '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 6px 20px rgba(42,157,143,0.44)',transform:'translateY(-1px)'},
                  '&.Mui-disabled':{background:'linear-gradient(135deg,#99d4cf,#7dc4be)',color:'#fff',boxShadow:'none'},
                  transition:'all .18s'}}>
                {saving?'Menyimpan...':isEdit?'Simpan Perubahan':form.entries.length===1?'Kirim Pengajuan':`Kirim ${form.entries.length} Data Karyawan`}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardBigBox>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={()=>setError('')}
        anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
        <Alert severity="error" onClose={()=>setError('')}>{error}</Alert>
      </Snackbar>

      {success && (
        <Box sx={{
          position:'fixed',
          top:{xs:'50%',sm:'50%'},
          left:{xs:12,sm:'50%'},
          right:{xs:12,sm:'auto'},
          transform:{xs:'translateY(-50%)',sm:'translate(-50%, -50%)'},
          zIndex:1400,
          width:{xs:'calc(100% - 24px)',sm:400},
          minWidth:{xs:0,sm:400},
          maxWidth:{xs:'calc(100% - 24px)',sm:400},
          '@keyframes toastFloatIn':{
            '0%':{opacity:0,transform:'translateY(-50%) scale(0.94)'},
            '60%':{opacity:1,transform:'translateY(-50%) scale(1.01)'},
            '100%':{opacity:1,transform:'translateY(-50%) scale(1)'},
          },
          '@keyframes toastFadeOut':{from:{opacity:1},to:{opacity:0}},
          animation:'toastFloatIn 0.5s cubic-bezier(0.22,1,0.36,1) both, toastFadeOut 0.3s ease 4.2s forwards',
        }}>
          <Box sx={{
            borderRadius:'18px',
            overflow:'hidden',
            boxShadow:'0 16px 44px rgba(15,23,42,0.22), 0 4px 14px rgba(15,23,42,0.12)',
            border:'1px solid rgba(16,185,129,0.28)',
            backdropFilter:'blur(12px)',
          }}>
            <Box sx={{
              background:'linear-gradient(145deg,#059669 0%,#10b981 55%,#34d399 100%)',
              position:'relative',
              px:2.25,
              py:1.75,
              display:'flex',
              alignItems:'center',
              gap:1.5,
              '&::before':{
                content:'""',
                position:'absolute',
                inset:0,
                background:'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0))',
                pointerEvents:'none',
              },
            }}>
              <Box sx={{
                width:42,
                height:42,
                borderRadius:'14px',
                flexShrink:0,
                background:'rgba(255,255,255,0.16)',
                border:'1px solid rgba(255,255,255,0.22)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.14)',
              }}>
                <CheckCircleRoundedIcon sx={{fontSize:24,color:'#fff'}}/>
              </Box>
              <Box sx={{flex:1,minWidth:0,position:'relative',zIndex:1}}>
                <Box sx={{
                  display:'inline-flex',
                  alignItems:'center',
                  px:1.15,
                  py:0.45,
                  mb:0.8,
                  borderRadius:'999px',
                  background:'rgba(255,255,255,0.22)',
                  border:'1px solid rgba(255,255,255,0.28)',
                }}>
                  <Typography sx={{
                    color:'#fff',
                    fontSize:'0.7rem',
                    fontWeight:900,
                    letterSpacing:'0.08em',
                    textTransform:'uppercase',
                    lineHeight:1,
                    textShadow:'0 1px 2px rgba(0,0,0,0.12)',
                  }}>
                    Pengajuan Lembur
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{color:'#fff',fontWeight:900,lineHeight:1.2,fontSize:{xs:'1.08rem',sm:'1.02rem'},textShadow:'0 2px 10px rgba(0,0,0,0.16)'}}>
                  {isEdit?'Perubahan Berhasil Disimpan':'Pengajuan Berhasil Dikirim'}
                </Typography>
                <Typography variant="caption" sx={{
                  color:'#f8fffc',
                  display:'block',
                  mt:0.75,
                  px:1.1,
                  py:0.8,
                  borderRadius:'12px',
                  background:'rgba(7,59,46,0.18)',
                  border:'1px solid rgba(255,255,255,0.14)',
                  fontSize:{xs:'0.82rem',sm:'0.78rem'},
                  fontWeight:600,
                  lineHeight:1.6,
                  textShadow:'0 1px 2px rgba(0,0,0,0.14)',
                }}>
                  {formNum&&!isEdit?`${success} Nomor form Anda: ${formNum}.`:success}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
