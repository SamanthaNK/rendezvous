import express from 'express';
import { getEventsInBounds, getEventsInRadius } from '../controllers/mapController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/events', optionalAuth, getEventsInBounds);
router.get('/events/radius', optionalAuth, getEventsInRadius);

export default router;