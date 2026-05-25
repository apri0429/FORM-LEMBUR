import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

const STATUS_MAP = {
  approved: { label: 'Disetujui', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  partially_approved: { label: 'Approval L1', color: 'warning', icon: <ThumbUpIcon fontSize="small" /> },
  pending: { label: 'Menunggu', color: 'default', icon: <HourglassEmptyIcon fontSize="small" /> },
  rejected: { label: 'Ditolak', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

export default function StatusChip({ status }) {
  const config = STATUS_MAP[status] ?? { label: status || '-', color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
}
