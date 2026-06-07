import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';

export default function SuccessToast({ success, isEdit, formNum }) {
  if (!success) return null;
  return (
    <Box sx={{
      position: 'fixed',
      top: '50%', left: { xs: 12, sm: '50%' },
      right: { xs: 12, sm: 'auto' },
      transform: { xs: 'translateY(-50%)', sm: 'translate(-50%, -50%)' },
      zIndex: 1400,
      width: { xs: 'calc(100% - 24px)', sm: 420 },
      minWidth: { xs: 0, sm: 420 },
      maxWidth: { xs: 'calc(100% - 24px)', sm: 420 },
      '@keyframes certIn': {
        '0%':   { opacity: 0, transform: 'translate(-50%, -50%) scale(0.82)' },
        '60%':  { opacity: 1, transform: 'translate(-50%, -50%) scale(1.03)' },
        '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
      },
      '@keyframes certOut': { from: { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }, to: { opacity: 0, transform: 'translate(-50%,-50%) scale(0.9)' } },
      '@keyframes iconPop': {
        '0%':   { transform: 'scale(0) rotate(-30deg)' },
        '55%':  { transform: 'scale(1.18) rotate(6deg)' },
        '75%':  { transform: 'scale(0.92) rotate(-2deg)' },
        '100%': { transform: 'scale(1) rotate(0deg)' },
      },
      '@keyframes iconPulse': {
        '0%,100%': { boxShadow: '0 4px 16px rgba(42,157,143,0.5), 0 0 0 0 rgba(42,157,143,0.5)' },
        '50%':     { boxShadow: '0 4px 16px rgba(42,157,143,0.5), 0 0 0 10px rgba(42,157,143,0)' },
      },
      '@keyframes shimmer': {
        '0%':   { backgroundPosition: '-600px 0' },
        '100%': { backgroundPosition: '600px 0' },
      },
      '@keyframes countDown': {
        '0%':   { width: '100%' },
        '100%': { width: '0%' },
      },
      '@keyframes dotBounce': {
        '0%,80%,100%': { transform: 'scale(1)', opacity: 0.35 },
        '40%':         { transform: 'scale(1.6)', opacity: 1 },
      },
      '@keyframes floatUp1': {
        '0%':   { transform: 'translateY(0) scale(1)', opacity: 0.7 },
        '100%': { transform: 'translateY(-22px) scale(0.4)', opacity: 0 },
      },
      '@keyframes floatUp2': {
        '0%':   { transform: 'translateY(0) scale(1)', opacity: 0.6 },
        '100%': { transform: 'translateY(-28px) scale(0.3)', opacity: 0 },
      },
      animation: 'certIn 0.6s cubic-bezier(0.22,1,0.36,1) both, certOut 0.35s ease 4.15s forwards',
      display: { xs: 'none', sm: 'block' },
    }}>
      {/* Outer green border */}
      <Box sx={{
        borderRadius: '20px', p: '3px',
        background: 'linear-gradient(135deg, #2a9d8f 0%, #5ec9be 40%, #23857a 70%, #2a9d8f 100%)',
        boxShadow: '0 24px 64px rgba(15,23,42,0.32), 0 4px 20px rgba(42,157,143,0.3)',
      }}>
        {/* Inner card */}
        <Box sx={{ borderRadius: '17px', overflow: 'hidden', background: '#f0faf9' }}>

          {/* Header — dark teal */}
          <Box sx={{
            background: 'linear-gradient(135deg, #0d3b33 0%, #1a5c54 50%, #1e6b62 100%)',
            px: 2.5, pt: 2, pb: 1.75,
            display: 'flex', alignItems: 'center', gap: 1.75,
            position: 'relative', overflow: 'hidden',
            '&::after': {
              content: '""', position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 80% 50%, rgba(94,201,190,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
            /* shimmer sweep */
            '&::before': {
              content: '""', position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(94,201,190,0.18) 40%, rgba(255,255,255,0.12) 50%, rgba(94,201,190,0.18) 60%, transparent 100%)',
              backgroundSize: '600px 100%',
              animation: 'shimmer 2.2s linear 0.5s infinite',
              pointerEvents: 'none',
            },
          }}>
            {/* Green badge with pop + pulse */}
            <Box sx={{
              width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2a9d8f 0%, #5ec9be 60%, #23857a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.25)',
              animation: 'iconPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both, iconPulse 1.8s ease-in-out 0.9s 2',
            }}>
              <TaskAltRoundedIcon sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
            <Box sx={{ zIndex: 1, flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#5ec9be', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', mb: 0.4, opacity: 0.9 }}>
                Overtime Request
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                {isEdit ? 'Changes Saved Successfully' : 'Request Submitted!'}
              </Typography>
            </Box>
          </Box>

          {/* Countdown progress bar */}
          <Box sx={{ height: 3, background: 'rgba(42,157,143,0.15)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              background: 'linear-gradient(90deg, #23857a 0%, #2a9d8f 40%, #5ec9be 70%, #2a9d8f 100%)',
              animation: 'countDown 4.5s linear 0s forwards',
            }} />
          </Box>

          {/* Certificate body */}
          <Box sx={{ px: 2.5, py: 2, background: 'linear-gradient(180deg, #f0faf9 0%, #e4f5f3 100%)', textAlign: 'center' }}>
            {/* Bouncing dots */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.6, mb: 1.75 }}>
              {[0,1,2,3,4].map(i => (
                <Box key={i} sx={{
                  width: i === 2 ? 7 : 4, height: i === 2 ? 7 : 4, borderRadius: '50%',
                  background: i === 2 ? '#2a9d8f' : 'rgba(42,157,143,0.35)',
                  mt: i === 2 ? '-1.5px' : 0,
                  animation: `dotBounce 1.2s ease-in-out ${0.6 + i * 0.12}s 3`,
                }} />
              ))}
            </Box>

            {formNum && !isEdit && (
              <>
                <Typography sx={{ fontSize: '0.65rem', color: '#1a5c54', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
                  Form Number
                </Typography>
                <Typography sx={{
                  fontSize: '1.3rem', fontWeight: 900, color: '#0d3b33', letterSpacing: '0.06em',
                  fontFamily: "'IBM Plex Mono', monospace",
                  mb: 1.25,
                }}>
                  {formNum}
                </Typography>
              </>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, px: 1.5, py: 0.9, borderRadius: '10px', background: 'rgba(42,157,143,0.12)', border: '1px solid rgba(42,157,143,0.25)' }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 15, color: '#2a9d8f', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: '#1a5c54', lineHeight: 1.45 }}>
                {formNum && !isEdit
                  ? 'Your overtime request has been submitted and forwarded for approval.'
                  : success}
              </Typography>
            </Box>

            {/* Bottom floating dots */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.6, mt: 1.75 }}>
              {[0,1,2,3,4].map(i => (
                <Box key={i} sx={{
                  width: i === 2 ? 7 : 4, height: i === 2 ? 7 : 4, borderRadius: '50%',
                  background: i === 2 ? '#2a9d8f' : 'rgba(42,157,143,0.35)',
                  mt: i === 2 ? '-1.5px' : 0,
                  animation: i % 2 === 0
                    ? `floatUp1 1.4s ease-out ${1.4 + i * 0.2}s 2`
                    : `floatUp2 1.6s ease-out ${1.6 + i * 0.18}s 2`,
                }} />
              ))}
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
