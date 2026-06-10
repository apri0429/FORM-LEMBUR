const BOD_KEYS     = ['director', 'commissioner', 'komisaris', 'president director'];
const MANAGER_KEYS = ['manager', 'supervisor', 'spv', 'kepala', 'head', 'koordinator', 'lead'];

/**
 * HCGA privileged = HCGA Manager-level OR user named Elvira.
 * user object needs: department, jobLevel, name (all from JWT payload).
 */
function isHCGAPrivileged(user) {
  if ((user.department || '').toUpperCase() !== 'HCGA') return false;
  const jobLevel = (user.jobLevel || '').toLowerCase();
  const isMgr    = MANAGER_KEYS.some(k => jobLevel.includes(k));
  const isElvira = (user.name || '').toLowerCase().includes('elvira');
  return isMgr || isElvira;
}

module.exports = { BOD_KEYS, MANAGER_KEYS, isHCGAPrivileged };
