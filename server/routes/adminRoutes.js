import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkAdminRole } from '../middleware/roleCheck.js';
import {
  getDashboard,
  getFlaggedEvents,
  moderateEvent,
  getReports,
  resolveReport,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  banUser,
  unbanUser
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, checkAdminRole);

router.get('/dashboard', getDashboard);
router.get('/events/flagged', getFlaggedEvents);
router.post('/events/:id/moderate', moderateEvent);
router.get('/reports', getReports);
router.post('/reports/:id/resolve', resolveReport);
router.get('/verification/requests', getVerificationRequests);
router.post('/verification/:id/approve', approveVerification);
router.post('/verification/:id/reject', rejectVerification);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);

export default router;
