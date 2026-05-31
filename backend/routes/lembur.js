const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const BOD_KEYS = ['director', 'commissioner', 'komisaris', 'president director'];
const MANAGER_KEYS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

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


function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).replace(/ /g, '-');
}

async function generateFormNumber(divisionCode) {
  const yy = String(new Date().getFullYear()).slice(-2);
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_forms');
  const next = String(cnt + 1).padStart(5, '0');
  return `OVT-${divisionCode || 'XXX'}-${yy}-${next}`;
}

function mapForm(row) {
  return {
    id: row.id,
    nomerForm: row.form_number,
    noUrutForm: row.form_sequence,
    department: row.department,
    class: row.class,
    lemburPada: row.overtime_day,
    jenisForm: row.form_type,
    tanggalFormDibuat: row.form_created_date,
    tanggalPengajuan: row.submission_date,
    diperintahOleh: row.requested_by,
    email: row.email,
    kodeDivisi: row.division_code,
    status: row.status,
    catatanApproval: row.approval_notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectedBy: row.rejected_by,
  };
}

function mapEntry(row) {
  return {
    id: row.id,
    internalId: row.sequence,
    nama: row.name,
    idKaryawan: row.employee_id,
    tanggalLembur: row.overtime_date,
    jamMulai: row.start_time,
    jamSelesai: row.end_time,
    tugas: row.task,
    hasil: row.result,
    kompensasi: row.compensation,
    approval: row.approval,
  };
}

async function getFormWithEntries(id) {
  const [[form]] = await pool.query('SELECT * FROM lembur_forms WHERE id = ?', [id]);
  if (!form) return null;
  const [entries] = await pool.query(
    'SELECT * FROM lembur_entries WHERE form_id = ? ORDER BY sequence',
    [id]
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
      [formId, counter, e.nama, e.idKaryawan, e.tanggalLembur, e.jamMulai, e.jamSelesai, e.tugas, e.hasil, e.kompensasi ?? null]
    );
  }
}

const ALLOWED_SORT = {
  nomerForm: 'form_number',
  department: 'department',
  diperintahOleh: 'requested_by',
  tanggalPengajuan: 'submission_date',
  lemburPada: 'overtime_day',
  status: 'status',
};

