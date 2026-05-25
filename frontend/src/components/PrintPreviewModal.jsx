import React from 'react';
import { createPortal } from 'react-dom';
import { XClose, Printer } from './template/TemplateIcons';

function formatKompensasi(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function formatStatus(status) {
  const map = {
    approved: 'Disetujui',
    partially_approved: 'Sebagian Disetujui',
    rejected: 'Ditolak',
    pending: 'Menunggu Approval',
  };
  return map[status] || status || '-';
}

export default function PrintPreviewModal({ form, onClose }) {
  if (!form) return null;

  const isApproved = form.status === 'approved' || form.status === 'partially_approved';

  return createPortal(
    <div className="dashboard-popup-overlay" style={{ zIndex: 9999 }}>
      {/* Add print styles specifically for this modal */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              box-shadow: none !important;
            }
            .print-hide {
              display: none !important;
            }
          }
        `}
      </style>
      
      <div className="dashboard-popup" style={{ width: '900px', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        <div className="dashboard-popup__header print-hide">
          <div>
            <p className="dashboard-popup__eyebrow">Print Preview</p>
            <h3 className="dashboard-popup__title">Preview Form Lembur</h3>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose}>
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body" style={{ flex: 1, overflowY: 'auto', background: '#e2e8f0', padding: '30px' }}>
          {/* A4 Paper Layout */}
          <div 
            className="print-container" 
            style={{ 
              background: 'white', 
              padding: '12mm 15mm', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              margin: '0 auto',
              width: '210mm',
              minHeight: '297mm',
              color: 'black',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #1a2a57', paddingBottom: '15px' }}>
              <h1 style={{ margin: 0, fontSize: '18pt', textTransform: 'uppercase', color: '#1a2a57' }}>Formulir Perintah Lembur</h1>
              <p style={{ margin: '5px 0 0', fontSize: '11pt', color: '#333' }}>No. Form: <strong>{form.nomerForm}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px', marginBottom: '20px', fontSize: '10pt' }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ width: '110px', padding: '4px 0', color: '#555' }}>Divisi</td><td>: <strong>{form.kodeDivisi || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Class</td><td>: <strong>{form.class || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Department</td><td>: <strong>{form.department || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Lembur Pada</td><td>: <strong>{form.lemburPada || '-'}</strong></td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ width: '110px', padding: '4px 0', color: '#555' }}>Diperintah Oleh</td><td>: <strong>{form.diperintahOleh || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Tgl Pengajuan</td><td>: <strong>{form.tanggalPengajuan || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Email</td><td>: <strong>{form.email || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Status</td><td>: <strong>{formatStatus(form.status)}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '9pt' }}>
              <thead>
                <tr style={{ background: '#1a2a57', color: 'white' }}>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>No</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Nama</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>ID Karyawan</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Tgl Lembur</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Mulai</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Selesai</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Tugas</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Hasil</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Kompensasi</th>
                </tr>
              </thead>
              <tbody>
                {(form.entries || []).map((entry, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px' }}><strong>{entry.nama}</strong></td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.idKaryawan || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.tanggalLembur}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.jamMulai}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.jamSelesai}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', wordBreak: 'break-word' }}>{entry.tugas || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', wordBreak: 'break-word' }}>{entry.hasil || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center', fontWeight: 'bold' }}>{formatKompensasi(entry.kompensasi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px', fontSize: '10pt', textAlign: 'center' }}>
              <div>
                <p style={{ margin: '0 0 15px 0' }}>Diperintahkan Oleh,</p>
                <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #1a2a57', color: '#1a2a57', borderRadius: '4px', background: 'rgba(26,42,87,0.02)', display: 'inline-block' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>TANDA TANGAN DIGITAL</p>
                  <p style={{ margin: '4px 0 0', fontSize: '8pt', opacity: 0.8 }}>Oleh Sistem</p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{form.diperintahOleh || '________________'}</p>
              </div>
              
              <div>
                <p style={{ margin: '0 0 15px 0' }}>Diketahui Oleh,</p>
                <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #1a2a57', color: '#1a2a57', borderRadius: '4px', background: 'rgba(26,42,87,0.02)', display: 'inline-block' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>TANDA TANGAN DIGITAL</p>
                  <p style={{ margin: '4px 0 0', fontSize: '8pt', opacity: 0.8 }}>Oleh Sistem</p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Manager Terkait</p>
              </div>
              
              <div>
                <p style={{ margin: '0 0 15px 0' }}>Disetujui Oleh,</p>
                {isApproved ? (
                  <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #22c55e', color: '#22c55e', borderRadius: '4px', background: 'rgba(34,197,94,0.05)', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>TANDA TANGAN DIGITAL</p>
                    <p style={{ margin: '4px 0 0', fontSize: '8pt' }}>Status: {formatStatus(form.status)}</p>
                  </div>
                ) : (
                  <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #ccc', color: '#999', borderRadius: '4px', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>BELUM DISETUJUI</p>
                    <p style={{ margin: '4px 0 0', fontSize: '8pt' }}>Menunggu</p>
                  </div>
                )}
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Direksi / GM</p>
              </div>
            </div>
            
            <div style={{ marginTop: '30px', fontSize: '8pt', color: '#666', textAlign: 'right' }}>
              <p>Dicetak oleh Sistem pada {new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-popup__actions print-hide" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
          <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="dashboard-popup__button dashboard-popup__button--primary" onClick={() => window.print()}>
            <Printer size={15} />
            Cetak Dokumen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
