const pool = require('../config/db');
const { isHCGAPrivileged } = require('../constants/roles');

const BASE_WHERE    = "lf.status IN ('approved', 'partially_approved')";
const DEFAULT_LIMIT = 25;
const MAX_LIMIT     = 100;
const EXPORT_LIMIT  = 5000;

const SELECT_COLS = `
  lf.id              AS formId,
  lf.form_number     AS formNumber,
  lf.department,
  lf.form_type       AS formType,
  lf.overtime_day    AS overtimeDay,
  lf.submission_date AS submissionDate,
  lf.requested_by    AS requestedBy,
  lf.status          AS formStatus,
  lf.approved_by     AS approvedBy,
  lf.approved_at     AS approvedAt,
  le.id              AS entryId,
  le.sequence,
  le.name,
  le.employee_id     AS employeeId,
  le.overtime_date   AS overtimeDate,
  le.start_time      AS startTime,
  le.end_time        AS endTime,
  le.task,
  le.result,
  le.compensation,
  le.approval        AS entryApproval,
  le.talenta_input   AS talentaInput
`;

function buildFilters(query, reqUser) {
  const { formType, bulan, department, search, talentaInput } = query;
  let where = BASE_WHERE;
  const params = [];

  const canSeeAll = reqUser.role === 'admin' || isHCGAPrivileged(reqUser);
  if (!canSeeAll) {
    where += ' AND lf.department = ?';
    params.push(reqUser.department || '');
  } else if (department) {
    where += ' AND lf.department = ?';
    params.push(department);
  }

  if (formType) {
    where += ' AND lf.form_type = ?';
    params.push(formType);
  }
  if (bulan) {
    where += " AND SUBSTRING_INDEX(SUBSTRING_INDEX(le.overtime_date, '-', 2), '-', -1) = ?";
    params.push(bulan);
  }
  if (talentaInput === '1') { where += ' AND le.talenta_input = 1'; }
  if (talentaInput === '0') { where += ' AND le.talenta_input = 0'; }

  if (search) {
    const like = `%${search}%`;
    where += ` AND (
      lf.form_number  LIKE ? OR le.name        LIKE ? OR
      lf.department   LIKE ? OR lf.requested_by LIKE ? OR
      le.employee_id  LIKE ?
    )`;
    params.push(like, like, like, like, like);
  }

  return { where, params };
}

async function getFilterOptions(req, res) {
  try {
    const canSeeAll   = req.user.role === 'admin' || isHCGAPrivileged(req.user);
    const clause      = canSeeAll ? '' : ' AND lf.department = ?';
    const clauseParam = canSeeAll ? [] : [req.user.department || ''];

    const [rows] = await pool.query(
      `SELECT DISTINCT lf.department
       FROM   lembur_forms lf
       WHERE  lf.status IN ('approved', 'partially_approved')
         AND  lf.department IS NOT NULL
         ${clause}
       ORDER  BY lf.department ASC`,
      clauseParam
    );

    res.json({
      success: true,
      data: { departments: rows.map(r => r.department) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAll(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const { where, params } = buildFilters(req.query, req.user);
    const join = `FROM lembur_forms lf JOIN lembur_entries le ON le.form_id = lf.id WHERE ${where}`;

    const [[{ total, totalSudah }]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN le.talenta_input = 1 THEN 1 ELSE 0 END) AS totalSudah
       ${join}`,
      params
    );

    const totalCount = Number(total);
    const sudahCount = Number(totalSudah);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} ${join}
       ORDER  BY lf.submission_date DESC, lf.form_number ASC, le.sequence ASC
       LIMIT  ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total:      totalCount,
        totalPages,
        totalSudah: sudahCount,
        totalBelum: totalCount - sudahCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getExport(req, res) {
  try {
    const { where, params } = buildFilters(req.query, req.user);
    const join = `FROM lembur_forms lf JOIN lembur_entries le ON le.form_id = lf.id WHERE ${where}`;

    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} ${join}
       ORDER  BY lf.submission_date DESC, lf.form_number ASC, le.sequence ASC
       LIMIT  ?`,
      [...params, EXPORT_LIMIT]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function toggleTalenta(req, res) {
  try {
    const entryId = parseInt(req.params.entryId);
    if (!entryId || entryId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid entry ID.' });
    }
    const { talentaInput } = req.body;
    await pool.query(
      'UPDATE lembur_entries SET talenta_input = ? WHERE id = ?',
      [talentaInput ? 1 : 0, entryId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getFilterOptions, getAll, getExport, toggleTalenta };
