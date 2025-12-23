import express from 'express';
import {
    getAllEvents,
    getEventById,
    getNearbyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    saveEvent,
    unsaveEvent,
    markInterested,
    unmarkInterested,
    getSavedEvents,
    getInterestedEvents,
    getMyEvents,
} from '../controllers/eventController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { requireOrganizer } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', optionalAuth, getAllEvents);
router.get('/nearby', optionalAuth, getNearbyEvents);
router.get('/:id', optionalAuth, getEventById);

// User
router.get('/user/saved', authenticate, getSavedEvents);
router.get('/user/interested', authenticate, getInterestedEvents);
router.post('/:id/save', authenticate, saveEvent);
router.delete('/:id/save', authenticate, unsaveEvent);
router.post('/:id/interest', authenticate, markInterested);
router.delete('/:id/interest', authenticate, unmarkInterested);

// Organizer
router.get('/organizer/my-events', authenticate, requireOrganizer, getMyEvents);
router.post('/', authenticate, requireOrganizer, createEvent);
router.put('/:id', authenticate, requireOrganizer, updateEvent);
router.delete('/:id', authenticate, requireOrganizer, deleteEvent);

export default router;