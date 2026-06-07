const { v4: uuidv4 } = require('uuid');
const pool           = require('../config/db');

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
    id:              u.id,
    employeeId:      u.internal_id ? String(u.internal_id) : u.id,
    fullName:        u.name,
    email:           u.email || '',
    phone:           u.phone || '',
    departmentId:    u.department_id || '',
    department:      u.dept_name || '',
    departmentClass: u.dept_class || '',
    class:           u.dept_class || '',
    jobPosition:     u.job_position || '',
    jobLevel:        u.job_level_name || '',
    level:           u.job_level_num || 1,
    status:          u.is_active ? 'Active' : 'Inactive',
    kodeDivisi:      u.dept_code || '',
  };
}

async function getAll(req, res) {
  try {
    const { search, department, departmentId, departmentClass, includeInactive, formType, supervisorFor } = req.query;

    let sql = BASE_SELECT + ' WHERE 1=1';
    const params = [];

    if (!includeInactive) sql += ' AND cu.is_active = 1';

    if (departmentId) {
      sql += ` AND EXISTS (SELECT 1 FROM central_user_departments cud_f WHERE cud_f.user_id = cu.id AND cud_f.department_id = ?)`;
      params.push(departmentId);
    } else if (department) {
      const hasDeptClass = Boolean(departmentClass);
      sql += ` AND EXISTS (
        SELECT 1 FROM central_user_departments cud_f
        JOIN master_departments md_f ON cud_f.department_id = md_f.id
        WHERE cud_f.user_id = cu.id AND md_f.name = ?
        ${hasDeptClass ? 'AND md_f.class = ?' : ''}
      )`;
      params.push(department);
      if (hasDeptClass) params.push(departmentClass);
    }

    if (formType === 'outsourcing') {
      sql += " AND CAST(cu.internal_id AS CHAR) LIKE 'MPP%'";
    } else if (formType === 'harian_lepas') {
      sql += " AND (CAST(cu.internal_id AS CHAR) LIKE 'HLP%' OR CAST(cu.internal_id AS CHAR) LIKE 'HL%')";
    } else if (formType === 'manager') {
      sql += ` AND (LOWER(COALESCE(mjl.name,'')) LIKE '%manager%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%director%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%commissioner%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%president%')`;
    } else if (formType === 'staff') {
      sql += ` AND (cu.internal_id IS NULL OR CAST(cu.internal_id AS CHAR) NOT LIKE 'MPP%')
               AND NOT (LOWER(COALESCE(mjl.name,'')) LIKE '%manager%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%director%'
                        OR LOWER(COALESCE(mjl.name,'')) LIKE '%commissioner%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%president%')`;
    }

    if (supervisorFor === 'manager') {
      sql += ` AND (md.name = 'Board Of Director' OR LOWER(COALESCE(mjl.name,'')) LIKE '%director%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%commissioner%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%komisaris%')`;
    } else if (supervisorFor === 'staff') {
      sql += ` AND (LOWER(COALESCE(mjl.name,'')) LIKE '%supervisor%' OR LOWER(COALESCE(mjl.name,'')) LIKE '%ass. manager%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%manager%')`;
    } else if (supervisorFor === 'all') {
      sql += ' AND COALESCE(mjl.level, 1) >= 2';
    }

    if (search) {
      const q = `%${search}%`;
      sql += ` AND (cu.name LIKE ? OR CAST(cu.internal_id AS CHAR) LIKE ? OR cu.email LIKE ? OR cu.job_position LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY cu.name ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows.map(mapUser), total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getDepartments(req, res) {
  try {
    const isAdmin = req.user?.role === 'admin';
    let rows;
    if (isAdmin) {
      [rows] = await pool.query(
        `SELECT md.id, md.name, md.code, md.class FROM master_departments md WHERE md.is_active = 1 ORDER BY md.name ASC, md.class ASC`
      );
    } else {
      [rows] = await pool.query(
        `SELECT md.id, md.name, md.code, md.class
         FROM master_departments md
         JOIN central_user_departments cud ON cud.department_id = md.id
         WHERE cud.user_id = ? AND md.is_active = 1
         ORDER BY md.name ASC, md.class ASC`,
        [req.user.id]
      );
    }
    const result = rows.map(d => ({
      id: d.id, departmentId: d.id, department: d.name, name: d.name,
      kodeDivisi: d.code || d.name, class: d.class || d.name, label: d.name,
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getSupervisors(req, res) {
  try {
    const { department, formType } = req.query;
    let sql = BASE_SELECT + ' WHERE cu.is_active = 1';
    const params = [];

    if (formType === 'manager') {
      // Director/Commissioner can be in any dept — don't filter by department
      sql += ` AND (md.name = 'Board Of Director'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%director%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%commissioner%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%komisaris%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%president%')`;
    } else {
      // Staff / outsourcing / harian_lepas → filter by department + level
      sql += ` AND (LOWER(COALESCE(mjl.name,'')) LIKE '%supervisor%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%ass. manager%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%assistant manager%'
               OR LOWER(COALESCE(mjl.name,'')) LIKE '%manager%')`;
      if (department) { sql += ' AND md.name = ?'; params.push(department); }
    }

    sql += ' ORDER BY mjl.level DESC, cu.name ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows.map(mapUser), total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getApprovalChain(req, res) {
  try {
    const name = req.query.name || req.query.nama;
    if (!name) return res.json({ success: true, data: [] });

    const [found] = await pool.query(
      BASE_SELECT + ` WHERE LOWER(cu.name) = LOWER(?) AND cu.is_active = 1 LIMIT 1`, [name]
    );
    if (!found.length) return res.json({ success: true, data: [] });

    const person = found[0];
    const chain  = [mapUser(person)];

    if (person.department_id && person.job_level_num !== null) {
      const [superiors] = await pool.query(
        BASE_SELECT + `
          WHERE md.id = ? AND cu.is_active = 1 AND mjl.level > ? AND LOWER(cu.name) != LOWER(?)
          ORDER BY mjl.level ASC LIMIT 3
        `,
        [person.department_id, person.job_level_num, name]
      );
      superiors.forEach(s => chain.push(mapUser(s)));
    }

    res.json({ success: true, data: chain });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getByEmployeeId(req, res) {
  try {
    const [rows] = await pool.query(
      BASE_SELECT + ` WHERE cu.internal_id = ? LIMIT 1`, [req.params.employeeId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
    res.json({ success: true, data: mapUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getUserDepartments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT md.id, md.name, md.class, md.code, cud.is_primary
       FROM central_user_departments cud
       JOIN master_departments md ON cud.department_id = md.id
       WHERE cud.user_id = ? AND md.is_active = 1
       ORDER BY cud.is_primary DESC, md.name ASC`,
      [req.params.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function addUserDepartment(req, res) {
  try {
    const { departmentId, isPrimary } = req.body;
    if (!departmentId) return res.status(400).json({ success: false, message: 'departmentId wajib diisi.' });
    if (isPrimary) {
      await pool.query('UPDATE central_user_departments SET is_primary = 0 WHERE user_id = ?', [req.params.userId]);
    }
    await pool.query(
      'INSERT INTO central_user_departments (id, user_id, department_id, is_primary) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.params.userId, departmentId, isPrimary ? 1 : 0]
    );
    res.json({ success: true, message: 'Departemen berhasil ditambahkan.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'User sudah terdaftar di departemen ini.' });
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeUserDepartment(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM central_user_departments WHERE user_id = ? AND department_id = ?',
      [req.params.userId, req.params.deptId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    res.json({ success: true, message: 'Departemen berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function setPrimaryDepartment(req, res) {
  try {
    await pool.query('UPDATE central_user_departments SET is_primary = 0 WHERE user_id = ?', [req.params.userId]);
    await pool.query(
      'UPDATE central_user_departments SET is_primary = 1 WHERE user_id = ? AND department_id = ?',
      [req.params.userId, req.params.deptId]
    );
    res.json({ success: true, message: 'Primary departemen berhasil diubah.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getDepartments, getSupervisors, getApprovalChain, getByEmployeeId, getUserDepartments, addUserDepartment, removeUserDepartment, setPrimaryDepartment };
