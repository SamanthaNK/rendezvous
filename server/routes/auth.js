import express from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, refreshToken, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    '/register',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number'),
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('First name is required'),
        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required'),
        body('role')
            .optional()
            .isIn(['user', 'organizer'])
            .withMessage('Role must be either user or organizer')
    ],
    handleValidationErrors,
    register
);

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    handleValidationErrors,
    login
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
    '/refresh',
    [
        body('refreshToken')
            .notEmpty()
            .withMessage('Refresh token is required')
    ],
    handleValidationErrors,
    refreshToken
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, logout);

export default router;