// GET filter options untuk processed forms (departments unik)
router.get('/filter-options', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT department FROM lembur_forms
       WHERE status IN ('approved','partially_approved','rejected') AND department IS NOT NULL
       ORDER BY department ASC`
    );
    res.json({ success: true, data: { departments: rows.map(r => r.department) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET semua form
router.get('/', async (req, res) => {
  try {
    const { status, statuses, department, kodeDivisi, jenisForm, search, filterDate, sortKey, sortDirection, page, rowsPerPage } = req.query;

    let whereSql = '1=1';
    const whereParams = [];

    if (statuses) {
      const list = statuses.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length === 1) { whereSql += ' AND status = ?'; whereParams.push(list[0]); }
      else if (list.length > 1) { whereSql += ` AND status IN (${list.map(() => '?').join(',')})`; whereParams.push(...list); }
    } else if (status) {
      whereSql += ' AND status = ?'; whereParams.push(status);
    }

    if (req.query.excludePending === 'true') {
      whereSql += " AND status != 'pending'";
    }

    if (department) { whereSql += ' AND department = ?'; whereParams.push(department); }
    if (kodeDivisi) { whereSql += ' AND division_code = ?'; whereParams.push(kodeDivisi); }
    if (jenisForm) { whereSql += ' AND form_type = ?'; whereParams.push(jenisForm); }

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
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(rowsPerPage)));
      dataSql += ' LIMIT ? OFFSET ?';
      dataParams.push(limitNum, (pageNum - 1) * limitNum);
    }

    const [forms] = await pool.query(dataSql, dataParams);

    const result = await Promise.all(forms.map(async (form) => {
      const [entries] = await pool.query(
        'SELECT * FROM lembur_entries WHERE form_id = ? ORDER BY sequence',
        [form.id]
      );
      return { ...mapForm(form), entries: entries.map(mapEntry) };
    }));

    res.json({ success: true, data: result, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET statistik
router.get('/stats', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'approved') AS approved,
        SUM(status = 'pending') AS pending,
        SUM(status = 'partially_approved') AS partially_approved,
        SUM(status = 'rejected') AS rejected
      FROM lembur_forms
    `);
    const [[entryStats]] = await pool.query(`
      SELECT
        COUNT(*) AS totalEntries,
        SUM(CASE WHEN compensation REGEXP '^[0-9]+(\.[0-9]+)?$' THEN CAST(compensation AS DECIMAL(15,2)) ELSE 0 END) AS totalKompensasi
      FROM lembur_entries
    `);

    res.json({
      success: true,
      data: {
        total: stats.total,
        approved: stats.approved || 0,
        pending: stats.pending || 0,
        partiallyApproved: stats.partially_approved || 0,
        rejected: stats.rejected || 0,
        totalEntries: entryStats.totalEntries || 0,
        totalKompensasi: entryStats.totalKompensasi || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await getFormWithEntries(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST buat form baru
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const id = uuidv4();
    const today = formatDate(new Date());
    const formNumber = await generateFormNumber(body.kodeDivisi);

    const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_forms');
    const formSequence = cnt + 1;

    await pool.query(
      `INSERT INTO lembur_forms
         (id, form_number, form_sequence, department, \`class\`, overtime_day, form_type,
          form_created_date, submission_date, requested_by, email, division_code, status, approval_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '')`,
      [
        id, formNumber, formSequence,
        body.department ?? null,
        body.class ?? null,
        body.lemburPada ?? null,
        body.jenisForm ?? null,
        today,
        body.tanggalPengajuan ?? today,
        body.diperintahOleh ?? null,
        body.email ?? null,
        body.kodeDivisi ?? null,
      ]
    );

    const [[{ cnt: entryCnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_entries');
    await insertEntries(id, body.entries || [], entryCnt);

    const newForm = await getFormWithEntries(id);
    res.status(201).json({ success: true, data: newForm, message: 'Form berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update form
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const [check] = await pool.query('SELECT id FROM lembur_forms WHERE id = ?', [id]);
    if (!check.length) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });

    await pool.query(
      `UPDATE lembur_forms SET
         department = ?, \`class\` = ?, overtime_day = ?, form_type = ?,
         submission_date = ?, requested_by = ?, email = ?, division_code = ?
       WHERE id = ?`,
      [
        body.department ?? null, body.class ?? null,
        body.lemburPada ?? null, body.jenisForm ?? null,
        body.tanggalPengajuan ?? null, body.diperintahOleh ?? null,
        body.email ?? null, body.kodeDivisi ?? null,
        id,
      ]
    );

    if (Array.isArray(body.entries)) {
      await pool.query('DELETE FROM lembur_entries WHERE form_id = ?', [id]);
      const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM lembur_entries');
      await insertEntries(id, body.entries, cnt);
    }

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: 'Form berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update status (approval / reject / revert)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatanApproval, approvedBy, approvedEntryIndices } = req.body;

    const [forms] = await pool.query('SELECT id, requested_by, form_type FROM lembur_forms WHERE id = ?', [id]);
    if (!forms.length) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });

    if (status === 'approved' || status === 'rejected') {
      const approver = await getApproverProfile(req.user.id);
      if (approver) {
        const lvl = (approver.job_level_name || '').toLowerCase();
        const isBOD = BOD_KEYS.some((k) => lvl.includes(k)) || approver.dept_name === 'Board Of Director';
        const isAdminUser = approver.dept_name === 'IT' || isBOD;

        if (!isAdminUser && forms[0].form_type === 'manager') {
          return res.status(403).json({
            success: false,
            message: 'Hanya BOD yang dapat menyetujui atau menolak form lembur untuk karyawan level Manager.',
          });
        }
      }
    }

    if (status === 'approved') {
      const [entries] = await pool.query(
        'SELECT id FROM lembur_entries WHERE form_id = ? ORDER BY sequence',
        [id]
      );
      const total = entries.length;
      const isPartial = Array.isArray(approvedEntryIndices) && approvedEntryIndices.length < total;
      const newStatus = isPartial ? 'partially_approved' : 'approved';
      const today = formatDate(new Date());

      await pool.query(
        `UPDATE lembur_forms
         SET status = ?, approval_notes = ?, approved_by = ?, approved_at = ?, rejected_by = NULL
         WHERE id = ?`,
        [newStatus, catatanApproval || '', approvedBy || '', today, id]
      );

      for (let i = 0; i < entries.length; i++) {
        const approval = isPartial ? (approvedEntryIndices.includes(i) ? 2 : 1) : 2;
        await pool.query('UPDATE lembur_entries SET approval = ? WHERE id = ?', [approval, entries[i].id]);
      }
    } else if (status === 'rejected') {
      await pool.query(
        `UPDATE lembur_forms
         SET status = 'rejected', approval_notes = ?, rejected_by = ?, approved_by = NULL, approved_at = NULL
         WHERE id = ?`,
        [catatanApproval || '', approvedBy || '', id]
      );
      await pool.query('UPDATE lembur_entries SET approval = 0 WHERE form_id = ?', [id]);
    } else if (status === 'pending') {
      await pool.query(
        `UPDATE lembur_forms
         SET status = 'pending', approval_notes = '', approved_by = NULL, approved_at = NULL, rejected_by = NULL
         WHERE id = ?`,
        [id]
      );
      await pool.query('UPDATE lembur_entries SET approval = 0 WHERE form_id = ?', [id]);
    }

    const updated = await getFormWithEntries(id);
    res.json({ success: true, data: updated, message: `Status diubah ke ${updated.status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE hapus form
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM lembur_forms WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    res.json({ success: true, message: 'Form berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
