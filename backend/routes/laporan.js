const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET semua entri lembur approved/partial untuk laporan HRD
router.get('/', async (req, res) => {
  try {
    const { department, jenisForm, bulan } = req.query;

    let where = "lf.status IN ('approved', 'partially_approved')";
    const params = [];

    if (department) { where += ' AND lf.department = ?'; params.push(department); }
    if (jenisForm)  { where += ' AND lf.form_type = ?';  params.push(jenisForm); }
    if (bulan)      { where += ' AND le.overtime_date LIKE ?'; params.push(`%${bulan}%`); }

    const [rows] = await pool.query(
      `SELECT
         lf.id              AS formId,
         lf.form_number     AS nomerForm,
         lf.department,
         lf.form_type       AS jenisForm,
         lf.overtime_day    AS lemburPada,
         lf.submission_date AS tanggalPengajuan,
         lf.requested_by    AS diperintahOleh,
         lf.status          AS formStatus,
         lf.approved_by     AS approvedBy,
         lf.approved_at     AS approvedAt,
         le.id              AS entryId,
         le.sequence,
         le.name            AS nama,
         le.employee_id     AS idKaryawan,
         le.overtime_date   AS tanggalLembur,
         le.start_time      AS jamMulai,
         le.end_time        AS jamSelesai,
         le.task            AS tugas,
         le.result          AS hasil,
         le.compensation    AS kompensasi,
         le.approval        AS entryApproval,
         le.talenta_input   AS talentaInput
       FROM lembur_forms lf
       JOIN lembur_entries le ON le.form_id = lf.id
       WHERE ${where}
       ORDER BY lf.submission_date DESC, lf.form_number ASC, le.sequence ASC`,
      params
    );

    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH toggle talenta_input untuk satu entry
router.patch('/entry/:entryId/talenta', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { talentaInput } = req.body;
    await pool.query(
      'UPDATE lembur_entries SET talenta_input = ? WHERE id = ?',
      [talentaInput ? 1 : 0, entryId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
