const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const BASE_SELECT = `
  SELECT cu.id, cu.internal_id, cu.name, cu.email, cu.phone,
         cu.job_position, cu.is_active,
         md.id AS department_id, md.name AS dept_name, md.class AS dept_class, md.code AS dept_code,
         mjl.name AS job_level_name, mjl.level AS job_level_num
  FROM central_users cu
  LEFT JOIN central_user_departments cud ON cu.id = cud.user_id AND cud.is_primary = 1
  LEFT JOIN master_departments md ON cud.department_id = md.id
  LEFT JOIN master_job_levels mjl ON cu.job_level_id = mjl.id
`;

function mapUser(u) {
  return {
    employeeId: u.internal_id ? String(u.internal_id) : u.id,
    fullName: u.name,
    email: u.email || '',
    phone: u.phone || '',
    departmentId: u.department_id || '',
    department: u.dept_name || '',
    departmentClass: u.dept_class || '',
    class: u.dept_class || '',
    jobPosition: u.job_position || '',
    jobLevel: u.job_level_name || '',
    level: u.job_level_num || 1,
    status: u.is_active ? 'Active' : 'Inactive',
    kodeDivisi: u.dept_code || '',
  };
}

// GET semua karyawan (dengan filter & search)
router.get('/', async (req, res) => {
  try {
    const { search, department, departmentId, departmentClass, includeInactive } = req.query;

    let sql = BASE_SELECT + ' WHERE 1=1';
    const params = [];

    if (!includeInactive) {
      sql += ' AND cu.is_active = 1';
    }
    if (departmentId) {
      sql += ' AND md.id = ?';
      params.push(departmentId);
    } else if (department) {
      sql += ' AND md.name = ?';
      params.push(department);
    }
    if (departmentClass) {
      sql += ' AND md.class = ?';
      params.push(departmentClass);
    }
    if (search) {
      sql += ` AND (
        cu.name LIKE ? OR
        CAST(cu.internal_id AS CHAR) LIKE ? OR
        cu.email LIKE ? OR
        cu.job_position LIKE ?
      )`;
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY cu.name ASC';

    const [rows] = await pool.query(sql, params);
    const result = rows.map(mapUser);
    res.json({ success: true, data: result, total: result.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET daftar department unik + kode divisi
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT md.id, md.name, md.code, md.class
       FROM master_departments md
       WHERE md.is_active = 1
       ORDER BY md.name ASC, md.class ASC`
    );
    const result = rows.map(d => ({
      id: d.id,
      departmentId: d.id,
      department: d.name,
      name: d.name,
      kodeDivisi: d.code || d.name,
      class: d.class || d.name,
      label: d.name,
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET approval-chain untuk seorang karyawan
// Mengembalikan: karyawan tsb → atasan di dept yg sama (level lebih tinggi) → dst (maks 4 level)
router.get('/approval-chain', async (req, res) => {
  try {
    const { nama } = req.query;
    if (!nama) return res.json({ success: true, data: [] });

    // Cari karyawan berdasarkan nama
    const [found] = await pool.query(
      BASE_SELECT + ` WHERE LOWER(cu.name) = LOWER(?) AND cu.is_active = 1 LIMIT 1`,
      [nama]
    );

    if (!found.length) return res.json({ success: true, data: [] });

    const person = found[0];
    const chain = [mapUser(person)];

    if (person.department_id && person.job_level_num !== null) {
      // Cari atasan di dept yang sama dengan job level lebih tinggi
      const [superiors] = await pool.query(
        BASE_SELECT + `
          WHERE md.id = ?
            AND cu.is_active = 1
            AND mjl.level > ?
            AND LOWER(cu.name) != LOWER(?)
          ORDER BY mjl.level ASC
          LIMIT 3
        `,
        [person.department_id, person.job_level_num, nama]
      );
      superiors.forEach(s => chain.push(mapUser(s)));
    }

    res.json({ success: true, data: chain });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET satu karyawan by employeeId (internal_id)
router.get('/:employeeId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      BASE_SELECT + ` WHERE cu.internal_id = ? LIMIT 1`,
      [req.params.employeeId]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
