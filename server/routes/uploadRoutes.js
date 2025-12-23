import express from 'express';
import { uploadEventImages, deleteEventImages } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOrganizer } from '../middleware/roleCheck.js';
import { uploadImages, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
    '/images',
    authenticate,
    requireOrganizer,
    uploadImages,
    handleMulterError,
    uploadEventImages
);

router.delete('/images', authenticate, requireOrganizer, deleteEventImages);

export default router;