import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XClose, Printer } from '../layout/icons';

function formatKompensasi(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function formatLemburPada(value) {
  const text = String(value ?? '').trim();
  if (text === 'Hari Libur') return 'Holiday';
  if (text === 'Hari Kerja') return 'Workday';
  return text || '-';
}

function formatStatus(status) {
  const map = {
    approved: 'Approved',
    partially_approved: 'Partially Approved',
    rejected: 'Rejected',
    pending: 'Pending Approval',
  };
  return map[status] || status || '-';
}

export default function PrintPreviewModal({ form, onClose }) {
  const bodyRef = useRef(null);
  const [docZoom, setDocZoom] = useState(1);

  useEffect(() => {
    const calc = () => {
      if (!bodyRef.current) return;
      const avail = bodyRef.current.clientWidth - 32;
      setDocZoom(Math.min(1, avail / 793));
    };
    calc();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calc) : null;
    if (ro && bodyRef.current) ro.observe(bodyRef.current);
    return () => ro?.disconnect();
  }, []);

  if (!form) return null;

  const isApproved = form.status === 'approved' || form.status === 'partially_approved';

  return createPortal(
    <div className="dashboard-popup-overlay" style={{ zIndex: 9999 }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container {
              position: absolute;
              left: 0; top: 0;
              width: 210mm !important;
              background: white !important;
              box-shadow: none !important;
              zoom: 1 !important;
              transform: none !important;
            }
            .print-hide { display: none !important; }
          }
        `}
      </style>

      <div
        className="dashboard-popup"
        style={{
          width: '900px',
          maxWidth: 'calc(100vw - 32px)',
          height: 'calc(100dvh - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="dashboard-popup__header print-hide" style={{ flexShrink: 0 }}>
          <div>
            <p className="dashboard-popup__eyebrow">Print Preview</p>
            <h3 className="dashboard-popup__title">Preview Form Lembur</h3>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose}>
            <XClose size={18} />
          </button>
        </div>

        <div ref={bodyRef} style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', background: '#e2e8f0', padding: '16px', WebkitOverflowScrolling: 'touch' }}>
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
              fontFamily: 'Arial, sans-serif',
              zoom: docZoom,
              transformOrigin: 'top center',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #1a2a57', paddingBottom: '15px' }}>
              <h1 style={{ margin: 0, fontSize: '18pt', textTransform: 'uppercase', color: '#1a2a57' }}>Form Lembur</h1>
              <p style={{ margin: '5px 0 0', fontSize: '11pt', color: '#333' }}>No. Form: <strong>{form.formNumber}</strong></p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px', marginBottom: '20px', fontSize: '10pt' }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ width: '110px', padding: '4px 0', color: '#555' }}>Division</td><td>: <strong>{form.divisionCode || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Class</td><td>: <strong>{form.class || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Department</td><td>: <strong>{form.department || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Overtime Day</td><td>: <strong>{formatLemburPada(form.overtimeDay)}</strong></td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ width: '110px', padding: '4px 0', color: '#555' }}>Requested By</td><td>: <strong>{form.requestedBy || '-'}</strong></td></tr>
                    <tr><td style={{ padding: '4px 0', color: '#555' }}>Submission Date</td><td>: <strong>{form.submissionDate || '-'}</strong></td></tr>
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
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Name</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Employee ID</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Overtime Date</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Start</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>End</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Task</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'left' }}>Result</th>
                  <th style={{ border: '1px solid #1a2a57', padding: '8px 5px', textAlign: 'center' }}>Compensation</th>
                </tr>
              </thead>
              <tbody>
                {(form.entries || []).map((entry, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px' }}><strong>{entry.name}</strong></td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.employeeId || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.overtimeDate}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.startTime}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center' }}>{entry.endTime}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', wordBreak: 'break-word' }}>{entry.task || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', wordBreak: 'break-word' }}>{entry.result || '-'}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 5px', textAlign: 'center', fontWeight: 'bold' }}>{formatKompensasi(entry.compensation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px', fontSize: '10pt', textAlign: 'center' }}>
              <div>
                <p style={{ margin: '0 0 15px 0' }}>Requested By,</p>
                <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #1a2a57', color: '#1a2a57', borderRadius: '4px', background: 'rgba(26,42,87,0.02)', display: 'inline-block' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>DIGITAL SIGNATURE</p>
                  <p style={{ margin: '4px 0 0', fontSize: '8pt', opacity: 0.8 }}>By System</p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{form.requestedBy || '________________'}</p>
              </div>

              <div>
                <p style={{ margin: '0 0 15px 0' }}>Acknowledged By,</p>
                <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #1a2a57', color: '#1a2a57', borderRadius: '4px', background: 'rgba(26,42,87,0.02)', display: 'inline-block' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>DIGITAL SIGNATURE</p>
                  <p style={{ margin: '4px 0 0', fontSize: '8pt', opacity: 0.8 }}>By System</p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Related Manager</p>
              </div>

              <div>
                <p style={{ margin: '0 0 15px 0' }}>Approved By,</p>
                {isApproved ? (
                  <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #22c55e', color: '#22c55e', borderRadius: '4px', background: 'rgba(34,197,94,0.05)', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>DIGITAL SIGNATURE</p>
                    <p style={{ margin: '4px 0 0', fontSize: '8pt' }}>Status: {formatStatus(form.status)}</p>
                  </div>
                ) : (
                  <div style={{ margin: '0 auto 15px', padding: '10px', border: '1px dashed #ccc', color: '#999', borderRadius: '4px', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '8pt', letterSpacing: '0.5px' }}>NOT YET APPROVED</p>
                    <p style={{ margin: '4px 0 0', fontSize: '8pt' }}>Pending</p>
                  </div>
                )}
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>Director / GM</p>
              </div>
            </div>

            <div style={{ marginTop: '30px', fontSize: '8pt', color: '#666', textAlign: 'right' }}>
              <p>Printed by System on {new Date().toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-popup__actions print-hide" style={{ borderTop: '1px solid rgba(26,42,87,0.08)', flexShrink: 0 }}>
          <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dashboard-popup__button dashboard-popup__button--primary" onClick={() => window.print()}>
            <Printer size={15} />
            Print Document
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
