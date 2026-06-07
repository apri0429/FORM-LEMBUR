import React from 'react';
import { CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

export default function TalentaToggle({ row, onToggle, isLoading }) {
  const done = !!row.talentaInput;
  return (
    <button
      type="button"
      onClick={() => onToggle(row)}
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
  );
}
