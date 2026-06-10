import React from 'react';
import { createPortal } from 'react-dom';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { XClose } from '../../components/layout/icons';
import { formatKompensasi, formatLemburPada, getKompensasiSummary } from './helpers';
import FormTypeBadge from '../../components/ui/FormTypeBadge';
import { Chip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';

const STATUS_CHIP_MAP = {
  approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Approved L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending: {
    label: 'Pending',
    color: 'default',
    icon: <PendingActionsRoundedIcon fontSize="small" />,
    sx: { bgcolor: 'rgba(234,179,8,0.18)', color: '#92640a', '& .MuiChip-icon': { color: '#b07d0c' } },
  },
  rejected: { label: 'Rejected', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

function ApprovalStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} sx={config.sx} />;
}

export default function ApprovalDetailPopup({
  detailForm,
  selectedEntryIndices,
  onToggleEntry,
  onSelectAll,
  canUserAct,
  getDivisiLabel,
  onApprove,
  onReject,
  onClose,
}) {
  if (!detailForm || typeof document === 'undefined') return null;

  const totalEntries = detailForm.entries?.length ?? 0;
  const selectedCount = selectedEntryIndices.size;
  const isAllSelected = selectedCount === totalEntries;
  const approveLabel = isAllSelected ? 'Approve All' : `Approve (${selectedCount}/${totalEntries})`;

  return createPortal(
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup dashboard-popup--frp-detail"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Overtime Form Detail</p>
            <h2 className="dashboard-popup__title">{detailForm.formNumber}</h2>
          </div>
          <button type="button" className="dashboard-popup__close" aria-label="Close" onClick={onClose}>
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body--frp-detail" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
            <ApprovalStatusChip status={detailForm.status} />
            <FormTypeBadge jenisForm={detailForm.formType} />
          </div>

          <div className="approval-detail-summary" style={{
            display: 'grid',
            gap: 8,
            flexShrink: 0,
          }}>
            {[
              { label: 'Department',   value: detailForm.department },
              { label: 'Requested By', value: detailForm.requestedBy },
              { label: 'Submit Date',  value: detailForm.submissionDate },
              { label: 'OT Day',       value: formatLemburPada(detailForm.overtimeDay) },
              { label: 'Division',     value: getDivisiLabel(detailForm) },
              { label: 'Compensation', value: getKompensasiSummary(detailForm) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '10px 14px',
                border: '1px solid rgba(26,42,87,0.08)',
                borderRadius: 12,
                background: 'rgba(248,250,252,0.95)',
              }}>
                <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7f7f7f', marginBottom: 4 }}>
                  {label}
                </p>
                <strong style={{ color: 'var(--primary-blue)', fontSize: '0.92rem', wordBreak: 'break-word', overflowWrap: 'break-word', display: 'block' }}>
                  {value || '-'}
                </strong>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
              <p style={{ margin: 0, color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 700 }}>
                Overtime Entries — {totalEntries} employees
              </p>
              {totalEntries > 1 && (
                <span style={{ fontSize: '0.78rem', color: selectedCount === 0 ? '#ef4444' : '#2a9d8f', fontWeight: 600 }}>
                  {selectedCount === 0 ? 'None selected' : `${selectedCount} selected`}
                </span>
              )}
            </div>

            <div className="approval-table-scroll-outer">
              <div
                className="approval-detail-table-wrapper"
                style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
              >
                <div className="approval-mobile-sticky-header">
                  <span>Overtime Entries</span>
                  <span className="approval-mobile-sticky-header__count">{totalEntries} employees</span>
                </div>
                <table className="users-table approval-mobile-table">
                  <thead>
                    <tr>
                      {totalEntries > 1 && (
                        <th style={{ width: 44, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isAllSelected && totalEntries > 0}
                            ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && !isAllSelected; }}
                            onChange={onSelectAll}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                            title="Select all"
                          />
                        </th>
                      )}
                      <th>No</th>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>OT Date</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Task</th>
                      <th>Result</th>
                      <th>Compensation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailForm.entries?.map((entry, idx) => {
                      const isChecked = selectedEntryIndices.has(idx);
                      return (
                        <tr
                          key={idx}
                          style={{
                            opacity: totalEntries > 1 && !isChecked ? 0.45 : 1,
                            transition: 'opacity 0.15s',
                            cursor: totalEntries > 1 ? 'pointer' : 'default',
                          }}
                          onClick={totalEntries > 1 ? () => onToggleEntry(idx) : undefined}
                        >
                          {totalEntries > 1 && (
                            <td data-label="Select" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => onToggleEntry(idx)}
                                style={{ cursor: 'pointer', width: 16, height: 16 }}
                              />
                            </td>
                          )}
                          <td data-label="No" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{idx + 1}</td>
                          <td data-label="Employee Name"><strong className="users-table__name">{entry.name}</strong></td>
                          <td data-label="Employee ID">
                            <span className="users-table__status users-table__status--inline users-table__status--app">
                              {entry.employeeId}
                            </span>
                          </td>
                          <td data-label="Overtime Date">{entry.overtimeDate}</td>
                          <td data-label="Start Time">{entry.startTime}</td>
                          <td data-label="End Time">{entry.endTime}</td>
                          <td data-label="Task">{entry.task}</td>
                          <td data-label="Result">{entry.result}</td>
                          <td data-label="Compensation">
                            <strong style={{ color: '#6d3fa0' }}>{formatKompensasi(entry.compensation)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-popup__actions" style={{ borderTop: '1px solid rgba(26,42,87,0.08)' }}>
          {canUserAct(detailForm) ? (
            <>
              <button type="button" className="dashboard-popup__button dashboard-popup__button--danger" onClick={() => onReject(detailForm)}>
                <CancelIcon sx={{ fontSize: 16 }} />
                Reject
              </button>
              <button
                type="button"
                className="dashboard-popup__button dashboard-popup__button--primary"
                onClick={() => onApprove(detailForm)}
                disabled={selectedCount === 0}
              >
                <CheckCircleIcon sx={{ fontSize: 16 }} />
                {approveLabel}
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#7f7f7f', fontStyle: 'italic' }}>
              You can only view this form
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
