import React from 'react';
import { FORM_TYPE_CHIP_MAP } from '../../pages/approval/helpers';

export default function FormTypeBadge({ jenisForm, fallback = null }) {
  const cfg = FORM_TYPE_CHIP_MAP[jenisForm];
  if (!cfg) return fallback;
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
