import express from 'express';
import {
    getDashboard,
    getProfile,
    updateProfile,
    requestVerification,
    getVerificationStatus,
    getOrganizerEvents,
    getEventAnalytics,
    getPerformanceMetrics,
    getFollowerStats,
} from '../controllers/organizerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOrganizer } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(requireOrganizer);

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/verification/request', requestVerification);
router.get('/verification/status', getVerificationStatus);
router.get('/events', getOrganizerEvents);
router.get('/analytics/:eventId', getEventAnalytics);
router.get('/performance', getPerformanceMetrics);
router.get('/followers', getFollowerStats);

export default router;