// Check if user has required role
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. No permissions.',
            });
        }

        next();
    };
};

// Check if user is an organizer or admin
export const requireOrganizer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
    }

    if (!req.user.isOrganizer()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Organizer privileges required.',
        });
    }

    next();
};

// Check if user is an admin
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
    }

    if (!req.user.isAdmin()) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
        });
    }

    next();
};

// Check if user owns the resource or is admin
export const requireOwnership = (resourceField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        const resourceId = req.params[resourceField] || req.body[resourceField];

        if (!resourceId) {
            return res.status(400).json({
                success: false,
                message: 'Resource identifier not provided.',
            });
        }

        if (
            req.user._id.toString() !== resourceId.toString() &&
            !req.user.isAdmin()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this resource.',
            });
        }

        next();
    };
};