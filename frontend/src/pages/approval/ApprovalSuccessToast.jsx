import React from 'react';
import { Box, Typography } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ApprovalSuccessToast({ success, isRejectToast }) {
  if (!success) return null;

  const toastTitle = isRejectToast ? 'Form Rejected' : 'Form Approved';

  return (
    <Box sx={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1400,
      width: { xs: 'calc(100vw - 32px)', sm: 420 },
      minWidth: { xs: 0, sm: 420 },
      maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
      '@keyframes certIn':    { '0%': { opacity:0, transform:'translate(-50%,-50%) scale(0.82)' }, '60%': { opacity:1, transform:'translate(-50%,-50%) scale(1.03)' }, '100%': { opacity:1, transform:'translate(-50%,-50%) scale(1)' } },
      '@keyframes certOut':   { from: { opacity:1, transform:'translate(-50%,-50%) scale(1)' }, to: { opacity:0, transform:'translate(-50%,-50%) scale(0.9)' } },
      '@keyframes iconPop':   { '0%': { transform:'scale(0) rotate(-30deg)' }, '55%': { transform:'scale(1.18) rotate(6deg)' }, '75%': { transform:'scale(0.92) rotate(-2deg)' }, '100%': { transform:'scale(1) rotate(0deg)' } },
      '@keyframes iconPulseG':{ '0%,100%': { boxShadow:'0 4px 16px rgba(42,157,143,0.5),0 0 0 0 rgba(42,157,143,0.5)' }, '50%': { boxShadow:'0 4px 16px rgba(42,157,143,0.5),0 0 0 10px rgba(42,157,143,0)' } },
      '@keyframes iconPulseR':{ '0%,100%': { boxShadow:'0 4px 16px rgba(220,38,38,0.5),0 0 0 0 rgba(220,38,38,0.5)' }, '50%': { boxShadow:'0 4px 16px rgba(220,38,38,0.5),0 0 0 10px rgba(220,38,38,0)' } },
      '@keyframes shimmer':   { '0%': { backgroundPosition:'-600px 0' }, '100%': { backgroundPosition:'600px 0' } },
      '@keyframes countDown': { '0%': { width:'100%' }, '100%': { width:'0%' } },
      '@keyframes dotBounce': { '0%,80%,100%': { transform:'scale(1)', opacity:0.35 }, '40%': { transform:'scale(1.6)', opacity:1 } },
      '@keyframes floatUp1':  { '0%': { transform:'translateY(0) scale(1)', opacity:0.7 }, '100%': { transform:'translateY(-22px) scale(0.4)', opacity:0 } },
      '@keyframes floatUp2':  { '0%': { transform:'translateY(0) scale(1)', opacity:0.6 }, '100%': { transform:'translateY(-28px) scale(0.3)', opacity:0 } },
      animation: 'certIn 0.6s cubic-bezier(0.22,1,0.36,1) both, certOut 0.35s ease 4.15s forwards',
    }}>
      <Box sx={{
        borderRadius: '20px', p: '3px',
        background: isRejectToast
          ? 'linear-gradient(135deg,#991b1b 0%,#ef4444 40%,#b91c1c 70%,#dc2626 100%)'
          : 'linear-gradient(135deg,#2a9d8f 0%,#5ec9be 40%,#23857a 70%,#2a9d8f 100%)',
        boxShadow: isRejectToast
          ? '0 24px 64px rgba(15,23,42,0.32),0 4px 20px rgba(220,38,38,0.28)'
          : '0 24px 64px rgba(15,23,42,0.32),0 4px 20px rgba(42,157,143,0.3)',
      }}>
        <Box sx={{ borderRadius: '17px', overflow: 'hidden', background: isRejectToast ? '#fff5f5' : '#f0faf9' }}>

          {/* Header */}
          <Box sx={{
            background: isRejectToast
              ? 'linear-gradient(135deg,#450a0a 0%,#7f1d1d 50%,#991b1b 100%)'
              : 'linear-gradient(135deg,#0d3b33 0%,#1a5c54 50%,#1e6b62 100%)',
            px: 2.5, pt: 2, pb: 1.75, display: 'flex', alignItems: 'center', gap: 1.75,
            position: 'relative', overflow: 'hidden',
            '&::after': { content:'""', position:'absolute', inset:0, background: isRejectToast ? 'radial-gradient(ellipse at 80% 50%,rgba(255,255,255,0.08) 0%,transparent 70%)' : 'radial-gradient(ellipse at 80% 50%,rgba(94,201,190,0.15) 0%,transparent 70%)', pointerEvents:'none' },
            '&::before': { content:'""', position:'absolute', inset:0, background: isRejectToast ? 'linear-gradient(90deg,transparent 0%,rgba(255,100,100,0.15) 40%,rgba(255,255,255,0.1) 50%,rgba(255,100,100,0.15) 60%,transparent 100%)' : 'linear-gradient(90deg,transparent 0%,rgba(94,201,190,0.18) 40%,rgba(255,255,255,0.12) 50%,rgba(94,201,190,0.18) 60%,transparent 100%)', backgroundSize:'600px 100%', animation:'shimmer 2.2s linear 0.5s infinite', pointerEvents:'none' },
          }}>
            <Box sx={{
              width:50, height:50, borderRadius:'50%', flexShrink:0,
              background: isRejectToast
                ? 'linear-gradient(135deg,#ef4444 0%,#f87171 60%,#dc2626 100%)'
                : 'linear-gradient(135deg,#2a9d8f 0%,#5ec9be 60%,#23857a 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'2px solid rgba(255,255,255,0.25)',
              animation: isRejectToast
                ? 'iconPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both, iconPulseR 1.8s ease-in-out 0.9s 2'
                : 'iconPop 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s both, iconPulseG 1.8s ease-in-out 0.9s 2',
            }}>
              {isRejectToast
                ? <CancelIcon style={{ fontSize:26, color:'#fff' }} />
                : <CheckCircleIcon style={{ fontSize:26, color:'#fff' }} />}
            </Box>
            <Box sx={{ zIndex:1, flex:1, minWidth:0 }}>
              <Typography sx={{ color: isRejectToast?'#fca5a5':'#5ec9be', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.13em', textTransform:'uppercase', mb:0.4, opacity:0.9 }}>
                Approval
              </Typography>
              <Typography sx={{ color:'#fff', fontWeight:900, fontSize:'1.05rem', lineHeight:1.25, letterSpacing:'-0.01em' }}>
                {toastTitle}
              </Typography>
            </Box>
          </Box>

          {/* Countdown bar */}
          <Box sx={{ height:3, background: isRejectToast?'rgba(220,38,38,0.15)':'rgba(42,157,143,0.15)', position:'relative', overflow:'hidden' }}>
            <Box sx={{
              position:'absolute', left:0, top:0, height:'100%',
              background: isRejectToast
                ? 'linear-gradient(90deg,#991b1b,#ef4444,#f87171,#ef4444,#991b1b)'
                : 'linear-gradient(90deg,#23857a,#2a9d8f,#5ec9be,#2a9d8f,#23857a)',
              animation:'countDown 4.5s linear 0s forwards',
            }} />
          </Box>

          {/* Body */}
          <Box sx={{ px:2.5, py:2, background: isRejectToast?'linear-gradient(180deg,#fff5f5,#fee2e2)':'linear-gradient(180deg,#f0faf9,#e4f5f3)', textAlign:'center' }}>
            <Box sx={{ display:'flex', justifyContent:'center', gap:0.6, mb:1.75 }}>
              {[0,1,2,3,4].map(i => (
                <Box key={i} sx={{
                  width:i===2?7:4, height:i===2?7:4, borderRadius:'50%',
                  background: i===2 ? (isRejectToast?'#ef4444':'#2a9d8f') : (isRejectToast?'rgba(239,68,68,0.35)':'rgba(42,157,143,0.35)'),
                  mt: i===2?'-1.5px':0,
                  animation:`dotBounce 1.2s ease-in-out ${0.6+i*0.12}s 3`,
                }} />
              ))}
            </Box>

            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.75, px:1.5, py:0.9, borderRadius:'10px', background: isRejectToast?'rgba(239,68,68,0.08)':'rgba(42,157,143,0.12)', border:`1px solid ${isRejectToast?'rgba(239,68,68,0.2)':'rgba(42,157,143,0.25)'}` }}>
              {isRejectToast
                ? <CancelIcon style={{ fontSize:15, color:'#dc2626', flexShrink:0 }} />
                : <CheckCircleIcon style={{ fontSize:15, color:'#2a9d8f', flexShrink:0 }} />}
              <Typography sx={{ fontSize:'0.79rem', fontWeight:600, color: isRejectToast?'#7f1d1d':'#1a5c54', lineHeight:1.45 }}>
                {success}
              </Typography>
            </Box>

            <Box sx={{ display:'flex', justifyContent:'center', gap:0.6, mt:1.75 }}>
              {[0,1,2,3,4].map(i => (
                <Box key={i} sx={{
                  width:i===2?7:4, height:i===2?7:4, borderRadius:'50%',
                  background: i===2 ? (isRejectToast?'#ef4444':'#2a9d8f') : (isRejectToast?'rgba(239,68,68,0.35)':'rgba(42,157,143,0.35)'),
                  mt: i===2?'-1.5px':0,
                  animation: i%2===0 ? `floatUp1 1.4s ease-out ${1.4+i*0.2}s 2` : `floatUp2 1.6s ease-out ${1.6+i*0.18}s 2`,
                }} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
