import express from 'express';
import {
    naturalLanguageSearch,
    getSearchSuggestions,
} from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, naturalLanguageSearch);
router.get('/suggestions', getSearchSuggestions);

export default router;