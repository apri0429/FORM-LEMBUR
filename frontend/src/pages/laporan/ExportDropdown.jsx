import React, { useEffect, useRef, useState } from 'react';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import { ChevronDown } from '../../components/layout/icons';

const EXPORT_ITEMS = [
  { label: 'Export CSV',   desc: 'Download .csv file',  color: '#1a5276', bg: '#eaf1fb', icon: FileDownloadRoundedIcon },
  { label: 'Export Excel', desc: 'Download .xlsx file', color: '#1e8449', bg: '#eafaf1', icon: TableChartRoundedIcon  },
];

export default function ExportDropdown({ onCSV, onExcel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const items = EXPORT_ITEMS.map((it, i) => ({ ...it, action: [onCSV, onExcel][i] }));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="add-board-button"
        style={{ gap: 6 }}
      >
        <FileDownloadRoundedIcon style={{ fontSize: 15 }} />
        Export
        <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 12px 40px rgba(26,42,87,0.16), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(26,42,87,0.08)',
          minWidth: 210, overflow: 'hidden', padding: '6px',
        }}>
          <p style={{ margin: '4px 10px 6px', fontSize: '0.68rem', fontWeight: 700, color: '#aab4c4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Download Data
          </p>
          {items.map(({ label, desc, color, bg, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 10px', borderRadius: 9,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.13s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ fontSize: 16, color }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#1a2a57', lineHeight: 1.2 }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#8fa3b8', lineHeight: 1.2 }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
