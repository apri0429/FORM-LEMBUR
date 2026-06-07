const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/laporan.controller');

router.get('/filter-options',           ctrl.getFilterOptions);
router.get('/export',                   ctrl.getExport);
router.get('/',                         ctrl.getAll);
router.patch('/entry/:entryId/talenta', ctrl.toggleTalenta);

module.exports = router;
