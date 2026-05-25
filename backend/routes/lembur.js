const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Buat nomer form: OVT-{KODE}-{YY}-{NNNNN}
function generateNomerForm(kodeDivisi) {
  const yy = String(new Date().getFullYear()).slice(-2);
  const db = readDB();
  const next = String(db.forms.length + 1).padStart(5, '0');
  return `OVT-${kodeDivisi || 'XXX'}-${yy}-${next}`;
}

// GET semua form
router.get('/', (req, res) => {
  try {
    const db = readDB();
    const { status, department, kodeDivisi, search } = req.query;
    let forms = db.forms;

    if (status) forms = forms.filter(f => f.status === status);
    if (department) forms = forms.filter(f => f.department === department);
    if (kodeDivisi) forms = forms.filter(f => f.kodeDivisi === kodeDivisi);
    if (search) {
      const q = search.toLowerCase();
      forms = forms.filter(f =>
        f.nomerForm.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.diperintahOleh.toLowerCase().includes(q) ||
        f.entries.some(e => e.nama.toLowerCase().includes(q) || String(e.idKaryawan).toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: forms, total: forms.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET statistik
router.get('/stats', (req, res) => {
  try {
    const db = readDB();
    const forms = db.forms;
    const totalKompensasi = forms.reduce((acc, f) =>
      acc + f.entries.reduce((s, e) => s + (Number(e.kompensasi) || 0), 0), 0
    );
    res.json({
      success: true,
      data: {
        total: forms.length,
        approved: forms.filter(f => f.status === 'approved').length,
        pending: forms.filter(f => f.status === 'pending').length,
        partiallyApproved: forms.filter(f => f.status === 'partially_approved').length,
        rejected: forms.filter(f => f.status === 'rejected').length,
        totalEntries: forms.reduce((acc, f) => acc + f.entries.length, 0),
        totalKompensasi,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET form by ID
router.get('/:id', (req, res) => {
  try {
    const db = readDB();
    const form = db.forms.find(f => f.id === req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST buat form baru
router.post('/', (req, res) => {
  try {
    const db = readDB();
    const body = req.body;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');

    const newForm = {
      id: uuidv4(),
      nomerForm: generateNomerForm(body.kodeDivisi),
      noUrutForm: db.forms.length + 1,
      status: 'pending',
      tanggalFormDibuat: formattedDate,
      entries: [],
      ...body,
    };

    // Assign internalId ke setiap entry
    const allEntries = db.forms.reduce((acc, f) => acc + f.entries.length, 0);
    newForm.entries = (newForm.entries || []).map((e, i) => ({
      ...e,
      internalId: allEntries + i + 1,
      approval: 0,
    }));

    db.forms.push(newForm);
    writeDB(db);
    res.status(201).json({ success: true, data: newForm, message: 'Form berhasil dibuat' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update form
router.put('/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.forms.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    db.forms[idx] = { ...db.forms[idx], ...req.body, id: req.params.id };
    writeDB(db);
    res.json({ success: true, data: db.forms[idx], message: 'Form berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update status (approval)
// approve → langsung approved, rejected → rejected
router.patch('/:id/status', (req, res) => {
  try {
    const db = readDB();
    const idx = db.forms.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });

    const { status, catatanApproval, approvedBy, approvedEntryIndices } = req.body;

    if (status === 'approved') {
      const total = db.forms[idx].entries.length;
      const isPartial = Array.isArray(approvedEntryIndices) && approvedEntryIndices.length < total;

      db.forms[idx].entries = db.forms[idx].entries.map((e, i) => ({
        ...e,
        approval: isPartial ? (approvedEntryIndices.includes(i) ? 2 : 1) : 2,
      }));
      db.forms[idx].status = isPartial ? 'partially_approved' : 'approved';
      db.forms[idx].approvedBy = approvedBy || '';
      db.forms[idx].approvedAt = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    } else if (status === 'rejected') {
      db.forms[idx].status = 'rejected';
      db.forms[idx].rejectedBy = approvedBy || '';
      db.forms[idx].entries = db.forms[idx].entries.map(e => ({ ...e, approval: 0 }));
    } else if (status === 'pending') {
      db.forms[idx].status = 'pending';
      db.forms[idx].entries = db.forms[idx].entries.map(e => ({ ...e, approval: 0 }));
      delete db.forms[idx].approvedBy;
      delete db.forms[idx].approvedAt;
      delete db.forms[idx].rejectedBy;
      db.forms[idx].catatanApproval = '';
    }

    db.forms[idx].catatanApproval = status === 'pending' ? '' : (catatanApproval || db.forms[idx].catatanApproval || '');

    writeDB(db);
    res.json({ success: true, data: db.forms[idx], message: `Status diubah ke ${db.forms[idx].status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE hapus form
router.delete('/:id', (req, res) => {
  try {
    const db = readDB();
    const idx = db.forms.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Form tidak ditemukan' });
    db.forms.splice(idx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Form berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
