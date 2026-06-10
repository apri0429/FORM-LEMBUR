const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/laporan.controller');
const { isHCGAPrivileged } = require('../constants/roles');

function requireLaporanAccess(req, res, next) {
  const user = req.user;
  if (user.role === 'admin') return next();
  if (isHCGAPrivileged(user)) return next();
  return res.status(403).json({
    success: false,
    message: 'Access denied. Only authorized HCGA personnel can view reports.',
  });
}

router.get('/filter-options',           requireLaporanAccess, ctrl.getFilterOptions);
router.get('/export',                   requireLaporanAccess, ctrl.getExport);
router.get('/',                         requireLaporanAccess, ctrl.getAll);
router.patch('/entry/:entryId/talenta', requireLaporanAccess, ctrl.toggleTalenta);

module.exports = router;
