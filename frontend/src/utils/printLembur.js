function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatStatus(status) {
  const map = {
    approved: 'Disetujui',
    partially_approved: 'Sebagian Disetujui',
    rejected: 'Ditolak',
    pending: 'Menunggu Approval',
  };
  return map[status] || esc(status) || '-';
}

export function printLemburForm(form) {
  if (!form) return;

  const entries = form.entries ?? [];

  const rows = entries.map((entry, idx) => {
    const approved = entry.approval === 1 || entry.approval === 2;
    return `
      <tr>
        <td class="col-no">${idx + 1}</td>
        <td class="col-nama"><strong>${esc(entry.nama)}</strong></td>
        <td class="col-id">${esc(entry.idKaryawan) || '-'}</td>
        <td class="col-tgl">${esc(entry.tanggalLembur) || '-'}</td>
        <td class="col-waktu">${esc(entry.jamMulai) || '-'}</td>
        <td class="col-waktu">${esc(entry.jamSelesai) || '-'}</td>
        <td class="col-tugas">${esc(entry.tugas) || '-'}</td>
        <td class="col-hasil">${esc(entry.hasil) || '-'}</td>
        <td class="col-komp">${esc(entry.kompensasi) || '-'}</td>
        <td class="col-status">
          <span class="status-dot ${approved ? 'status-dot--approved' : 'status-dot--pending'}"></span>
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Form Lembur - ${esc(form.nomerForm)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      background: #fff;
      padding: 14mm 16mm;
    }

    /* ── Title ─────────────────────────────────────────────── */
    .print-title {
      text-align: center;
      margin-bottom: 12px;
    }
    .print-title h1 {
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .print-title .form-number {
      font-size: 9.5pt;
      color: #444;
      margin-top: 3px;
    }

    /* ── Divider ────────────────────────────────────────────── */
    .print-divider {
      border: none;
      border-top: 2px solid #1a2a57;
      margin: 10px 0;
    }
    .print-divider--thin {
      border-top-width: 1px;
      border-top-color: #ccc;
    }

    /* ── Meta grid ──────────────────────────────────────────── */
    .print-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 32px;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }
    .print-meta-row { display: flex; gap: 6px; }
    .print-meta-label { width: 120px; flex-shrink: 0; color: #555; }
    .print-meta-label::after { content: ':'; }
    .print-meta-value { font-weight: 700; color: #111; }

    /* ── Table ──────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 14px;
    }
    thead tr { background: #1a2a57; color: #fff; }
    th {
      padding: 6px 7px;
      text-align: left;
      font-weight: 700;
      border: 1px solid #1a2a57;
      white-space: nowrap;
    }
    td {
      padding: 5px 7px;
      border: 1px solid #ccc;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f4f6fa; }

    .col-no   { width: 26px;  text-align: center; }
    .col-nama { min-width: 100px; }
    .col-id   { width: 78px;  white-space: nowrap; }
    .col-tgl  { width: 70px;  white-space: nowrap; }
    .col-waktu{ width: 46px;  white-space: nowrap; }
    .col-tugas{ min-width: 90px; word-break: break-word; }
    .col-hasil{ min-width: 90px; word-break: break-word; }
    .col-komp { width: 76px; }
    .col-status{ width: 30px; text-align: center; }

    /* ── Status dot ─────────────────────────────────────────── */
    .status-dot {
      display: inline-block;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      vertical-align: middle;
    }
    .status-dot--approved { background: #22c55e; }
    .status-dot--pending  { background: #ef4444; }

    /* ── Signature row ──────────────────────────────────────── */
    .print-signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 24px;
      font-size: 9pt;
    }
    .sig-box {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px 12px;
    }
    .sig-box__label {
      font-size: 8.5pt;
      color: #555;
      margin-bottom: 44px;
    }
    .sig-box__name {
      border-top: 1px solid #aaa;
      padding-top: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #222;
    }

    @media print {
      body { padding: 10mm 12mm; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>

  <div class="print-title">
    <h1>Form Perintah Lembur</h1>
    <div class="form-number">No. Form: <strong>${esc(form.nomerForm) || '-'}</strong></div>
  </div>

  <hr class="print-divider" />

  <div class="print-meta">
    <div class="print-meta-row">
      <span class="print-meta-label">Divisi</span>
      <span class="print-meta-value">${esc(form.kodeDivisi) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Class</span>
      <span class="print-meta-value">${esc(form.class) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Department</span>
      <span class="print-meta-value">${esc(form.department) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Lembur Pada</span>
      <span class="print-meta-value">${esc(form.lemburPada) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Diperintah Oleh</span>
      <span class="print-meta-value">${esc(form.diperintahOleh) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Tgl Pengajuan</span>
      <span class="print-meta-value">${esc(form.tanggalPengajuan) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Email</span>
      <span class="print-meta-value">${esc(form.email) || '-'}</span>
    </div>
    <div class="print-meta-row">
      <span class="print-meta-label">Status</span>
      <span class="print-meta-value">${formatStatus(form.status)}</span>
    </div>
  </div>

  <hr class="print-divider print-divider--thin" />

  <table>
    <thead>
      <tr>
        <th class="col-no">No</th>
        <th class="col-nama">Nama</th>
        <th class="col-id">ID Karyawan</th>
        <th class="col-tgl">Tgl Lembur</th>
        <th class="col-waktu">Mulai</th>
        <th class="col-waktu">Selesai</th>
        <th class="col-tugas">Tugas</th>
        <th class="col-hasil">Hasil</th>
        <th class="col-komp">Kompensasi</th>
        <th class="col-status">&#9679;</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="print-signatures">
    <div class="sig-box">
      <div class="sig-box__label">Diperintahkan oleh</div>
      <div class="sig-box__name">${esc(form.diperintahOleh) || '___________________'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-box__label">Diketahui oleh</div>
      <div class="sig-box__name">___________________</div>
    </div>
    <div class="sig-box">
      <div class="sig-box__label">Disetujui oleh</div>
      <div class="sig-box__name">___________________</div>
    </div>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=700');
  if (!win) {
    alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak form.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.addEventListener('afterprint', () => win.close());
  }, 400);
}
