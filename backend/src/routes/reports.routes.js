import { Router } from 'express';
import {
  getSummary,
  getByEmployee,
  getByProject,
  whoLoggedToday,
  exportReport,
  getHoursLog,
} from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import asyncHandler from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Accessible to all authenticated users — employees only see their own data
router.get('/hours-log', asyncHandler(getHoursLog));

// hr_finance and above (hr_finance, dept_manager, org_admin, super_admin)
router.get('/summary', requireRole('hr_finance'), asyncHandler(getSummary));
router.get('/by-employee', requireRole('hr_finance'), asyncHandler(getByEmployee));
router.get('/by-project', requireRole('hr_finance'), asyncHandler(getByProject));
router.get('/who-logged-today', requireRole('hr_finance'), asyncHandler(whoLoggedToday));
router.get('/export', requireRole('hr_finance'), asyncHandler(exportReport));

export default router;
