const { v4: uuidv4 }        = require('uuid');
const pool                  = require('../config/db');
const { MANAGER_KEYS, isHCGAPrivileged } = require('../constants/roles');
const { formatDate, generateFormNumber } = require('../utils/date');

/* ── Mappers ─────────────────────────────────────────────────── */

function mapForm(row) {
  return {
    id:              row.id,
    formNumber:      row.form_number,
    formSequence:    row.form_sequence,
    department:      row.department,
    class:           row.class,
    overtimeDay:     row.overtime_day,
    formType:        row.form_type,
    formCreatedDate: row.form_created_date,
    submissionDate:  row.submission_date,
    requestedBy:     row.requested_by,
    email:           row.email,
    divisionCode:    row.division_code,
    status:          row.status,
    approvalNotes:   row.approval_notes,
    approvedBy:      row.approved_by,
    approvedAt:      row.approved_at,
    rejectedBy:      row.rejected_by,
  };
}

function mapEntry(row) {
  return {
    id:           row.id,
    sequence:     row.sequence,
    name:         row.name,
    employeeId:   row.employee_id,
    overtimeDate: row.overtime_date,
    startTime:    row.start_time,
    endTime:      row.end_time,
    task:         row.task,
    result:       row.result,
    compensation: row.compensation,
    approval:     row.approval,
  };
}

/* ── DB Helpers ──────────────────────────────────────────────── */

async function getFormWithEntries(id) {
  const [[form]] = await pool.query('SELECT * FROM lembur_forms WHERE id = ?', [id]);
  if (!form) return null;
  const [entries] = await pool.query(
    'SELECT * FROM lembur_entries WHERE form_id = ? ORDER BY sequence', [id]
  );
  return { ...mapForm(form), entries: entries.map(mapEntry) };
}

