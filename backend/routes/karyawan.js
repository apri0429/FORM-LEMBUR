const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/karyawan.controller');

router.get('/',                                          ctrl.getAll);
router.get('/departments',                               ctrl.getDepartments);
router.get('/managers',                                  ctrl.getSupervisors);
router.get('/approval-chain',                            ctrl.getApprovalChain);
router.get('/user/:userId/departments',                  ctrl.getUserDepartments);
router.post('/user/:userId/departments',                 ctrl.addUserDepartment);
router.delete('/user/:userId/departments/:deptId',       ctrl.removeUserDepartment);
router.patch('/user/:userId/departments/:deptId/primary',ctrl.setPrimaryDepartment);
router.get('/:employeeId',                               ctrl.getByEmployeeId);

module.exports = router;
