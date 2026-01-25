import express from 'express';
import {
  followOrganizer,
  unfollowOrganizer,
  getFollowedOrganizers
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/follow/:organizerId', authenticate, followOrganizer);
router.delete('/follow/:organizerId', authenticate, unfollowOrganizer);
router.get('/followed-organizers', authenticate, getFollowedOrganizers);

export default router;
