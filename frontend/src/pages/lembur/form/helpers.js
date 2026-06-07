import { KOMPENSASI_PRESETS } from './constants';

const MONTH_IDX = {
  jan:1,januari:1,feb:2,februari:2,mar:3,maret:3,
  apr:4,april:4,mei:5,may:5,jun:6,juni:6,
  jul:7,juli:7,agu:8,agustus:8,aug:8,sep:9,september:9,
  okt:10,oktober:10,oct:10,october:10,nov:11,november:11,
  des:12,desember:12,dec:12,december:12,
};

const pad = v => String(v).padStart(2, '0');
const validParts = (y, m, d) => { const dt = new Date(y, m-1, d); return dt.getFullYear()===y && dt.getMonth()===m-1 && dt.getDate()===d; };

export function toIso(val) {
  if (!val) return '';
  const t = String(val).trim();
  const m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m1) { const [,y,mo,d] = m1.map(Number); return validParts(y,mo,d) ? t : ''; }
  const m2 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (m2) { const [,d,mo,y] = m2.map(Number); return validParts(y,mo,d) ? `${y}-${pad(mo)}-${pad(d)}` : ''; }
  const pts = t.replace(/,/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').split(' ');
  if (pts.length >= 3) {
    const d = Number(pts[0]), tok = pts[1].toLowerCase().replace(/\.$/, '');
    const mo = Number(tok) || MONTH_IDX[tok], y = Number(pts[2]);
    if (validParts(y,mo,d)) return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return '';
}

export function dispDate(s) {
  if (!s) return '';
  const iso = toIso(s); if (!iso) return s;
  const [y,m,d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day:'2-digit', month:'long', year:'numeric' }).format(new Date(y,m-1,d));
}

export function today() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
}

export const deptVal = d => String(d?.departmentId ?? d?.id ?? d?.department ?? '');

export function findDept(depts, form) {
  if (!depts.length) return null;
  if (form.departmentId) return depts.find(d => deptVal(d) === String(form.departmentId)) || null;
  const same = depts.filter(d => d.department === form.department);
  return same.find(d => d.class === form.class) || same.find(d => d.kodeDivisi === form.divisionCode) || same[0] || null;
}

export function toOpt(user) {
  if (!user?.fullName) return null;
  return {
    id: user.id || user.userId || user.employeeId || user.fullName,
    employeeId: user.employeeId || user.internalId || '',
    fullName: user.fullName,
    departmentId: user.departmentId || '',
    department: user.department || '',
    departmentClass: user.departmentClass || user.class || '',
    class: user.class || user.departmentClass || '',
    kodeDivisi: user.kodeDivisi || '',
    jobPosition: user.jobPosition || '',
    jobLevel: user.jobLevel || '',
    level: user.level || 1,
    status: user.status || 'Active',
    departments: user.departments || [],
  };
}

export function sameDept(person, form) {
  if (!person || (!form.departmentId && !form.department)) return false;
  const ds = [
    { departmentId: person.departmentId, department: person.department, class: person.class || person.departmentClass },
    ...(person.departments || []),
  ];
  return ds.some(d => {
    const sId = form.departmentId && String(d.departmentId || d.id || '') === String(form.departmentId);
    const sNm = form.department && (d.department || d.name) === form.department;
    return Boolean(sId || sNm);
  });
}

export function addOnce(opts, opt) {
  if (!opt) return opts;
  return opts.some(i => String(i.employeeId||'') === String(opt.employeeId||'') || i.fullName === opt.fullName)
    ? opts : [opt, ...opts];
}

export function initials(name) {
  const ps = String(name||'').trim().split(/\s+/).filter(Boolean);
  return ps.length ? ps.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') : 'KL';
}

export const emptyEntry = () => ({
  sequence: null, name: '', employeeId: '',
  overtimeDate: '', startTime: '', endTime: '',
  task: '', result: '', compensation: '', approval: 0,
});

export { KOMPENSASI_PRESETS };
