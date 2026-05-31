const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const BOD_KEYS = ['director', 'commissioner', 'komisaris', 'president director'];
const MANAGER_KEYS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT cu.id, cu.internal_id, cu.name, cu.email, cu.username, cu.password,
              cu.job_position, cu.is_active,
              md.id AS department_id, md.name AS dept_name, md.class AS dept_class, md.code AS dept_code,
              mjl.name AS job_level_name, mjl.level AS job_level_num
       FROM central_users cu
       LEFT JOIN central_user_departments cud ON cu.id = cud.user_id AND cud.is_primary = 1
       LEFT JOIN master_departments md ON cud.department_id = md.id
       LEFT JOIN master_job_levels mjl ON cu.job_level_id = mjl.id
       WHERE cu.username = ? AND cu.is_active = 1
       LIMIT 1`,
      [username.trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Username tidak ditemukan atau akun tidak aktif.' });
    }

    const u = rows[0];
    const passwordMatch = await bcrypt.compare(password, u.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }

    const [deptRows] = await pool.query(
      `SELECT md.id AS department_id, md.name AS dept_name, md.class AS dept_class, md.code AS dept_code, cud.is_primary
       FROM central_user_departments cud
       JOIN master_departments md ON cud.department_id = md.id
       WHERE cud.user_id = ? AND md.is_active = 1
       ORDER BY cud.is_primary DESC, md.name ASC`,
      [u.id]
    );

    const allDepartments = deptRows.map(d => ({
      departmentId: d.department_id,
      department: d.dept_name,
      departmentClass: d.dept_class || '',
      class: d.dept_class || '',
      kodeDivisi: d.dept_code || '',
      isPrimary: Boolean(d.is_primary),
    }));

    const jobLevel = (u.job_level_name || '').toLowerCase();
    const jobPosition = (u.job_position || '').toLowerCase();
    const isBOD = BOD_KEYS.some(k => jobLevel.includes(k)) || u.dept_name === 'Board Of Director';
    const isAdmin = u.dept_name === 'IT' || isBOD;
    const isKoordinator = jobLevel.includes('koordinator') || jobPosition.includes('koordinator');
    const isManager = MANAGER_KEYS.some(k => jobLevel.includes(k) || jobPosition.includes(k));
    const allowedFormTypes = (isAdmin || isKoordinator)
      ? ['manager', 'staff', 'outsourcing', 'harian_lepas']
      : isManager
        ? ['manager', 'staff']
        : ['staff'];

    const userData = {
      id: u.id,
      employeeId: u.internal_id ? String(u.internal_id) : u.id,
      fullName: u.name,
      username: u.username,
      email: u.email || '',
      departmentId: u.department_id || '',
      department: u.dept_name || '',
      departmentClass: u.dept_class || '',
      class: u.dept_class || '',
      jobPosition: u.job_position || '',
      jobLevel: u.job_level_name || '',
      level: u.job_level_num || 1,
      status: 'Active',
      kodeDivisi: u.dept_code || '',
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      allowedFormTypes,
      departments: allDepartments,
    };

    const token = jwt.sign(
      { id: u.id, username: u.username, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ success: true, token, data: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
