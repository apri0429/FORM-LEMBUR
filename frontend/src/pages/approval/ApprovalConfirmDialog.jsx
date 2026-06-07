import React from 'react';
import { createPortal } from 'react-dom';
import { CircularProgress, TextField } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { XClose } from '../../components/layout/icons';
import { getKompensasiSummary } from './helpers';

export default function ApprovalConfirmDialog({ dialog, catatan, onCatatanChange, submitting, onClose, onConfirm }) {
  if (!dialog.open || typeof document === 'undefined') return null;

  const isApprove = dialog.action === 'approve';

  return createPortal(
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">
              {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
            </p>
            <h2 className="dashboard-popup__title">
              {isApprove ? 'Approve Overtime Form' : 'Reject Overtime Form'}
            </h2>
          </div>
          <button type="button" className="dashboard-popup__close" aria-label="Close dialog" onClick={onClose}>
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body">
          {dialog.form && (
            <>
              <div style={{
                background: 'rgba(26,42,87,0.04)',
                border: '1px solid rgba(26,42,87,0.08)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'grid',
                gap: 4,
              }}>
                <p className="dashboard-popup__text"><strong>Form:</strong> {dialog.form.formNumber}</p>
                <p className="dashboard-popup__text"><strong>Department:</strong> {dialog.form.department}</p>
                <p className="dashboard-popup__text"><strong>Requested By:</strong> {dialog.form.requestedBy}</p>
                <p className="dashboard-popup__text"><strong>Compensation:</strong> {getKompensasiSummary(dialog.form)}</p>
                {isApprove && dialog.entryIndices ? (
                  <p className="dashboard-popup__text">
                    <strong>Approved employees:</strong>{' '}
                    <span style={{ color: '#2a9d8f', fontWeight: 700 }}>
                      {dialog.entryIndices.length} of {dialog.form.entries?.length} employees
                    </span>
                  </p>
                ) : (
                  <p className="dashboard-popup__text">
                    <strong>Total Employees:</strong> {dialog.form.entries?.length} employees
                  </p>
                )}
              </div>

              <TextField
                fullWidth multiline rows={3}
                label="Notes (optional)"
                placeholder={
                  isApprove
                    ? 'e.g. Approved based on operational needs...'
                    : 'e.g. Rejected - incomplete documents...'
                }
                value={catatan}
                onChange={(e) => onCatatanChange(e.target.value)}
                size="small"
              />
            </>
          )}
        </div>

        <div className="dashboard-popup__actions" style={{ gap: 8 }}>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`dashboard-popup__button ${isApprove ? 'dashboard-popup__button--primary' : 'dashboard-popup__button--danger'}`}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting && <CircularProgress size={14} color="inherit" style={{ marginRight: 8 }} />}
            {submitting ? 'Processing...' : isApprove ? 'Yes, Approve' : 'Yes, Reject'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
