import React from 'react';
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import ContentCopyRoundedIcon  from '@mui/icons-material/ContentCopyRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PersonRemoveRoundedIcon  from '@mui/icons-material/PersonRemoveRounded';
import { cardPanelSx } from './constants';

export default function EmployeeTabBar({ entries, tab, done, fErr, addE, dupE, delE, setTab }) {
  return (
    <Box sx={{ ...cardPanelSx, width: '100%', overflow: 'hidden' }}>
      {/* header row */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2.25, sm: 1.5 }, py: { xs: 1.35, sm: 1 }, gap: 1,
        borderBottom: '1px solid rgba(26,42,87,0.07)', bgcolor: 'rgba(26,42,87,0.02)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, overflow: 'hidden' }}>
          <Typography sx={{ fontWeight:800,fontSize:{xs:'0.9rem',sm:'0.72rem'},color:'#1a2a57',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap' }}>
            Employee List
          </Typography>
          <Chip
            label={`${done}/${entries.length}`} size="small"
            color={done === entries.length ? 'success' : 'default'}
            variant={done === entries.length ? 'filled' : 'outlined'}
            sx={{ borderRadius:'7px',fontWeight:700,fontSize:{xs:'0.78rem',sm:'0.62rem'},height:{xs:26,sm:17},px:{xs:0.4,sm:0},flexShrink:0,
              ...(done !== entries.length ? { borderColor:'rgba(26,42,87,0.22)',color:'#2d4a8c' } : {}) }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: { xs: 18, sm: 17 } }} />}
            onClick={addE}
            sx={{
              display:{xs:'none',sm:'inline-flex'},
              minHeight:{xs:38,sm:34},height:{xs:38,sm:34},borderRadius:{xs:'9px',sm:'9px'},
              px:{xs:1.35,sm:1.25},textTransform:'none',fontWeight:800,fontSize:{xs:'0.84rem',sm:'0.78rem'},
              color:'#fff',background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',border:'none',
              boxShadow:'0 2px 8px rgba(42,157,143,0.22)',whiteSpace:'nowrap',
              '& .MuiButton-startIcon':{ mr:{xs:1,sm:0.9} },
              '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 4px 14px rgba(42,157,143,0.34)',transform:'translateY(-1px)'},
              transition:'all .15s',
            }}
          >
            Add Employee
          </Button>
          <Tooltip title="Duplicate entry" placement="top">
            <IconButton size="small" onClick={() => dupE(tab)} sx={{
              width:{xs:38,sm:34},height:{xs:38,sm:34},borderRadius:{xs:'9px',sm:'9px'},
              border:'1px solid rgba(42,157,143,0.28)',color:'#2a9d8f',bgcolor:'rgba(42,157,143,0.06)',
              '&:hover':{bgcolor:'rgba(42,157,143,0.12)',borderColor:'#2a9d8f'},transition:'all .15s',
            }}>
              <ContentCopyRoundedIcon sx={{ fontSize: { xs: 18, sm: 17 } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete entry" placement="top">
            <span>
              <IconButton size="small" onClick={() => delE(tab)} disabled={entries.length === 1} sx={{
                width:{xs:38,sm:34},height:{xs:38,sm:34},borderRadius:{xs:'9px',sm:'9px'},
                border:'1px solid rgba(231,111,81,0.3)',color:'#e76f51',bgcolor:'rgba(231,111,81,0.06)',
                '&:hover':{bgcolor:'rgba(231,111,81,0.12)',borderColor:'#e76f51'},
                '&.Mui-disabled':{opacity:.3,borderColor:'rgba(0,0,0,0.08)'},transition:'all .15s',
              }}>
                <PersonRemoveRoundedIcon sx={{ fontSize: { xs: 18, sm: 17 } }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display:{xs:'block',sm:'none'}, px:2.25, pt:1.15, pb:0.25 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
          onClick={addE}
          sx={{
            minHeight:42,borderRadius:'11px',textTransform:'none',fontWeight:800,fontSize:'0.9rem',
            color:'#fff',background:'linear-gradient(135deg,#2a9d8f 0%,#23857a 100%)',boxShadow:'0 2px 8px rgba(42,157,143,0.22)',
            '& .MuiButton-startIcon':{ mr:1 },
            '&:hover':{background:'linear-gradient(135deg,#23857a 0%,#1c6b62 100%)',boxShadow:'0 4px 14px rgba(42,157,143,0.34)'},
          }}
        >
          Add Employee
        </Button>
      </Box>

      {/* tab pills */}
      <Box sx={{
        display: 'flex', gap: { xs: 0.9, sm: 0.5 }, p: { xs: 1.5, sm: 1 },
        overflowX: { xs: 'auto', md: 'visible' }, overflowY: 'hidden',
        flexWrap: { xs: 'nowrap', md: 'wrap' },
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {entries.map((e, i) => {
          const ok = Boolean(e.name && e.overtimeDate && e.startTime && e.endTime && e.task && e.result && e.compensation);
          const er = Boolean(fErr.entries?.[i]?.name || fErr.entries?.[i]?.overtimeDate);
          const ac = i === tab;
          return (
            <Box key={i} component="button" type="button" onClick={() => setTab(i)} sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0,
              width: 'auto', minWidth: { xs: 'max-content', sm: 'auto' }, justifyContent: 'center',
              px: { xs: 1.6, sm: 1.25 }, py: { xs: 1.15, sm: 0.75 }, borderRadius: { xs: '12px', sm: '8px' },
              cursor: 'pointer', border: 'none',
              background: ac ? '#fff' : 'transparent',
              border: ac ? '1.5px solid var(--accent-teal)' : '1.5px solid rgba(26,42,87,0.1)',
              fontFamily: 'inherit', fontSize: { xs: '0.96rem', sm: '0.75rem' }, fontWeight: ac ? 700 : 500,
              color: er ? '#dc2626' : ac ? 'var(--accent-teal)' : '#64748b',
              whiteSpace: 'nowrap', transition: 'all .15s',
              boxShadow: ac ? '0 1px 6px rgba(42,157,143,0.15)' : 'none',
              animation: `pop .2s cubic-bezier(.22,1,.36,1) ${i * .04}s both`,
              '&:hover': { background: ac ? '#fff' : 'rgba(42,157,143,0.05)', borderColor: 'var(--accent-teal)', color: ac ? 'var(--accent-teal)' : 'var(--accent-teal-dark)' },
            }}>
              <Box sx={{ width:{xs:8,sm:5},height:{xs:8,sm:5},borderRadius:'50%',flexShrink:0,
                bgcolor: er ? '#e76f51' : ok ? 'var(--accent-teal)' : ac ? 'rgba(42,157,143,0.35)' : 'rgba(26,42,87,0.15)' }} />
              <Box sx={{ width:{xs:24,sm:15},height:{xs:24,sm:15},borderRadius:'50%',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:{xs:'0.8rem',sm:'0.55rem'},
                bgcolor: ac ? 'rgba(42,157,143,0.12)' : 'rgba(26,42,87,0.06)', color: ac ? 'var(--accent-teal)' : '#94a3b8' }}>
                {i + 1}
              </Box>
              <Box component="span" sx={{ maxWidth: { xs: 156, sm: 96, md: 110 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.name || `Employee ${i + 1}`}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
