const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/lembur.controller');
const { validateFormBody, validateApproveBody, validateRejectBody } = require('../middleware/validateLembur');

router.get('/dashboard',         ctrl.getDashboard);
router.get('/filter-options',    ctrl.getFilterOptions);
router.get('/stats',             ctrl.getStats);
router.get('/',                  ctrl.getAll);
router.get('/:id',               ctrl.getById);
router.post('/',                 validateFormBody,   ctrl.create);
router.put('/:id',               validateFormBody,   ctrl.update);
router.post('/:id/approve',      validateApproveBody, ctrl.approve);
router.post('/:id/reject',       validateRejectBody,  ctrl.reject);
router.post('/:id/revert',       ctrl.revert);
router.delete('/:id',            ctrl.remove);

module.exports = router;
