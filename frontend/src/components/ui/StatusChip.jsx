import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';

const STATUS_MAP = {
  approved:          { label: 'Approved',   color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved:{ label: 'Approved L1',color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending:           { label: 'Pending',    color: 'default', icon: <PendingActionsRoundedIcon fontSize="small" />, sx: { bgcolor: 'rgba(234,179,8,0.18)', color: '#92640a', '& .MuiChip-icon': { color: '#b07d0c' } } },
  rejected:          { label: 'Rejected',   color: 'error',   icon: <CancelIcon fontSize="small" /> },
};

export default function StatusChip({ status }) {
  const config = STATUS_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} sx={config.sx} />;
}
