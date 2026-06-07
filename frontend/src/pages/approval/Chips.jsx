import React from 'react';
import { Chip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { FORM_TYPE_CHIP_MAP } from './helpers';

const STATUS_CHIP_MAP = {
  approved:          { label: 'Disetujui',    color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved:{ label: 'Disetujui L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending:           { label: 'Menunggu',     color: 'default', icon: <PendingActionsRoundedIcon fontSize="small" /> },
  rejected:          { label: 'Ditolak',      color: 'error',   icon: <CancelIcon fontSize="small" /> },
};

export function FormTypeBadge({ jenisForm }) {
  const cfg = FORM_TYPE_CHIP_MAP[jenisForm];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 24, padding: '0 8px', borderRadius: 12,
      fontSize: '0.8125rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      <Icon style={{ fontSize: 14, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

export function ApprovalStatusChip({ status }) {
  const config = STATUS_CHIP_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}
