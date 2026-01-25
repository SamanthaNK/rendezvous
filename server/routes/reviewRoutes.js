import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createReview,
  getEventReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', authenticate, createReview);
router.get('/event/:eventId', getEventReviews);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
