/**
 * Middleware to check user roles for authorization
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'User role not found'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Convenience middleware for specific roles
 */
export const requireUser = checkRole('user', 'organizer', 'admin');
export const requireOrganizer = checkRole('organizer', 'admin');
export const requireAdmin = checkRole('admin');