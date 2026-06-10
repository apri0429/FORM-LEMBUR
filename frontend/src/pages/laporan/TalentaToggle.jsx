import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { XClose } from '../../components/layout/icons';

function ConfirmDialog({ done, onConfirm, onClose }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div className="dashboard-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Confirm Action</p>
            <h2 className="dashboard-popup__title">
              {done ? 'Revert to Pending?' : 'Mark as Done?'}
            </h2>
          </div>
          <button type="button" className="dashboard-popup__close" aria-label="Close dialog" onClick={onClose}>
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body">
          <p className="dashboard-popup__text">
            {done
              ? 'This entry will be marked as not yet entered in Talenta.'
              : 'This entry will be marked as already entered in Talenta.'}
          </p>
        </div>

        <div className="dashboard-popup__actions" style={{ gap: 8 }}>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
          >
            No
          </button>
          <button
            type="button"
            className={`dashboard-popup__button ${done ? 'dashboard-popup__button--danger' : 'dashboard-popup__button--primary'}`}
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TalentaToggle({ row, onToggle, isLoading }) {
  const done = !!row.talentaInput;
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(false);
    onToggle(row);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !isLoading && setConfirming(true)}
        disabled={isLoading}
        title={done ? 'Done — click to undo' : 'Not done — click to mark as done'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          height: 26, padding: '0 10px', borderRadius: 13,
          fontSize: '0.77rem', fontWeight: 700,
          cursor: isLoading ? 'wait' : 'pointer',
          border: `1.5px solid ${done ? 'rgba(46,125,50,0.2)' : 'rgba(194,96,0,0.2)'}`,
          background: done ? 'rgba(46,125,50,0.08)' : 'rgba(245,124,0,0.07)',
          color: done ? '#2e7d32' : '#c26000',
          transition: 'all 0.18s',
          outline: 'none',
        }}
      >
        {isLoading
          ? <CircularProgress size={11} color="inherit" />
          : done
            ? <CheckCircleOutlineIcon style={{ fontSize: 14 }} />
            : <RadioButtonUncheckedIcon style={{ fontSize: 14 }} />}
        {done ? 'Done' : 'Pending'}
      </button>

      {confirming && (
        <ConfirmDialog
          done={done}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