async function insertEntries(formId, entries, startSequence) {
  let counter = startSequence;
  for (const e of entries) {
    counter++;
    await pool.query(
      `INSERT INTO lembur_entries
         (form_id, sequence, name, employee_id, overtime_date, start_time, end_time, task, result, compensation, approval)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [formId, counter, e.name, e.employeeId, e.overtimeDate, e.startTime, e.endTime, e.task, e.result, e.compensation ?? null]
    );
  }
}

async function getApproverProfile(userId) {
  const [rows] = await pool.query(
    `SELECT md.name AS dept_name, mjl.name AS job_level_name
     FROM central_users cu
     LEFT JOIN central_user_departments cud ON cu.id = cud.user_id AND cud.is_primary = 1
     LEFT JOIN master_departments md ON cud.department_id = md.id
     LEFT JOIN master_job_levels mjl ON cu.job_level_id = mjl.id
     WHERE cu.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function checkApproverAuth(reqUser, form) {
  if (reqUser.role === 'admin') return null;
  const isElvira = (reqUser.name || '').toLowerCase().includes('elvira');
  if (isElvira) return 'You have view-only access and cannot approve forms.';
  const approver = await getApproverProfile(reqUser.id);
  const lvl  = (approver?.job_level_name || '').toLowerCase();
  const dept = approver?.dept_name || '';
  const isMgr = MANAGER_KEYS.some(k => lvl.includes(k));
  if (form.form_type === 'manager') {
    return 'Only BOD/Admin can approve overtime forms for Manager-level employees.';
  }
  if (!isMgr || dept !== form.department) {
    return 'You do not have authority to approve this form.';
  }
  return null;
}

const ALLOWED_SORT = {
  formNumber:     'form_number',
  department:     'department',
  requestedBy:    'requested_by',
  submissionDate: 'submission_date',
  overtimeDay:    'overtime_day',
  status:         'status',
};

/* ── Route Handlers ──────────────────────────────────────────── */

async function getDashboard(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const canSeeAll   = req.user.role === 'admin' || isHCGAPrivileged(req.user);
    const whereClause = canSeeAll ? '1=1' : 'department = ?';
    const whereParams = canSeeAll ? []    : [req.user.department || ''];

    /* single query: all status counts */
    const [[counts]] = await pool.query(
      `SELECT
         COUNT(*)                                AS total,
         SUM(status = 'approved')                AS approved,
         SUM(status = 'pending')                 AS pending,
         SUM(status = 'partially_approved')      AS partiallyApproved,
         SUM(status = 'rejected')                AS rejected
       FROM lembur_forms
       WHERE ${whereClause}`,
      whereParams
    );

    /* top 5 departments by form count */
    const [topDepartments] = await pool.query(
      `SELECT department, COUNT(*) AS count
       FROM   lembur_forms
       WHERE  ${whereClause} AND department IS NOT NULL
       GROUP  BY department
       ORDER  BY count DESC
       LIMIT  5`,
      whereParams
    );

    /* paginated recent forms — order by form_sequence (integer) for correct chronological order */
    const [recentRows] = await pool.query(
      `SELECT * FROM lembur_forms
       WHERE  ${whereClause}
       ORDER  BY form_sequence DESC
       LIMIT  ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    let recentForms = [];
    if (recentRows.length > 0) {
      const ids = recentRows.map(f => f.id);
      const [entries] = await pool.query(
        `SELECT * FROM lembur_entries WHERE form_id IN (?) ORDER BY sequence`,
        [ids]
      );
      const entryMap = {};
      for (const e of entries) {
        if (!entryMap[e.form_id]) entryMap[e.form_id] = [];
        entryMap[e.form_id].push(mapEntry(e));
      }
      recentForms = recentRows.map(f => ({ ...mapForm(f), entries: entryMap[f.id] || [] }));
    }

    const total      = Number(counts.total);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      data: {
        stats: {
          total,
          approved:          Number(counts.approved)          || 0,
          pending:           Number(counts.pending)           || 0,
          partiallyApproved: Number(counts.partiallyApproved) || 0,
          rejected:          Number(counts.rejected)          || 0,
        },
        topDepartments: topDepartments.map(r => ({
          department: r.department,
          count:      Number(r.count),
        })),
        recentForms: {
          data: recentForms,
          pagination: { page, limit, total, totalPages },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFilterOptions(req, res) {
  try {
    const { status } = req.query;
    let whereSql = 'department IS NOT NULL';
    const params = [];
    if (status) {
      const list = status.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length === 1)      { whereSql += ' AND status = ?'; params.push(list[0]); }
      else if (list.length > 1)  { whereSql += ` AND status IN (${list.map(() => '?').join(',')})`; params.push(...list); }
    } else {
      whereSql += " AND status IN ('approved','partially_approved','rejected')";
    }
    const [rows] = await pool.query(
      `SELECT DISTINCT department FROM lembur_forms WHERE ${whereSql} ORDER BY department ASC`, params
    );
    res.json({ success: true, data: { departments: rows.map(r => r.department) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getStats(req, res) {
  try {
    const [[stats]] = await pool.query(`
      SELECT COUNT(*) AS total,
             SUM(status = 'approved')           AS approved,
             SUM(status = 'pending')            AS pending,
             SUM(status = 'partially_approved') AS partially_approved,
             SUM(status = 'rejected')           AS rejected
      FROM lembur_forms
    `);
    const [[entryStats]] = await pool.query(`
      SELECT COUNT(*) AS totalEntries,
             SUM(CASE WHEN compensation REGEXP '^[0-9]+(\.[0-9]+)?$' THEN CAST(compensation AS DECIMAL(15,2)) ELSE 0 END) AS totalKompensasi
      FROM lembur_entries
    `);
    res.json({
      success: true,
      data: {
        total:            stats.total,
        approved:         stats.approved || 0,
        pending:          stats.pending || 0,
        partiallyApproved:stats.partially_approved || 0,
        rejected:         stats.rejected || 0,
        totalEntries:     entryStats.totalEntries || 0,
        totalKompensasi:  entryStats.totalKompensasi || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAll(req, res) {
  try {
    const { status, statuses, department, divisionCode, formType, search, filterDate, sortKey, sortDirection, page, rowsPerPage } = req.query;

    let whereSql = '1=1';
    const whereParams = [];

    if (statuses) {
      const list = statuses.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length === 1)     { whereSql += ' AND status = ?'; whereParams.push(list[0]); }
      else if (list.length > 1) { whereSql += ` AND status IN (${list.map(() => '?').join(',')})`; whereParams.push(...list); }
    } else if (status) {
      whereSql += ' AND status = ?'; whereParams.push(status);
    }

    if (req.query.excludePending === 'true') whereSql += " AND status != 'pending'";

    const canViewAll = req.user.role === 'admin' || isHCGAPrivileged(req.user);
    if (!canViewAll) {
      whereSql += ' AND department = ?'; whereParams.push(req.user.department || '');
    } else if (department) {
      whereSql += ' AND department = ?'; whereParams.push(department);
    }

    if (divisionCode) { whereSql += ' AND division_code = ?'; whereParams.push(divisionCode); }
    if (formType)     { whereSql += ' AND form_type = ?';    whereParams.push(formType); }

    if (filterDate) {
      const [y, m, d] = filterDate.split('-');
      whereSql += ' AND (submission_date LIKE ? OR submission_date LIKE ? OR submission_date LIKE ?)';
      whereParams.push(`%${filterDate}%`, `%${d}-${m}-${y}%`, `%${d}/${m}/${y}%`);
    }

    if (search) {
      const q = `%${search}%`;
      whereSql += ` AND (form_number LIKE ? OR department LIKE ? OR requested_by LIKE ? OR division_code LIKE ?
                   OR EXISTS (SELECT 1 FROM lembur_entries le WHERE le.form_id = lembur_forms.id AND (le.name LIKE ? OR le.employee_id LIKE ?)))`;
      whereParams.push(q, q, q, q, q, q);
    }

    const [[{ cnt: total }]] = await pool.query(`SELECT COUNT(*) AS cnt FROM lembur_forms WHERE ${whereSql}`, whereParams);

    const dbSortKey = ALLOWED_SORT[sortKey] || 'created_at';
    const dbSortDir = sortDirection === 'asc' ? 'ASC' : 'DESC';
    let dataSql = `SELECT * FROM lembur_forms WHERE ${whereSql} ORDER BY ${dbSortKey} ${dbSortDir}`;
    const dataParams = [...whereParams];

    if (rowsPerPage) {
      const pageNum  = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(rowsPerPage)));
      dataSql += ' LIMIT ? OFFSET ?';
      dataParams.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [forms] = await pool.query(dataSql, dataParams);

    let result = [];
    if (forms.length > 0) {
      const formIds = forms.map(f => f.id);
      const [allEntries] = await pool.query(
        `SELECT * FROM lembur_entries WHERE form_id IN (?) ORDER BY sequence`,
        [formIds]
      );
      const entriesMap = {};
      for (const e of allEntries) {
        if (!entriesMap[e.form_id]) entriesMap[e.form_id] = [];
        entriesMap[e.form_id].push(mapEntry(e));
      }
      result = forms.map(form => ({ ...mapForm(form), entries: entriesMap[form.id] || [] }));
    }

    res.json({ success: true, data: result, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const form = await getFormWithEntries(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const body       = req.body;
    const id         = uuidv4();
    const today      = formatDate(new Date());
    const formNumber = await generateFormNumber(body.divisionCode);
    const [[{ cnt }]]= await pool.query('SELECT COUNT(*) AS cnt FROM lembur_forms');

    await pool.query(
      `INSERT INTO lembur_forms
         (id, form_number, form_sequence, department, \`class\`, overtime_day, form_type,
          form_created_date, submission_date, requested_by, email, division_code, status, approval_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')`,
      [id, formNumber, cnt + 1,
       body.department ?? null, body.class ?? null,
       body.overtimeDay ?? null, body.formType ?? null,
       today, body.submissionDate ?? today,
       body.requestedBy ?? null, body.email ?? null, body.divisionCode ?? null]
    );

    const [[{ cnt: entryCnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_entries');
    await insertEntries(id, body.entries || [], entryCnt);

    const newForm = await getFormWithEntries(id);
    res.status(201).json({ success: true, data: newForm, message: 'Form created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const body   = req.body;

    const [check] = await pool.query('SELECT id FROM lembur_forms WHERE id = ?', [id]);
    if (!check.length) return res.status(404).json({ success: false, message: 'Form not found' });

    await pool.query(
      `UPDATE lembur_forms SET
         department = ?, \`class\` = ?, overtime_day = ?, form_type = ?,
         submission_date = ?, requested_by = ?, email = ?, division_code = ?
       WHERE id = ?`,
      [body.department ?? null, body.class ?? null,
       body.overtimeDay ?? null, body.formType ?? null,
       body.submissionDate ?? null, body.requestedBy ?? null,
       body.email ?? null, body.divisionCode ?? null, id]
    );

    if (Array.isArray(body.entries)) {
      await pool.query('DELETE FROM lembur_entries WHERE form_id = ?', [id]);
      const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_entries');
      await insertEntries(id, body.entries, cnt);
    }

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: 'Form updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function approve(req, res) {
  try {
    const { id } = req.params;
    const { approvalNotes, approvedBy, approvedEntryIndices } = req.body;

    const [forms] = await pool.query('SELECT id, form_type, department FROM lembur_forms WHERE id = ?', [id]);
    if (!forms.length) return res.status(404).json({ success: false, message: 'Form not found' });

    const authError = await checkApproverAuth(req.user, forms[0]);
    if (authError) return res.status(403).json({ success: false, message: authError });

    const [entries] = await pool.query('SELECT id FROM lembur_entries WHERE form_id = ? ORDER BY sequence', [id]);
    const total     = entries.length;
    const isPartial = Array.isArray(approvedEntryIndices) && approvedEntryIndices.length < total;
    const newStatus = isPartial ? 'partially_approved' : 'approved';

    await pool.query(
      `UPDATE lembur_forms SET status = ?, approval_notes = ?, approved_by = ?, approved_at = ?, rejected_by = NULL WHERE id = ?`,
      [newStatus, approvalNotes || '', approvedBy || '', formatDate(new Date()), id]
    );
    for (let i = 0; i < entries.length; i++) {
      const approval = isPartial ? (approvedEntryIndices.includes(i) ? 2 : 1) : 2;
      await pool.query('UPDATE lembur_entries SET approval = ? WHERE id = ?', [approval, entries[i].id]);
    }

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: `Form ${isPartial ? 'partially approved' : 'approved'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;
    const { approvalNotes, approvedBy } = req.body;

    const [forms] = await pool.query('SELECT id, form_type, department FROM lembur_forms WHERE id = ?', [id]);
    if (!forms.length) return res.status(404).json({ success: false, message: 'Form not found' });

    const authError = await checkApproverAuth(req.user, forms[0]);
    if (authError) return res.status(403).json({ success: false, message: authError });

    await pool.query(
      `UPDATE lembur_forms SET status = 'rejected', approval_notes = ?, rejected_by = ?, approved_by = NULL, approved_at = NULL WHERE id = ?`,
      [approvalNotes || '', approvedBy || '', id]
    );
    await pool.query('UPDATE lembur_entries SET approval = 0 WHERE form_id = ?', [id]);

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: 'Form rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function revert(req, res) {
  try {
    const { id } = req.params;
    const [forms] = await pool.query('SELECT id, department FROM lembur_forms WHERE id = ?', [id]);
    if (!forms.length) return res.status(404).json({ success: false, message: 'Form not found' });

    if (req.user.role !== 'admin') {
      const approver  = await getApproverProfile(req.user.id);
      const dept      = approver?.dept_name || '';
      const lvl       = (approver?.job_level_name || '').toLowerCase();
      const isMgr   = MANAGER_KEYS.some(k => lvl.includes(k));
      const allowed = isMgr && dept === forms[0].department;
      if (!allowed) return res.status(403).json({ success: false, message: 'You do not have authority to revert this form.' });
    }

    await pool.query(
      `UPDATE lembur_forms SET status = 'pending', approval_notes = '', approved_by = NULL, approved_at = NULL, rejected_by = NULL WHERE id = ?`,
      [id]
    );
    await pool.query('UPDATE lembur_entries SET approval = 0 WHERE form_id = ?', [id]);

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: 'Form reverted to queue' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM lembur_forms WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getDashboard, getFilterOptions, getStats, getAll, getById, create, update, approve, reject, revert, remove };
