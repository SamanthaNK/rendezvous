import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to authenticate JWT tokens
 * Attaches user data to req.user if token is valid
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token'
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};