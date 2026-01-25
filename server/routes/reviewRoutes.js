import express from 'express';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.get('/event/:eventId', getEventReviews);

router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;