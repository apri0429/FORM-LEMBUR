const pool = require('../config/db');

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

module.exports = { formatDate, generateFormNumber };
